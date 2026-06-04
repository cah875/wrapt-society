// Catalog / Item Master helpers: merge a Claude Vision extraction with a GUDID
// enrichment into one clean product record, and export the Item Master to CSV
// for import into Meditech Expanse.

import { normalizeGtin } from './gs1.js';
import { ITEM_MASTER_HEADER } from './excel.js';

/** Format GUDID device sizes into one readable cell. */
function formatSizes(sizes = []) {
  return sizes
    .map((s) => {
      const measure = s.text || [s.value, s.unit].filter(Boolean).join(' ');
      return [s.type, measure].filter(Boolean).join(': ');
    })
    .filter(Boolean)
    .join('; ');
}

/** Format the GUDID packaging hierarchy, e.g. "Box of 5; Case of 20". */
function formatPackaging(packaging = []) {
  return packaging
    .map((p) => {
      const type = p.type || 'Package';
      return p.quantity ? `${type} of ${p.quantity}` : type;
    })
    .filter(Boolean)
    .join('; ');
}

/** Best-effort category guess from GUDID signals; the tech can override. */
function guessCategory(g) {
  if (g?.hctp) return 'Biologic';
  const term = (g?.gmdn?.term || '').toLowerCase();
  if (/(allograft|tissue|graft|demineralized|bone matrix|dermis)/.test(term)) return 'Biologic';
  if (/(implant|screw|plate|prosth|anchor|cage|stent)/.test(term)) return 'Implant';
  return '';
}

/**
 * Merge a Vision result and a GUDID lookup into the catalog item shape that
 * src/lib/excel.js (upsertCatalogItem) expects. Either source may be missing;
 * Vision-read fields fill gaps GUDID doesn't cover.
 */
export function buildCatalogItem(vision = {}, gudid = null, extras = {}) {
  const g = gudid || {};
  const rxOtc = g.rx === true ? 'Rx' : g.otc === true ? 'OTC' : '';
  return {
    catalogued: new Date().toISOString().slice(0, 16).replace('T', ' '),
    category: extras.category ?? guessCategory(g),
    product: g.name || vision.product || '',
    brandName: g.brandName || '',
    manufacturer: g.company || '',
    model: g.model || '',
    catalogNumber: g.catalogNumber || vision.reference_code || '',
    gtin: normalizeGtin(g.gtin || vision.gtin || ''),
    description: g.description || '',
    gmdnTerm: g.gmdn?.term || '',
    gmdnDefinition: g.gmdn?.definition || '',
    productCode: g.productCode?.code || '',
    productCodeName: g.productCode?.name || '',
    sterile: g.sterile ?? null,
    sterilizationMethod: (g.sterilizationMethods || []).join(', '),
    singleUse: g.singleUse ?? null,
    hctp: g.hctp ?? null,
    latex: g.containsLatex ?? null,
    mriSafety: g.mriSafety || '',
    rxOtc,
    sizes: formatSizes(g.sizes),
    packaging: formatPackaging(g.packaging),
    capturesLot: g.hasLot ?? null,
    capturesSerial: g.hasSerial ?? null,
    capturesExpiration: g.hasExpiration ?? null,
    distributionStatus: g.distributionStatus || '',
    source: g.found ? 'GUDID' : 'Manual',
    notes: extras.notes || '',
    ...extras.overrides,
  };
}

/** Quote a CSV field if it contains a comma, quote, or newline. */
function csvCell(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export catalog items (as read back from the Item Master sheet — string values)
 * to CSV. Defaults to the Item Master columns; pass a Meditech header/field map
 * later to emit the exact import layout.
 *
 * @param {Array<object>} items - rows from readAllCatalogItems().
 * @param {Array<string>} [headers] - column headers for the output.
 * @param {Array<string>} [fields] - item keys to pull per column (parallel to headers).
 */
const DEFAULT_FIELDS = [
  'catalogued', 'category', 'product', 'brandName', 'manufacturer', 'model',
  'catalogNumber', 'gtin', 'description', 'gmdnTerm', 'gmdnDefinition',
  'productCode', 'productCodeName', 'sterile', 'sterilizationMethod', 'singleUse',
  'hctp', 'latex', 'mriSafety', 'rxOtc', 'sizes', 'packaging', 'capturesLot',
  'capturesSerial', 'capturesExpiration', 'distributionStatus', 'source', 'notes',
];

export function catalogToCsv(items, headers = ITEM_MASTER_HEADER, fields = DEFAULT_FIELDS) {
  const head = headers.map(csvCell).join(',');
  const rows = items.map((it) => fields.map((f) => csvCell(it[f])).join(','));
  return [head, ...rows].join('\r\n');
}

/** Trigger a browser download of a CSV string. */
export function downloadCsv(csv, filename = 'item-master.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
