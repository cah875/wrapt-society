import { useState } from 'react';

/**
 * Mode toggle (Receive / Use) plus a "ready to scan" hint and a manual code
 * entry box (for when the USB scanner isn't handy or a code won't read).
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

  return (
    <div className="card space-y-4">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-clinical-100 p-1 dark:bg-clinical-800">
        <button
          onClick={() => onMode('receive')}
          className={`btn rounded-lg py-3 text-base ${
            !isUse
              ? 'bg-clinical-600 text-white'
              : 'bg-transparent text-clinical-600 dark:text-clinical-300'
          }`}
          aria-pressed={!isUse}
        >
          ⬇ Receive (add)
        </button>
        <button
          onClick={() => onMode('use')}
          className={`btn rounded-lg py-3 text-base ${
            isUse
              ? 'bg-brand-brown text-white'
              : 'bg-transparent text-clinical-600 dark:text-clinical-300'
          }`}
          aria-pressed={isUse}
        >
          ⬆ Use (remove)
        </button>
      </div>

      <div
        className={`flex items-center gap-3 rounded-xl border-2 border-dashed p-3 ${
          isUse
            ? 'border-brand-brown/40 bg-brand-brown/5'
            : 'border-clinical-300 bg-clinical-50 dark:border-clinical-700 dark:bg-clinical-800/50'
        }`}
      >
        <span className="text-2xl" aria-hidden>
          {busy ? '⏳' : '📷'}
        </span>
        <div className="text-sm">
          <div className="font-semibold text-clinical-800 dark:text-clinical-100">
            {busy
              ? 'Looking up product…'
              : isUse
              ? 'Scan a used implant sticker to remove 1 from stock'
              : 'Scan a package barcode to add stock'}
          </div>
          <div className="text-clinical-500 dark:text-clinical-400">
            Point the USB scanner and scan — no button needed. Reads GTIN, expiration &amp; lot.
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
