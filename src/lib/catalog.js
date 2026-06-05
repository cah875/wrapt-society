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

// Common package-type → Meditech unit-of-measure mnemonic.
const UOM = {
  each: 'EA', unit: 'EA', box: 'BX', case: 'CA', carton: 'CT', tray: 'TR',
  pack: 'PK', package: 'PK', packet: 'PK', bag: 'BG', kit: 'KT', pair: 'PR',
  bottle: 'BT', vial: 'VL', set: 'ST', dozen: 'DZ', roll: 'RL', can: 'CN',
};

/**
 * Build a Meditech packaging string from the GUDID packaging hierarchy, e.g.
 * "CA/20 BX/5 EA" (largest pack first, ending in the base unit). Best-effort —
 * the tech can edit it in the catalog form. Returns '' when GUDID has none.
 */
function toMeditechPackaging(packaging = []) {
  const levels = packaging
    .map((p) => ({
      uom: UOM[(p.type || '').toLowerCase()] || (p.type || '').slice(0, 2).toUpperCase(),
      qty: parseInt(p.quantity, 10),
    }))
    .filter((l) => l.uom && l.qty)
    .sort((a, b) => b.qty - a.qty);
  if (!levels.length) return '';
  return [...levels.map((l) => `${l.uom}/${l.qty}`), 'EA'].join(' ');
}

/**
 * Derive implantable flag from FDA data. Returns 'Y', 'N', or '' (unknown).
 * openFDA surfaces gmdn.implantable directly; GUDID requires keyword inference.
 */
function guessImplantable(g) {
  // openFDA sets gmdn.implantable from the GMDN record — trust it explicitly.
  if (g?.gmdn?.implantable === true) return 'Y';
  if (g?.gmdn?.implantable === false) return 'N';
  // hctp (human cell/tissue product) is always implantable.
  if (g?.hctp === true) return 'Y';
  // Keyword inference for GUDID (which doesn't expose the GMDN implantable flag).
  const hay = `${g?.gmdn?.term} ${g?.description}`.toLowerCase();
  if (/(implant|screw|plate|prosth|anchor|cage|stent|graft|allograft|pedicle|fusion)/.test(hay)) return 'Y';
  if (g?.source === 'openFDA') return 'N'; // openFDA returned but no implant keywords → non-implant
  return '';
}

/**
 * Word-aware truncate: pack whole words up to n chars (so a 30-char Meditech
 * Description reads sensibly instead of cutting mid-word). Returns
 * { head, rest } so the caller can flow the remainder into Description2.
 */
function wordCut(s, n) {
  const text = String(s || '').trim().replace(/\s+/g, ' ');
  if (text.length <= n) return { head: text, rest: '' };
  let cutAt = text.lastIndexOf(' ', n);
  if (cutAt <= 0) cutAt = n; // single very long word — hard cut
  return { head: text.slice(0, cutAt).trim(), rest: text.slice(cutAt).trim() };
}

/** Largest unit of measure in a Meditech packaging string ("CA/30 BX/12 EA" → "CA"). */
function largestUnit(packaging) {
  const first = String(packaging || '').trim().split(/\s+/)[0] || '';
  const uom = first.split('/')[0];
  return uom || 'EA';
}

/**
 * Merge a Vision result and a GUDID lookup into the catalog item shape that
 * src/lib/excel.js (upsertCatalogItem) expects. Either source may be missing;
 * Vision-read fields fill gaps GUDID doesn't cover. The Meditech `category`
 * mnemonic is chosen by the tech in the UI, so it defaults blank here.
 */
export function buildCatalogItem(vision = {}, gudid = null, extras = {}) {
  const g = gudid || {};
  const rxOtc = g.rx === true ? 'Rx' : g.otc === true ? 'OTC' : '';
  return {
    catalogued: new Date().toISOString().slice(0, 16).replace('T', ' '),
    category: extras.category ?? '',
    eoc: extras.eoc ?? '',
    implantable: extras.implantable ?? guessImplantable(g),
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
    packaging: toMeditechPackaging(g.packaging),
    capturesLot: g.hasLot ?? null,
    capturesSerial: g.hasSerial ?? null,
    capturesExpiration: g.hasExpiration ?? null,
    distributionStatus: g.distributionStatus || '',
    source: g.found ? 'GUDID' : 'Manual',
    notes: extras.notes || '',
    ...extras.overrides,
  };
}

// ── Meditech Expanse item-master mapping ─────────────────────────────────────
// 32 columns (A–AF) matching the NWSH ItemTemplate. `req` flags drive the UI:
// 'mandatory' (red, errors out without it), 'facility' (amber), '' (optional).
export const MEDITECH_COLUMNS = [
  { header: 'Number', req: 'mandatory' },
  { header: 'Allergen Haz', req: '' },
  { header: 'Common Name', req: '' },
  { header: 'Description1', req: 'mandatory' },
  { header: 'Description2', req: '' },
  { header: 'Category', req: 'mandatory' },
  { header: 'Ext Description', req: '' },
  { header: 'Form', req: '' },
  { header: 'Implantable', req: 'facility' },
  { header: 'PO Type', req: '' },
  { header: 'UNSPSC', req: '' },
  { header: 'Packaging', req: 'mandatory' },
  { header: 'Pur Facility', req: 'mandatory' },
  { header: 'Charge Code', req: 'facility' },
  { header: 'Excl CDM Updates', req: '' },
  { header: 'HCPCS', req: '' },
  { header: 'EOC', req: 'mandatory' },
  { header: 'Mark Up %', req: '' },
  { header: 'Patient EOC', req: '' },
  { header: 'Patient UI', req: '' },
  { header: 'Tax Code', req: '' },
  { header: 'Taxable', req: '' },
  { header: 'Vendor Num', req: 'mandatory' },
  { header: 'Vendor Order', req: 'mandatory' },
  { header: 'Vendor UP', req: 'mandatory' },
  { header: 'Vendor Cost/UP', req: 'mandatory' },
  { header: 'Vendor Cat Num', req: 'mandatory' },
  { header: 'Manufacturer', req: 'mandatory' },
  { header: 'Manufacturer Cat Num', req: 'mandatory' },
  { header: 'GTIN', req: '' },
  { header: 'GTIN Unit', req: '' },
  { header: 'GTIN Manufacturer', req: '' },
];

export const MEDITECH_HEADERS = MEDITECH_COLUMNS.map((c) => c.header);

// Fields genuinely unknowable from GUDID/photo — left for the MM/finance team.
// (Vendor Num/UP/Cat Num and EOC are now auto-derived, so they're validated.)
const FINANCE_BLANK = new Set(['Charge Code', 'Vendor Cost/UP']);

// ── EOC (expense/general-ledger) reconciliation ──────────────────────────────
// Clinical specialty keywords → the token used in the EOC expense names.
const SPECIALTY = [
  ['SPINE', /spin|vertebr|interbody|pedicle|lumbar|cervical|thoracic|disc/],
  ['CARDI', /cardi|heart|coronary|aortic|valve|pacemaker|stent|vascular graft/],
  ['NEURO', /neuro|brain|cranial|dura|shunt|cerebr/],
  ['ORTHO', /orth|bone|fracture|femur|tibia|humerus|knee|hip|joint|screw|plate|nail|anchor|fusion/],
  ['ENT', /\bent\b|ear|nose|throat|sinus|cochlea|tympan|otolog/],
  ['EYES', /eye|ocular|lens|retina|intraocular|corneal|glaucoma/],
  ['GYN', /gyn|uter|pelvic|vaginal|cervix/],
  ['UROLO', /uro|bladder|ureter|prostat|urethra|urinary/],
  ['PLAST', /plast|breast|dermal|skin graft|aesthetic|cosmetic|reconstruct/],
  ['PAIN', /pain|neurostim|spinal cord stim|intrathecal/],
  ['ORAL', /oral|dental|maxillo|mandib|tooth/],
  ['POD', /pod|foot|ankle|toe|hallux|calcaneal/],
  ['GI', /gastro|\bgi\b|esophag|colon|biliary|hernia|mesh/],
  ['VASCU', /vascular|vein|venous|arter|endovascular/],
  ['GENER', /general|soft tissue|wound|suture/],
];

/** Detect the clinical specialty token from GUDID enrichment, or ''. */
function detectSpecialty(item) {
  const hay = `${item.gmdnTerm} ${item.productCodeName} ${item.product} ${item.description}`.toLowerCase();
  for (const [token, re] of SPECIALTY) if (re.test(hay)) return token;
  return '';
}

// Non-implant supply types → token in "MED SUPPLIES <type>" expense names.
const SUPPLY = [
  ['SUTURE', /sutur/], ['GLOVE', /glove/], ['CATHETE', /cathet/], ['CANNULA', /cannula/],
  ['NEEDLE', /needle/], ['WOUND', /wound|dressing|bandage/], ['IMAGING', /imaging|contrast/],
  ['INSTRUM', /instrument/], ['CHEMOTH', /chemo/], ['PLASTIC', /plastic/], ['PAPER', /paper/],
];

/**
 * Suggest a Meditech EOC by reconciling GUDID signals with the Expense/EOC
 * Lookups. Implants default to the OP (outpatient) family at the detected
 * specialty; supplies map to "MED SUPPLIES <type>"; falls back to the family's
 * OTHER bucket. The tech confirms/overrides in a dropdown.
 * @param {string} [family] - 'OP' | 'IP' | 'OVERNIGHT' (implants only).
 */
export function suggestEOC(item, eocList = null, family = 'OP') {
  eocList = eocList ?? [];
  const find = (pred) => eocList.find((e) => pred(e.name.toUpperCase()));
  const isImplant = item.implantable === 'Y' || item.implantable === true || item.hctp === 'Y';

  if (isImplant) {
    const prefix = family === 'IP' ? 'IP IMPLANTS' : family === 'OVERNIGHT' ? 'OP OVERNIGHT IMP' : 'OP IMPLANTS';
    const spec = detectSpecialty(item);
    if (spec) {
      const hit = find((n) => n.startsWith(prefix) && n.includes(spec));
      if (hit) return hit;
    }
    return find((n) => n.startsWith(prefix) && n.includes('OTHER')) || find((n) => n.startsWith(prefix)) || null;
  }

  const hay = `${item.gmdnTerm} ${item.productCodeName} ${item.product} ${item.description}`.toLowerCase();

  // Anesthesia supplies (gas lines, circuits, airways, etc.) have their own EOC family.
  if (/gas.sampl|sampl.*line|breath.*circuit|anesthes|endotrach|laryngoscop|airway manag|gas monitor|capnograph/.test(hay)) {
    if (/endotrach/.test(hay)) return find((n) => n.startsWith('ANESTHESIA ENDOTRACH')) || find((n) => n.startsWith('ANESTHESIA'));
    if (/laryngoscop/.test(hay)) return find((n) => n.startsWith('ANESTHESIA LARYNGO')) || find((n) => n.startsWith('ANESTHESIA'));
    if (/airway|cannula|mask/.test(hay)) return find((n) => n.startsWith('ANESTHESIA AIRWAYS')) || find((n) => n.startsWith('ANESTHESIA'));
    // Gas sampling lines connect to the breathing circuit.
    return find((n) => n.startsWith('ANESTHESIA CIRCUIT')) || find((n) => n.startsWith('ANESTHESIA OTHER')) || find((n) => n.startsWith('ANESTHESIA'));
  }

  // Respiratory (non-anesthesia) — no dedicated EOC bucket, falls to MED SUPPLIES.
  for (const [token, re] of SUPPLY) {
    if (re.test(hay)) {
      const hit = find((n) => n.startsWith('MED SUPPLIES') && n.includes(token));
      if (hit) return hit;
    }
  }
  return find((n) => n.startsWith('MED SUPPLIES') && n.includes('OTHER')) || null;
}

// Mandatory columns that are intentionally blank (assigned later by Meditech),
// so they shouldn't be flagged as "missing" to the tech.
const AUTO_BLANK = new Set(['Number']);

/** Normalize a company name for matching (drop punctuation + legal suffixes). */
function normCompany(name) {
  return String(name || '')
    .toUpperCase()
    .replace(/[.,/&]/g, ' ')
    .replace(/\b(INC|LLC|LLP|LTD|CORP|CORPORATION|CO|COMPANY|GMBH|SA|AG|PLC|THE)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Match a GUDID company name to a Meditech manufacturer mnemonic from the
 * Lookups table. Tries exact-normalized, then prefix, then token overlap.
 * @returns {{name, code}|null}
 */
export function matchManufacturer(company, manufacturers = []) {
  const target = normCompany(company);
  if (!target) return null;
  let best = null;
  let bestScore = 0;
  for (const m of manufacturers) {
    const n = normCompany(m.name);
    if (!n) continue;
    let score = 0;
    if (n === target) score = 100;
    else if (n.startsWith(target) || target.startsWith(n)) score = 70;
    else {
      const t = new Set(target.split(' '));
      const overlap = n.split(' ').filter((w) => t.has(w)).length;
      if (overlap) score = 40 + overlap * 5;
    }
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return bestScore >= 40 ? best : null;
}

// Ordered keyword rules: first match wins. Tuples of [categoryCode, regex].
// More specific patterns go first; broad fallbacks go last.
const CATEGORY_RULES = [
  ['ANES',    /gas.sampl|sampl.*line|breath.*circuit|anesthes|endotrach|laryngoscop|airway manag|gas monitor|capnograph/],
  ['RESP',    /\brespir|ventilat|oxygen.*mask|nebuliz|spirometr|trach.*collar|suction.*catheter/],
  ['CATH',    /\bcatheter\b/],
  ['MS SUT',  /\bsuture\b/],
  ['SUTURE',  /\bsuture\b/],
  ['WOUND',   /wound.*care|wound.*dress|wound.*manag/],
  ['BAND',    /bandage|dressing|gauze/],
  ['GLOVES',  /\bglove\b/],
  ['MS NESY', /\bneedle\b|\bsyringe\b/],
  ['SYR',     /\bsyringe\b/],
  ['IV SUP',  /iv.*supply|iv.*set|infusion.*set|iv.*line/],
  ['IV SOL',  /intravenous.*solution|iv.*fluid|saline.*solution/],
  ['IMPL',    /implant|bone.*screw|bone.*plate|prosthes|anchor|interbody|pedicle|allograft|graft/],
  ['ORTHO',   /orthoped|bone.*saw|bone.*drill|fracture|osteotom/],
  ['KITS',    /\bkit\b|\btray\b/],
  ['INST',    /instrument|retractor|forcep|scissor|clamp|trocar|cannula/],
  ['DIAL',    /dialysis/],
  ['LAB',     /laboratory|reagent|specimen|culture|biopsy/],
  ['UROL',    /urology|urethr|bladder|prostat/],
  ['OB/GYN',  /obstet|gynecol|uterine|cervical/],
  ['LENS',    /intraocular.*lens|\biol\b|ophthalm.*lens/],
  ['FILM',    /x.ray.*film|radiograph.*film/],
  ['MED',     /\bpharmac|\bmedication\b|\bdrug\b/],
  ['MS MISC', /med.*surg|surgical.*supply/],
];

/** Suggest a Meditech category using priority keyword rules, then word-overlap fallback. */
export function suggestCategory(item, categories = null) {
  categories = categories ?? [];
  const hay = `${item.gmdnTerm} ${item.productCodeName} ${item.product} ${item.description}`.toLowerCase();
  if (!hay.trim()) return null;

  // 1. Try explicit keyword rules first.
  for (const [code, re] of CATEGORY_RULES) {
    if (re.test(hay)) {
      const cat = categories.find((c) => c.code === code);
      if (cat) return cat;
    }
  }

  // 2. Fall back to word-overlap scoring against category names.
  let best = null;
  let bestScore = 0;
  for (const c of categories) {
    const words = c.name.toLowerCase().split(/[\s,/]+/).filter((w) => w.length > 3);
    const score = words.filter((w) => hay.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return bestScore > 0 ? best : null;
}

/**
 * Map one stored catalog item to a Meditech row keyed by header. Auto-fills the
 * product-identity columns; mandatory finance fields are left blank for MM.
 */
export function buildMeditechRow(item, lookups = {}) {
  const lk = lookups ?? {};
  const mfr = matchManufacturer(item.manufacturer, lk.manufacturers);
  const name = item.product || item.description || '';
  const { head: desc1, rest } = wordCut(name, 30);
  const desc2 = wordCut(rest, 30).head;
  // Full, untruncated text for Ext Description (name + GUDID description if extra).
  const ext = [item.product, item.description]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' — ');
  const ref = item.catalogNumber || '';
  return {
    Number: '',
    'Allergen Haz': item.latex === 'Y' ? 'LATEX' : '',
    'Common Name': '',
    Description1: desc1,
    Description2: desc2,
    Category: item.category || '',
    'Ext Description': ext,
    Form: '',
    Implantable: item.implantable || '',
    'PO Type': '',
    UNSPSC: '',
    Packaging: item.packaging || '',
    'Pur Facility': '<MASTER>',
    'Charge Code': '',
    'Excl CDM Updates': '',
    HCPCS: '',
    EOC: item.eoc || '',
    'Mark Up %': '',
    'Patient EOC': '',
    'Patient UI': 'EA',
    'Tax Code': '',
    Taxable: '',
    // No distinct vendor data yet: use the manufacturer catalog/REF as the
    // vendor number & catalog number; vendor unit of purchase = largest pack.
    'Vendor Num': ref,
    'Vendor Order': '1',
    'Vendor UP': largestUnit(item.packaging),
    'Vendor Cost/UP': '',
    'Vendor Cat Num': ref,
    Manufacturer: mfr?.code || '',
    'Manufacturer Cat Num': ref,
    GTIN: item.gtin || '',
    'GTIN Unit': '',
    'GTIN Manufacturer': '',
  };
}

/** Which mandatory/facility columns are still empty for an item (for UI flags). */
export function missingRequired(item, lookups = {}) {
  const row = buildMeditechRow(item, lookups ?? {});
  return MEDITECH_COLUMNS.filter(
    (c) =>
      (c.req === 'mandatory' || c.req === 'facility') &&
      !FINANCE_BLANK.has(c.header) &&
      !AUTO_BLANK.has(c.header) &&
      !row[c.header]
  ).map((c) => c.header);
}

/** Build the Meditech-format CSV (exact ItemTemplate column order). */
export function buildMeditechCsv(items, lookups = {}) {
  const head = MEDITECH_HEADERS.map(csvCell).join(',');
  const rows = items.map((it) => {
    const r = buildMeditechRow(it, lookups);
    return MEDITECH_HEADERS.map((h) => csvCell(r[h])).join(',');
  });
  return [head, ...rows].join('\r\n');
}

/** Lazy-load the (large) Meditech lookup tables only when needed. */
export async function loadLookups() {
  const mod = await import('../data/meditechLookups.json');
  return mod.default || mod;
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
