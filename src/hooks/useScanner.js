import { useEffect, useRef } from 'react';

/**
 * Listens for input from a USB barcode scanner operating as a keyboard
 * (keyboard-wedge). Scanners "type" the barcode very fast and finish with Enter.
 * We buffer keystrokes, detect the fast burst, and emit the full code on Enter.
 *
 * Human typing (slow, with gaps) resets the buffer, so normal form input is
 * unaffected. During a detected fast burst we preventDefault so the scanned
 * characters don't leak into any focused field.
 *
 * @param {(code: string) => void} onScan
 * @param {boolean} enabled
 */
export function useScanner(onScan, enabled = true) {
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return undefined;

    const handleKey = (e) => {
      // Ignore modifier combos (Ctrl/Alt/Meta) — those are real shortcuts.
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // A long gap means a new sequence (or human typing) — reset.
      if (dt > 100) bufferRef.current = '';

      if (e.key === 'Enter') {
        const code = bufferRef.current;
        bufferRef.current = '';
        if (code.length >= 6) {
          e.preventDefault();
          e.stopPropagation();
          onScanRef.current(code);
        }
        return;
      }

      // The GS1 separator (FNC1) may arrive as a control key; preserve it.
      if (e.key === 'Unidentified') {
        bufferRef.current += '\x1d';
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
        // Fast burst → it's a scanner; keep chars out of focused inputs.
        if (dt < 35 && bufferRef.current.length > 2) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [enabled]);
}
