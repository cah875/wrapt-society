import { useEffect, useRef } from 'react';

/**
 * Fires onTrigger when the user types `word` (letters only, case-insensitive)
 * anywhere in the app — a small hidden delight.
 */
export function useEasterEgg(word, onTrigger) {
  const bufferRef = useRef('');
  const cbRef = useRef(onTrigger);
  cbRef.current = onTrigger;

  useEffect(() => {
    const target = word.toLowerCase();
    const onKey = (e) => {
      if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
        bufferRef.current = (bufferRef.current + e.key.toLowerCase()).slice(-target.length);
        if (bufferRef.current === target) {
          bufferRef.current = '';
          cbRef.current();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [word]);
}
