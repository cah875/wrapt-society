import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Camera enhancement layer: sharpness detection, software filters,
 * and optional hardware controls via the ImageCapture / Constraints API.
 *
 * @param {React.RefObject} videoRef  - the live <video> element ref
 * @param {boolean} active            - only run the sharpness loop when true
 */
export function useCameraEnhancements(videoRef, active = true) {
  // Software filter values (CSS filter string applied to <video> and canvas).
  const [brightness, setBrightness] = useState(100); // %
  const [contrast, setContrast] = useState(100);     // %
  const [sharpness, setSharpness] = useState(0);     // extra unsharp-mask strength 0-3

  // Sharpness detection result.
  const [blurScore, setBlurScore] = useState(null);  // 0-100, higher = sharper
  const [isSharp, setIsSharp] = useState(null);      // true/false/null (null = not measured)

  // Hardware capabilities exposed by the browser (null = not supported / not queried).
  const [hwCaps, setHwCaps] = useState(null);
  const [hwFocus, setHwFocus] = useState(null);
  const [hwZoom, setHwZoom] = useState(null);

  const loopRef = useRef(null);
  const blurCanvas = useRef(document.createElement('canvas'));

  // ── Software filter string ──────────────────────────────────────────────────
  const filterStyle = [
    brightness !== 100 ? `brightness(${brightness}%)` : '',
    contrast !== 100 ? `contrast(${contrast}%)` : '',
    sharpness > 0 ? `contrast(${100 + sharpness * 15}%) brightness(${100 - sharpness * 2}%)` : '',
  ].filter(Boolean).join(' ') || 'none';

  // ── Apply same filters to a canvas ctx at capture time ─────────────────────
  const applyToCanvas = useCallback((ctx, w, h) => {
    if (brightness === 100 && contrast === 100 && sharpness === 0) return;
    ctx.filter = filterStyle;
  }, [filterStyle, brightness, contrast, sharpness]);

  // ── Sharpness / blur detection (Laplacian variance) ────────────────────────
  useEffect(() => {
    if (!active) { setIsSharp(null); return; }

    const measure = () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || video.paused || video.ended) return;

      const W = 160, H = 120; // sample at low res — fast and sufficient
      const c = blurCanvas.current;
      c.width = W; c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, W, H);
      const { data } = ctx.getImageData(0, 0, W, H);

      // Convert to grayscale then apply 3x3 Laplacian kernel (edge sharpness).
      // Sample every 4th pixel to keep it fast.
      let sum = 0, sumSq = 0, n = 0;
      for (let y = 1; y < H - 1; y += 2) {
        for (let x = 1; x < W - 1; x += 2) {
          const i = (y * W + x) * 4;
          const gray = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
          // Laplacian: centre × 4 minus 4 neighbours
          const top    = i - W * 4, bot = i + W * 4;
          const gT = (data[top] * 299 + data[top + 1] * 587 + data[top + 2] * 114) / 1000;
          const gB = (data[bot] * 299 + data[bot + 1] * 587 + data[bot + 2] * 114) / 1000;
          const gL = (data[i - 4] * 299 + data[i - 3] * 587 + data[i - 2] * 114) / 1000;
          const gR = (data[i + 4] * 299 + data[i + 5] * 587 + data[i + 6] * 114) / 1000;
          const lap = gray * 4 - gT - gB - gL - gR;
          sum += lap; sumSq += lap * lap; n++;
        }
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;
      // Map variance to 0-100 score. Empirically: <50 = blurry, >200 = sharp.
      const score = Math.min(100, Math.round(variance / 3));
      setBlurScore(score);
      setIsSharp(score >= 30);
    };

    loopRef.current = setInterval(measure, 250);
    return () => clearInterval(loopRef.current);
  }, [active, videoRef]);

  // ── Hardware controls via ImageCapture / Advanced Constraints API ───────────
  useEffect(() => {
    if (!active) return;
    const tryHardware = async () => {
      try {
        const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
        if (!track) return;
        const caps = track.getCapabilities?.();
        if (!caps) return;
        const discovered = {};
        if (caps.focusMode) discovered.focusMode = caps.focusMode;
        if (caps.focusDistance) discovered.focusDistance = caps.focusDistance;
        if (caps.zoom) discovered.zoom = caps.zoom;
        if (caps.brightness) discovered.brightness = caps.brightness;
        if (caps.contrast) discovered.contrast = caps.contrast;
        if (caps.sharpness) discovered.sharpness = caps.sharpness;
        if (Object.keys(discovered).length > 0) {
          setHwCaps(discovered);
          // Default to continuous autofocus if available.
          if (caps.focusMode?.includes('continuous')) {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
          }
          const settings = track.getSettings?.() || {};
          if (settings.zoom != null) setHwZoom(settings.zoom);
          if (settings.focusDistance != null) setHwFocus(settings.focusDistance);
        }
      } catch { /* hardware API not available */ }
    };
    // Small delay so the stream is fully established before querying capabilities.
    const t = setTimeout(tryHardware, 800);
    return () => clearTimeout(t);
  }, [active, videoRef]);

  const applyHardware = useCallback(async ({ zoom, focusMode, focusDistance } = {}) => {
    try {
      const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
      if (!track) return;
      const adv = {};
      if (zoom != null) { adv.zoom = zoom; setHwZoom(zoom); }
      if (focusMode != null) adv.focusMode = focusMode;
      if (focusDistance != null) { adv.focusDistance = focusDistance; setHwFocus(focusDistance); }
      if (Object.keys(adv).length) await track.applyConstraints({ advanced: [adv] }).catch(() => {});
    } catch { /* ignore */ }
  }, [videoRef]);

  const reset = useCallback(() => {
    setBrightness(100); setContrast(100); setSharpness(0);
  }, []);

  return {
    // Software filter
    brightness, setBrightness,
    contrast, setContrast,
    sharpness, setSharpness,
    filterStyle,
    applyToCanvas,
    reset,
    // Sharpness indicator
    blurScore,
    isSharp,
    // Hardware
    hwCaps,
    hwFocus, hwZoom,
    applyHardware,
  };
}
