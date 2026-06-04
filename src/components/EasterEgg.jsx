import { useEffect, useState } from 'react';

/** Simple airplane silhouette pointing right. */
function Plane() {
  return (
    <svg className="egg-plane" width="92" height="92" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}

/** A crinkly tinfoil hat (with antenna, naturally). */
function TinfoilHat() {
  return (
    <svg className="egg-hat" viewBox="0 0 200 170" aria-hidden>
      <defs>
        <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3f4f6" />
          <stop offset="0.5" stopColor="#b9bec6" />
          <stop offset="1" stopColor="#8a909a" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <line x1="100" y1="40" x2="100" y2="8" stroke="#cbd0d6" strokeWidth="4" />
      <circle cx="100" cy="8" r="7" fill="#e5e7eb" />
      {/* cone with crumpled facets */}
      <polygon points="100,30 150,135 50,135" fill="url(#foil)" stroke="#9aa0a8" strokeWidth="2" />
      <polygon points="100,30 100,135 50,135" fill="#cfd4da" opacity="0.5" />
      <polygon points="100,52 122,135 100,135" fill="#ffffff" opacity="0.35" />
      <polygon points="78,92 92,135 70,135" fill="#ffffff" opacity="0.3" />
      {/* brim */}
      <ellipse cx="100" cy="138" rx="62" ry="14" fill="url(#foil)" stroke="#9aa0a8" strokeWidth="2" />
    </svg>
  );
}

/**
 * Full-screen easter-egg overlay. Dismiss with click or Escape.
 * type: 'image' (gif/photo), 'plane' (Ruger), or 'hat' (Elizabeth + photo).
 */
export default function EasterEgg({ egg, onClose }) {
  const [idx, setIdx] = useState(0);

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

  const type = egg.type || 'image';
  const src = egg.candidates ? egg.candidates[idx] : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 overflow-hidden bg-black p-6 text-center"
      role="dialog"
      aria-label="Easter egg"
    >
      {type === 'plane' && (
        <>
          <div className="egg-trail" />
          <Plane />
        </>
      )}

      {type === 'hat' && (
        <div className="relative inline-block">
          {src ? (
            <img
              src={src}
              alt={egg.name}
              onError={() => setIdx((i) => i + 1)}
              className="max-h-[55vh] w-auto rounded-lg"
            />
          ) : (
            // No photo uploaded yet — drop the hat onto a placeholder.
            <div className="h-64 w-56 rounded-lg bg-clinical-800" />
          )}
          <TinfoilHat />
        </div>
      )}

      {type === 'image' && src && (
        <img
          src={src}
          alt={egg.name}
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
