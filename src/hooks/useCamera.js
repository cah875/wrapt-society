import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages webcam access, device enumeration, the live stream, and frame
 * capture. Returns a video ref to attach to a <video> element.
 */
export function useCamera(preferredDeviceId) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [activeDeviceId, setActiveDeviceId] = useState(preferredDeviceId || '');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  const start = useCallback(
    async (deviceId) => {
      setError('');
      setReady(false);
      stop();
      try {
        const constraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);

        // Enumerate devices (labels only populate after permission granted).
        const list = await navigator.mediaDevices.enumerateDevices();
        const cams = list.filter((d) => d.kind === 'videoinput');
        setDevices(cams);

        const track = stream.getVideoTracks()[0];
        const settings = track?.getSettings?.() || {};
        setActiveDeviceId(deviceId || settings.deviceId || '');
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          setError('Camera permission denied. Please allow camera access in your browser.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Connect a webcam and try again.');
        } else {
          setError(err.message || 'Could not start the camera.');
        }
        setReady(false);
      }
    },
    [stop]
  );

  // Start on mount / when the preferred device changes; clean up on unmount.
  useEffect(() => {
    start(preferredDeviceId || undefined);
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredDeviceId]);

  const switchDevice = useCallback(
    (deviceId) => {
      setActiveDeviceId(deviceId);
      start(deviceId);
    },
    [start]
  );

  /** Grab the current frame as a JPEG data URL. */
  const capture = useCallback((quality = 0.9) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }, []);

  return {
    videoRef,
    devices,
    activeDeviceId,
    error,
    ready,
    capture,
    switchDevice,
    restart: () => start(activeDeviceId || undefined),
    stop,
  };
}
