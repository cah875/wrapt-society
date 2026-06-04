import { useMemo, useState } from 'react';
import QuantityInput from './QuantityInput.jsx';
import StatusBadge from './StatusBadge.jsx';
import { normalizeDate, displayDate } from '../lib/dates.js';
import { AlertIcon, CheckIcon, XIcon } from './Icons.jsx';

const CONFIDENCE_STYLE = {
  high: 'bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-red-100 text-status-danger dark:bg-red-900/40 dark:text-red-300',
};

/**
 * Verify/edit extracted fields, set quantity + unit, then confirm & log.
 * `extracted` may be partial (manual-entry mode passes an empty object).
 */
export default function ConfirmationPanel({
  extracted,
  settings,
  busy,
  onConfirm,
  onCancel,
}) {
  const [product, setProduct] = useState(extracted.product || '');
  const [expirationRaw, setExpirationRaw] = useState(
    extracted.expiration_date || ''
  );
  const [lot, setLot] = useState(extracted.lot_number || '');
  const [gtin, setGtin] = useState(extracted.gtin || '');
  const [ref, setRef] = useState(extracted.reference_code || '');
  const [serial, setSerial] = useState(extracted.serial_number || '');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(settings.unitTypes?.[0] || 'each');
  const [location, setLocation] = useState(settings.location || '');
  const [confirmHighQty, setConfirmHighQty] = useState(false);

  // Canonicalize the date as the user types; flag if unparseable.
  const expiration = useMemo(() => normalizeDate(expirationRaw), [expirationRaw]);
  const dateInvalid = expirationRaw.trim() !== '' && !expiration;

  const confidence = (extracted.confidence || 'low').toLowerCase();
  const blurry = Boolean(extracted.blurry);

  const highQty = quantity > 100;
  const canSubmit =
    product.trim() &&
    !dateInvalid &&
    !busy &&
    (!highQty || confirmHighQty);

  const submit = () => {
    if (!canSubmit) return;
    onConfirm({
      product: product.trim(),
      expiration: expiration || '',
      lot: lot.trim(),
      quantity,
      unit,
      location: location.trim(),
      gtin: gtin.trim(),
      ref: ref.trim(),
      serial: serial.trim(),
    });
  };

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
          Verify Item Details
        </h2>
        {extracted.fromScan ? (
          <span className="badge bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300">
            ✓ Scanned barcode
          </span>
        ) : extracted.fromVision ? (
          <span className={`badge ${CONFIDENCE_STYLE[confidence] || CONFIDENCE_STYLE.low}`}>
            Confidence: {confidence}
          </span>
        ) : null}
      </div>


      {blurry && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-status-warn dark:bg-amber-900/30 dark:text-amber-200">
          <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            The photo looked blurry or hard to read. Please double-check every field below,
            or retake the photo.
          </p>
        </div>
      )}

      {extracted.notes && (
        <p className="rounded-lg bg-clinical-50 p-3 text-sm text-clinical-600 dark:bg-clinical-800 dark:text-clinical-300">
          <strong>Vision note:</strong> {extracted.notes}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="product">
            Product Name *
          </label>
          <input
            id="product"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. Smith & Nephew X-500"
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="expiration">
            Expiration Date
          </label>
          <input
            id="expiration"
            value={expirationRaw}
            onChange={(e) => setExpirationRaw(e.target.value)}
            placeholder="MM/DD/YYYY or YYYY-MM-DD"
            className={`field-input ${dateInvalid ? 'border-status-danger ring-status-danger' : ''}`}
          />
          {dateInvalid ? (
            <p className="mt-1 text-sm font-medium text-status-danger">
              Could not parse this date — please correct it.
            </p>
          ) : expiration ? (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-clinical-500">
                Reads as {displayDate(expiration)}
              </span>
              <StatusBadge expiration={expiration} alertDays={settings.alertDays} />
            </div>
          ) : (
            <p className="mt-1 text-sm text-clinical-400">No expiration date set.</p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="lot">
            Lot Number
          </label>
          <input
            id="lot"
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            placeholder="e.g. 12345"
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="reference">
            Reference / Catalog Code
          </label>
          <input
            id="reference"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. VG2C-T57P"
            className="field-input font-mono"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="serial">
            Serial / Unit ID
          </label>
          <input
            id="serial"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="e.g. 2110913-1072"
            className="field-input font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="gtin">
            GTIN / Barcode ID
          </label>
          <input
            id="gtin"
            value={gtin}
            onChange={(e) => setGtin(e.target.value)}
            inputMode="numeric"
            placeholder="14-digit number from the barcode/UDI"
            className="field-input font-mono"
          />
          <p className="mt-1 text-xs text-clinical-400">
            These identifiers are captured from the photo. When the item is later used, scanning{' '}
            <em>any</em> of its barcodes (GTIN, catalog code, or serial) will match — correct any
            that look wrong.
          </p>
        </div>
      </div>

      <QuantityInput
        quantity={quantity}
        unit={unit}
        unitTypes={settings.unitTypes || ['each']}
        onQuantity={setQuantity}
        onUnit={setUnit}
      />

      {highQty && (
        <label className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-status-warn dark:bg-amber-900/30 dark:text-amber-200">
          <input
            type="checkbox"
            checked={confirmHighQty}
            onChange={(e) => setConfirmHighQty(e.target.checked)}
            className="mt-1 h-5 w-5"
          />
          <span className="text-sm font-medium">
            That is a large quantity ({quantity}). Check the box to confirm this is correct.
          </span>
        </label>
      )}

      <div>
        <label className="field-label" htmlFor="location">
          Location (optional)
        </label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. OR Storage Bay 3"
          className="field-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button onClick={onCancel} disabled={busy} className="btn-ghost btn-xl">
          <XIcon width={26} height={26} /> Cancel
        </button>
        <button onClick={submit} disabled={!canSubmit} className="btn-success btn-xl">
          <CheckIcon width={26} height={26} /> CONFIRM &amp; LOG
        </button>
      </div>
    </div>
  );
}
