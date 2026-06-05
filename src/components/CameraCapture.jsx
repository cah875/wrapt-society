import { useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { CameraIcon, RefreshIcon, CheckIcon, XIcon, AlertIcon } from './Icons.jsx';

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
  // 'first' | 'decide' | 'second' | 'both'
  const [phase, setPhase] = useState('first');

  useEffect(() => {
    if (cam.devices.length) onCamerasEnumerated?.(cam.devices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam.devices]);

  const takePhoto = () => {
    const img = cam.capture();
    if (!img) return;
    if (phase === 'second') {
      setShot2(img);
      setPhase('both');
    } else {
      setShot1(img);
      setPhase(allowSecondSide ? 'decide' : 'first');
    }
  };

  const retake = () => {
    if (phase === 'both' || phase === 'second') {
      setShot2(null);
      setPhase('second');
    } else {
      setShot1(null);
      setPhase('first');
    }
    cam.restart();
  };

  const processOne = () => onCapture(shot1);
  const processTwo = () => onCapture([shot1, shot2]);
  const goSecond = () => { setPhase('second'); cam.restart(); };

  const title = () => {
    if (phase === 'decide') return 'Front Captured';
    if (phase === 'second') return 'Capture Back of Package';
    if (phase === 'both') return 'Both Sides Captured';
    return shot1 ? 'Confirm Photo' : 'Capture Packaging Photo';
  };

  const showVideo = phase === 'first' || phase === 'second';
  const activeShot = phase === 'both' ? shot2 : (shot1 || null);

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">{title()}</h2>
        {cam.devices.length > 1 && showVideo && (
          <select
            value={cam.activeDeviceId}
            onChange={(e) => { cam.switchDevice(e.target.value); onSelectDevice?.(e.target.value); }}
            className="field-input h-10 w-auto max-w-[12rem] py-1 text-sm"
            aria-label="Select camera"
          >
            {cam.devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
            ))}
          </select>
        )}
      </div>

      {/* Thumbnail strip when both shots are taken */}
      {phase === 'both' && (
        <div className="flex gap-2">
          <div className="relative flex-1 overflow-hidden rounded-lg border border-clinical-200 dark:border-clinical-700">
            <img src={shot1} alt="Front" className="h-24 w-full object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">Front</span>
          </div>
          <div className="relative flex-1 overflow-hidden rounded-lg border border-clinical-200 dark:border-clinical-700">
            <img src={shot2} alt="Back" className="h-24 w-full object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">Back</span>
          </div>
        </div>
      )}

      {/* Video / still viewport */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <video
          ref={cam.videoRef}
          playsInline
          muted
          className={`h-full w-full object-contain ${showVideo ? 'block' : 'hidden'}`}
        />
        {!showVideo && activeShot && (
          <img src={activeShot} alt="Captured" className="h-full w-full object-contain" />
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
            <button onClick={cam.restart} className="btn-ghost"><RefreshIcon width={18} height={18} /> Retry</button>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 text-white">
            <RefreshIcon className="animate-spin" width={40} height={40} />
            <span className="text-lg font-semibold">Reading label with Claude Vision…</span>
          </div>
        )}
      </div>

      {/* Action row */}
      {phase === 'first' && !shot1 && (
        <div className="flex flex-col gap-3">
          <button onClick={takePhoto} disabled={!cam.ready || busy} className="btn-success btn-xl w-full">
            <CameraIcon width={36} height={36} /> CAPTURE PHOTO
          </button>
          <button onClick={onManualEntry} className="btn-ghost w-full" disabled={busy}>Enter manually instead</button>
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
