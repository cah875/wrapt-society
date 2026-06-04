import { useEffect, useState } from 'react';

/**
 * Full-screen Star Wars–styled overlay. Dismiss with click or Escape.
 * Shows /yoda.gif when present; the message displays regardless.
 */
export default function EasterEgg({ onClose }) {
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-black p-6 text-center"
      role="dialog"
      aria-label="Easter egg"
    >
      {imgOk && (
        <img
          src="/yoda.gif"
          alt="Yoda"
          onError={() => setImgOk(false)}
          className="max-h-[55vh] w-auto rounded-lg"
        />
      )}
      <h1
        className="px-4 font-serif text-4xl font-extrabold tracking-wide sm:text-6xl"
        style={{ color: '#FFE81F', textShadow: '0 0 18px rgba(255,232,31,0.55)' }}
      >
        Made Yoda Happy You Have
      </h1>
      <p className="text-sm uppercase tracking-[0.3em] text-yellow-200/70">
        click anywhere to continue
      </p>
    </div>
  );
}
