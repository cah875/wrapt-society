import { useEffect, useState } from 'react';

/**
 * Full-screen Star Wars–styled overlay for an easter egg. Dismiss with click or
 * Escape. Tries each candidate image src in turn (so different file extensions
 * just work); the message shows regardless of whether an image loads.
 */
export default function EasterEgg({ egg, onClose }) {
  const [idx, setIdx] = useState(0);

  // Reset to the first candidate whenever a different egg is shown.
  useEffect(() => {
    setIdx(0);
  }, [egg]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const src = egg.candidates[idx];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-black p-6 text-center"
      role="dialog"
      aria-label="Easter egg"
    >
      {src && (
        <img
          src={src}
          alt={egg.name || 'surprise'}
          onError={() => setIdx((i) => i + 1)}
          className="max-h-[55vh] w-auto rounded-lg"
        />
      )}
      <h1
        className="px-4 font-serif text-4xl font-extrabold tracking-wide sm:text-6xl"
        style={{ color: '#FFE81F', textShadow: '0 0 18px rgba(255,232,31,0.55)' }}
      >
        {egg.message}
      </h1>
      <p className="text-sm uppercase tracking-[0.3em] text-yellow-200/70">
        click anywhere to continue
      </p>
    </div>
  );
}
