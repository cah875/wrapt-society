import { useState } from 'react';

const MODES = [
  { id: 'receive', label: '⬇ Receive', active: 'bg-clinical-600 text-white' },
  { id: 'use', label: '⬆ Use', active: 'bg-brand-brown text-white' },
  { id: 'catalog', label: '📚 Catalog', active: 'bg-brand-green text-white' },
];

/**
 * Mode toggle (Receive / Use / Catalog) plus a "ready to scan" hint and a
 * manual code entry box (for when the USB scanner isn't handy or won't read).
 */
export default function ScanPanel({ mode, onMode, onManualCode, busy }) {
  const [code, setCode] = useState('');

  const submitManual = (e) => {
    e.preventDefault();
    const v = code.trim();
    if (!v) return;
    onManualCode(v);
    setCode('');
  };

  const isUse = mode === 'use';
  const isCatalog = mode === 'catalog';

  const hint = busy
    ? 'Looking up product…'
    : isUse
    ? 'Scan a used implant sticker to remove 1 from stock'
    : isCatalog
    ? 'Scan or photograph a new product to build its master record'
    : 'Scan a package barcode to add stock';

  return (
    <div className="card space-y-4">
      {/* Mode toggle */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-clinical-100 p-1 dark:bg-clinical-800">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onMode(m.id)}
            className={`btn rounded-lg py-3 text-base ${
              mode === m.id ? m.active : 'bg-transparent text-clinical-600 dark:text-clinical-300'
            }`}
            aria-pressed={mode === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div
        className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3 ${
          isUse
            ? 'border-brand-brown/40 bg-brand-brown/5'
            : isCatalog
            ? 'border-brand-green/40 bg-brand-green/5'
            : 'border-clinical-300 bg-clinical-50 dark:border-clinical-700 dark:bg-clinical-800/50'
        }`}
      >
        <span className="text-2xl" aria-hidden>
          {busy ? '⏳' : isCatalog ? '📚' : '📷'}
        </span>
        <div className="text-sm">
          <div className="font-semibold text-clinical-800 dark:text-clinical-100">{hint}</div>
          <div className="text-clinical-500 dark:text-clinical-400">
            {isCatalog
              ? 'Enriches from the FDA GUDID database — GMDN, packaging, sterility & more.'
              : 'Point the USB scanner and scan — no button needed. Reads GTIN, expiration & lot.'}
          </div>
        </div>
      </div>

      {/* Manual fallback */}
      <form onSubmit={submitManual} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Or type / paste a barcode (GTIN or full UDI)"
          className="field-input flex-1"
          aria-label="Manual barcode entry"
        />
        <button type="submit" className="btn-ghost" disabled={busy || !code.trim()}>
          Enter
        </button>
      </form>
    </div>
  );
}
