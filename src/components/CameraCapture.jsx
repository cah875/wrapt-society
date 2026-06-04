import { useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera.js';
import { CameraIcon, RefreshIcon, CheckIcon, XIcon, AlertIcon } from './Icons.jsx';

/**
 * Live webcam view + capture flow.
 * States: live preview → captured still (Retake / Confirm) → onCapture(image).
 */
export default function CameraCapture({
  preferredDeviceId,
  busy,
  onCapture,
  onManualEntry,
  onSelectDevice,
  onCamerasEnumerated,
}) {
  const cam = useCamera(preferredDeviceId);
  const [shot, setShot] = useState(null);

  // Surface the enumerated camera list to the parent (for Settings dropdown).
  useEffect(() => {
    if (cam.devices.length) onCamerasEnumerated?.(cam.devices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cam.devices]);

  const takePhoto = () => {
    const img = cam.capture();
    if (img) setShot(img);
  };

  const confirm = () => {
    if (shot) onCapture(shot);
  };

  const retake = () => {
    setShot(null);
    cam.restart();
  };

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
          {shot ? 'Confirm Photo' : 'Capture Packaging Photo'}
        </h2>
        {cam.devices.length > 1 && !shot && (
          <select
            value={cam.activeDeviceId}
            onChange={(e) => {
              cam.switchDevice(e.target.value);
              onSelectDevice?.(e.target.value);
            }}
            className="field-input h-10 w-auto max-w-[12rem] py-1 text-sm"
            aria-label="Select camera"
          >
            {cam.devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Video / still viewport */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {/* Keep the video mounted (hidden) while showing a still, so retake is instant. */}
        <video
          ref={cam.videoRef}
          playsInline
          muted
          className={`h-full w-full object-contain ${shot ? 'hidden' : 'block'}`}
        />
        {shot && (
          <img src={shot} alt="Captured packaging" className="h-full w-full object-contain" />
        )}

        {!cam.ready && !shot && !cam.error && (
          <div className="absolute inset-0 flex items-center justify-center text-clinical-200">
            <RefreshIcon className="animate-spin" width={36} height={36} />
            <span className="ml-3">Starting camera…</span>
          </div>
        )}

        {cam.error && !shot && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <AlertIcon width={40} height={40} className="text-amber-300" />
            <p className="max-w-sm">{cam.error}</p>
            <button onClick={cam.restart} className="btn-ghost">
              <RefreshIcon width={18} height={18} /> Retry camera
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

      {/* Action row */}
      {!shot ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={takePhoto}
            disabled={!cam.ready || busy}
            className="btn-success btn-xl w-full"
          >
            <CameraIcon width={36} height={36} />
            CAPTURE PHOTO
          </button>
          <button onClick={onManualEntry} className="btn-ghost w-full" disabled={busy}>
            Enter manually instead
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={retake} disabled={busy} className="btn-ghost btn-xl">
            <XIcon width={28} height={28} /> RETAKE
          </button>
          <button onClick={confirm} disabled={busy} className="btn-primary btn-xl">
            <CheckIcon width={28} height={28} /> CONFIRM
          </button>
        </div>
      )}
    </div>
  );
}
