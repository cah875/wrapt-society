import { useMemo, useState } from 'react';
import { CheckIcon, XIcon, AlertIcon } from './Icons.jsx';
import LookupCombo from './LookupCombo.jsx';
import { matchManufacturer, suggestCategory, suggestEOC, missingRequired } from '../lib/catalog.js';

/** Small read-only enrichment chip. */
function Fact({ label, value }) {
  if (value === '' || value === null || value === undefined) return null;
  return (
    <div className="rounded-lg bg-clinical-50 px-3 py-2 dark:bg-clinical-800">
      <div className="text-xs font-semibold uppercase tracking-wide text-clinical-400">{label}</div>
      <div className="text-sm text-clinical-700 dark:text-clinical-200">{value}</div>
    </div>
  );
}

const ynText = (v) => (v === true ? 'Yes' : v === false ? 'No' : v || '');

/**
 * Review/edit an enriched catalog record before saving it to the Item Master.
 * `item` is the buildCatalogItem() result; `lookups` provides categories +
 * manufacturers for the dropdowns and auto-matching.
 */
export default function CatalogConfirm({ item, lookups, busy, onSave, onCancel }) {
  const categories = lookups?.categories || [];
  const manufacturers = lookups?.manufacturers || [];
  const eocList = lookups?.eoc || [];

  // Auto-suggestions computed once from the enrichment.
  const suggestedCat = useMemo(() => suggestCategory(item, categories), [item, categories]);
  const matchedMfr = useMemo(
    () => matchManufacturer(item.manufacturer, manufacturers),
    [item, manufacturers]
  );
  const suggestedEoc = useMemo(() => suggestEOC(item, eocList), [item, eocList]);

  const [product, setProduct] = useState(item.product || '');
  const [categoryCode, setCategoryCode] = useState(item.category || suggestedCat?.code || '');
  const [eocCode, setEocCode] = useState(item.eoc || suggestedEoc?.code || '');
  const [implantable, setImplantable] = useState(item.implantable || '');
  const [mfrName, setMfrName] = useState(matchedMfr?.name || item.manufacturer || '');
  const [catalogNumber, setCatalogNumber] = useState(item.catalogNumber || '');
  const [gtin, setGtin] = useState(item.gtin || '');
  const [packaging, setPackaging] = useState(item.packaging || '');
  const [notes, setNotes] = useState(item.notes || '');

  const built = {
    ...item,
    product: product.trim(),
    category: categoryCode,
    eoc: eocCode,
    implantable,
    manufacturer: mfrName.trim(),
    catalogNumber: catalogNumber.trim(),
    gtin: gtin.trim(),
    packaging: packaging.trim(),
    notes: notes.trim(),
  };

  const missing = missingRequired(built, lookups);
  const canSave = product.trim() && !busy;

  return (
    <div className="card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-clinical-800 dark:text-clinical-50">
          Catalog Item · Build Master Record
        </h2>
        <span
          className={`badge ${
            item.source === 'GUDID'
              ? 'bg-green-100 text-status-ok dark:bg-green-900/40 dark:text-green-300'
              : 'bg-amber-100 text-status-warn dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          {item.source === 'GUDID' ? '✓ Enriched from GUDID' : 'Manual / no GUDID match'}
        </span>
      </div>

      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-status-warn dark:bg-amber-900/30 dark:text-amber-200">
          <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            Still needed for Meditech: {missing.join(', ')}. (Vendor cost &amp; charge code are
            completed later by MM/finance.)
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="cat-product">Product Name *</label>
          <input id="cat-product" value={product} onChange={(e) => setProduct(e.target.value)}
            className="field-input" placeholder="e.g. VertiGRAFT Allograft Spacer" />
          <p className="mt-1 text-xs text-clinical-400">
            Description1 / 2 are auto-trimmed to 30 chars (whole words); the full name goes to Ext Description.
          </p>
        </div>

        <LookupCombo
          id="cat-category"
          label="Category (Meditech) *"
          options={categories}
          value={categoryCode}
          onChange={setCategoryCode}
          suggestion={suggestedCat}
          placeholder="type to search 69 categories"
        />

        <LookupCombo
          id="cat-eoc"
          label="EOC / Expense *"
          options={eocList}
          value={eocCode}
          onChange={setEocCode}
          suggestion={suggestedEoc}
          placeholder="type to search expense codes"
        />

        <div>
          <label className="field-label" htmlFor="cat-mfr">Manufacturer *</label>
          <input id="cat-mfr" list="mfr-list" value={mfrName} onChange={(e) => setMfrName(e.target.value)}
            className="field-input" placeholder="start typing to match Meditech list" />
          <datalist id="mfr-list">
            {manufacturers.map((m) => (
              <option key={m.code + m.name} value={m.name}>{m.code}</option>
            ))}
          </datalist>
          <p className="mt-1 text-xs text-clinical-400">
            {matchedMfr
              ? `Matched → ${matchedMfr.code}`
              : 'No Meditech match yet — pick from the list so the export maps correctly.'}
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="cat-implant">Implantable</label>
          <select id="cat-implant" value={implantable} onChange={(e) => setImplantable(e.target.value)}
            className="field-input">
            <option value="">—</option>
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="cat-ref">Manufacturer Cat # (REF) *</label>
          <input id="cat-ref" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)}
            className="field-input font-mono" placeholder="e.g. VG2C-T57P" />
        </div>

        <div>
          <label className="field-label" htmlFor="cat-pkg">Packaging *</label>
          <input id="cat-pkg" value={packaging} onChange={(e) => setPackaging(e.target.value)}
            className="field-input font-mono" placeholder="e.g. CA/5 BX/100 EA" />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="cat-gtin">GTIN</label>
          <input id="cat-gtin" value={gtin} onChange={(e) => setGtin(e.target.value)}
            inputMode="numeric" className="field-input font-mono" placeholder="14-digit GTIN" />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="cat-notes">Notes</label>
          <input id="cat-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="field-input" placeholder="optional" />
        </div>
      </div>

      {/* Read-only enrichment captured from GUDID. */}
      <div>
        <div className="mb-2 text-sm font-semibold text-clinical-600 dark:text-clinical-300">
          Captured from GUDID
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Fact label="GMDN Term" value={item.gmdnTerm} />
          <Fact label="FDA Product Code" value={[item.productCode, item.productCodeName].filter(Boolean).join(' · ')} />
          <Fact label="Sterile" value={ynText(item.sterile)} />
          <Fact label="Sterilization" value={item.sterilizationMethod} />
          <Fact label="Single Use" value={ynText(item.singleUse)} />
          <Fact label="HCT/P (tissue)" value={ynText(item.hctp)} />
          <Fact label="Latex" value={ynText(item.latex)} />
          <Fact label="MRI Safety" value={item.mriSafety} />
          <Fact label="Rx / OTC" value={item.rxOtc} />
          <Fact label="Sizes" value={item.sizes} />
          <Fact label="Distribution" value={item.distributionStatus} />
          <Fact
            label="Captures"
            value={[
              item.capturesLot === 'Y' || item.capturesLot === true ? 'Lot' : '',
              item.capturesSerial === 'Y' || item.capturesSerial === true ? 'Serial' : '',
              item.capturesExpiration === 'Y' || item.capturesExpiration === true ? 'Exp' : '',
            ].filter(Boolean).join(', ')}
          />
        </div>
        {item.gmdnDefinition && (
          <p className="mt-2 text-xs text-clinical-400">{item.gmdnDefinition}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button onClick={onCancel} disabled={busy} className="btn-ghost btn-xl">
          <XIcon width={26} height={26} /> Cancel
        </button>
        <button onClick={() => onSave(built)} disabled={!canSave} className="btn-success btn-xl">
          <CheckIcon width={26} height={26} /> SAVE TO MASTER
        </button>
      </div>
    </div>
  );
}
