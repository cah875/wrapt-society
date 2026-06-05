import { useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { useCameraEnhancements } from '../hooks/useCameraEnhancements.js';
import { CameraIcon, RefreshIcon, CheckIcon, XIcon, AlertIcon } from './Icons.jsx';

/** Sharpness badge shown over the live feed. */
function SharpnessBadge({ isSharp, score }) {
  if (isSharp === null) return null;
  return (
    <div className={`absolute left-2 top-2 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow ${
      isSharp
        ? 'bg-green-600/90 text-white'
        : 'bg-red-600/90 text-white animate-pulse'
    }`}>
      {isSharp ? '✓ SHARP' : '✗ BLURRY'} {score != null && <span className="opacity-70">({score})</span>}
    </div>
  );
}

/** Framing guide overlay — dashed rectangle at label proportions. */
function FramingGuide() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="h-[55%] w-[80%] rounded border-2 border-dashed border-white/60 shadow-inner" />
      <span className="absolute bottom-[23%] text-[10px] font-semibold text-white/50 tracking-widest">
        ALIGN LABEL HERE
      </span>
    </div>
  );
}

/**
 * Collapsible camera-controls panel: software brightness/contrast/sharpness
 * sliders + optional hardware zoom/focus if the camera exposes them.
 */
function CameraControls({ enh, show, onToggle }) {
  const hasHw = enh.hwCaps && (enh.hwCaps.zoom || enh.hwCaps.focusDistance);
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg bg-clinical-50 px-3 py-2 text-xs font-semibold text-clinical-500 hover:bg-clinical-100 dark:bg-clinical-800 dark:text-clinical-400"
      >
        <span>⚙ Camera Controls</span>
        <span>{show ? '▲' : '▼'}</span>
      </button>

      {show && (
        <div className="mt-2 space-y-3 rounded-lg border border-clinical-200 bg-clinical-50 p-3 dark:border-clinical-700 dark:bg-clinical-800">
          <Slider label="Brightness" value={enh.brightness} min={50} max={200} step={5}
            onChange={enh.setBrightness} reset={() => enh.setBrightness(100)} unit="%" />
          <Slider label="Contrast" value={enh.contrast} min={50} max={250} step={5}
            onChange={enh.setContrast} reset={() => enh.setContrast(100)} unit="%" />
          <Slider label="Sharpen" value={enh.sharpness} min={0} max={3} step={1}
            onChange={enh.setSharpness} reset={() => enh.setSharpness(0)} unit="" />

          {hasHw && (
            <>
              <div className="border-t border-clinical-200 pt-2 text-xs font-semibold text-clinical-400 dark:border-clinical-700">
                Hardware (camera-dependent)
              </div>
              {enh.hwCaps.zoom && (
                <Slider label="Zoom" value={enh.hwZoom ?? enh.hwCaps.zoom.min}
                  min={enh.hwCaps.zoom.min} max={enh.hwCaps.zoom.max} step={enh.hwCaps.zoom.step || 0.1}
                  onChange={(v) => enh.applyHardware({ zoom: v })} reset={() => enh.applyHardware({ zoom: enh.hwCaps.zoom.min })} unit="×" />
              )}
              {enh.hwCaps.focusDistance && (
                <Slider label="Focus" value={enh.hwFocus ?? enh.hwCaps.focusDistance.min}
                  min={enh.hwCaps.focusDistance.min} max={enh.hwCaps.focusDistance.max}
                  step={enh.hwCaps.focusDistance.step || 1}
                  onChange={(v) => enh.applyHardware({ focusMode: 'manual', focusDistance: v })}
                  reset={() => enh.applyHardware({ focusMode: 'continuous' })} unit="" />
              )}
            </>
          )}

          <button type="button" onClick={enh.reset}
            className="w-full rounded bg-clinical-200 px-2 py-1 text-xs text-clinical-600 hover:bg-clinical-300 dark:bg-clinical-700 dark:text-clinical-300">
            Reset all to default
          </button>
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, reset, unit }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-clinical-500">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 accent-clinical-500" />
      <span className="w-10 text-right text-xs tabular-nums text-clinical-500">
        {typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : value}{unit}
      </span>
      <button type="button" onClick={reset} className="text-xs text-clinical-400 hover:text-clinical-600">↺</button>
    </div>
  );
}

/**
 * Live webcam view + capture flow.
 *
 * States:
 *   live → shot1 (Retake / Confirm / [Add other side]) → [live for shot2] →
 *   shot2 (Retake side 2 / Process both) → onCapture([shot1, shot2])
 *
 * When allowSecondSide is false (default) the "Add other side" step is skipped
 * and onCapture receives a single image string as before.
 */
export default function CameraCapture({
  preferredDeviceId,
  busy,
  onCapture,
  onManualEntry,
  onSelectDevice,
  onCamerasEnumerated,
  allowSecondSide = false,
}) {
  const cam = useCamera(preferredDeviceId);
  const [shot1, setShot1] = useState(null);
  const [shot2, setShot2] = useState(null);
  const [phase, setPhase] = useState('first'); // 'first'|'decide'|'second'|'both'
  const [showControls, setShowControls] = useState(false);

  const showVideo = phase === 'first' || phase === 'second';
  const enh = useCameraEnhancements(cam.videoRef, showVideo && cam.ready);

  useEffect(() => {
    if (cam.devices.length) onCamerasEnumerated?.(cam.devices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam.devices]);

  /** Capture current frame, applying software filter to canvas before encoding. */
  const takePhoto = () => {
    const video = cam.videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Bake the software filter into the captured image.
    if (enh.filterStyle !== 'none') ctx.filter = enh.filterStyle;
    ctx.drawImage(video, 0, 0);
    const img = canvas.toDataURL('image/jpeg', 0.92);
    if (phase === 'second') { setShot2(img); setPhase('both'); }
    else if (allowSecondSide) { setShot1(img); setPhase('decide'); }
    else { onCapture(img); }
  };

  const retake = () => {
    if (phase === 'both' || phase === 'second') { setShot2(null); setPhase('second'); }
    else { setShot1(null); setPhase('first'); }
    cam.restart();
  };

  const processOne = () => onCapture(shot1);
  const processTwo = () => onCapture([shot1, shot2]);
  const goSecond = () => { setPhase('second'); cam.restart(); };

  const titleText = () => {
    if (phase === 'decide') return 'Front Captured';
    if (phase === 'second') return 'Capture Back of Package';
    if (phase === 'both') return 'Both Sides Captured';
    return 'Capture Packaging Photo';
  };

  const activeShot = phase === 'both' ? shot2 : (shot1 || null);

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">{titleText()}</h2>
        {cam.devices.length > 1 && showVideo && (
          <select value={cam.activeDeviceId}
            onChange={(e) => { cam.switchDevice(e.target.value); onSelectDevice?.(e.target.value); }}
            className="field-input h-10 w-auto max-w-[12rem] py-1 text-sm" aria-label="Select camera">
            {cam.devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
            ))}
          </select>
        )}
      </div>

      {/* Thumbnail strip (two-photo) */}
      {phase === 'both' && (
        <div className="flex gap-2">
          {[shot1, shot2].map((src, i) => (
            <div key={i} className="relative flex-1 overflow-hidden rounded-lg border border-clinical-200 dark:border-clinical-700">
              <img src={src} alt={i === 0 ? 'Front' : 'Back'} className="h-24 w-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                {i === 0 ? 'Front' : 'Back'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Video / still viewport */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <video ref={cam.videoRef} playsInline muted
          style={{ filter: showVideo ? enh.filterStyle : undefined }}
          className={`h-full w-full object-contain ${showVideo ? 'block' : 'hidden'}`} />

        {!showVideo && activeShot && (
          <img src={activeShot} alt="Captured" className="h-full w-full object-contain" />
        )}

        {/* Framing guide (live only) */}
        {showVideo && cam.ready && !busy && <FramingGuide />}

        {/* Sharpness badge (live only) */}
        {showVideo && cam.ready && !busy && (
          <SharpnessBadge isSharp={enh.isSharp} score={enh.blurScore} />
        )}

        {!cam.ready && showVideo && !cam.error && (
          <div className="absolute inset-0 flex items-center justify-center text-clinical-200">
            <RefreshIcon className="animate-spin" width={36} height={36} />
            <span className="ml-3">Starting camera…</span>
          </div>
        )}
        {cam.error && showVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <AlertIcon width={40} height={40} className="text-amber-300" />
            <p className="max-w-sm">{cam.error}</p>
            <button onClick={cam.restart} className="btn-ghost">
              <RefreshIcon width={18} height={18} /> Retry
            </button>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
            <RefreshIcon className="animate-spin" width={40} height={40} />
            <span className="text-lg font-semibold">Reading label with Claude Vision…</span>
          </div>
        )}
      </div>

      {/* Camera controls (live view only) */}
      {showVideo && cam.ready && (
        <CameraControls enh={enh} show={showControls} onToggle={() => setShowControls((s) => !s)} />
      )}

      {/* Action row */}
      {phase === 'first' && !shot1 && (
        <div className="flex flex-col gap-3">
          <button onClick={takePhoto} disabled={!cam.ready || busy} className="btn-success btn-xl w-full">
            <CameraIcon width={36} height={36} /> CAPTURE PHOTO
          </button>
          <button onClick={onManualEntry} className="btn-ghost w-full" disabled={busy}>
            Enter manually instead
          </button>
        </div>
      )}

      {phase === 'decide' && (
        <div className="flex flex-col gap-3">
          <button onClick={goSecond} disabled={busy} className="btn-primary btn-xl w-full">
            <CameraIcon width={28} height={28} /> SCAN OTHER SIDE TOO
          </button>
          <button onClick={processOne} disabled={busy} className="btn-ghost w-full">
            <CheckIcon width={20} height={20} /> Process this photo only
          </button>
          <button onClick={retake} disabled={busy} className="btn-ghost w-full text-sm">
            <XIcon width={18} height={18} /> Retake
          </button>
        </div>
      )}

      {phase === 'second' && (
        <div className="flex flex-col gap-3">
          <button onClick={takePhoto} disabled={!cam.ready || busy} className="btn-success btn-xl w-full">
            <CameraIcon width={36} height={36} /> CAPTURE BACK
          </button>
          <button onClick={retake} disabled={busy} className="btn-ghost w-full text-sm">
            <XIcon width={18} height={18} /> Retake front instead
          </button>
        </div>
      )}

      {phase === 'both' && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={retake} disabled={busy} className="btn-ghost btn-xl">
            <XIcon width={28} height={28} /> RETAKE BACK
          </button>
          <button onClick={processTwo} disabled={busy} className="btn-primary btn-xl">
            <CheckIcon width={28} height={28} /> PROCESS BOTH
          </button>
        </div>
      )}
    </div>
  );
}
