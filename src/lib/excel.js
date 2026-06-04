// Local Excel (.xlsx) persistence using the File System Access API.
//
// The technician picks (or creates) an .xlsx file that lives inside a
// OneDrive/SharePoint-synced folder on their laptop. The app reads, updates,
// and writes that file directly in the browser; OneDrive handles sharing the
// file with the rest of the organization. No cloud account or Azure required.
//
// Only Chromium browsers (Edge/Chrome) expose the File System Access API.
//
// ExcelJS is heavy, so it is loaded on demand (first file operation) to keep the
// initial app bundle small for the loading-dock laptop.

import { normalizeGtin, normId } from './gs1.js';

async function getExcelJS() {
  const mod = await import('exceljs');
  return mod.default || mod;
}

const SHEET_NAME = 'Inventory';
export const HEADER = [
  'Timestamp',
  'Product Name',
  'Expiration Date',
  'Lot Number',
  'Quantity',
  'Unit Type',
  'Days Until Expiration',
  'Status',
  'Location',
  'GTIN',
  'Reference',
  'Serial',
];

// ARGB fills for the Status column (col 8), matching the in-app color coding.
const STATUS_FILL = {
  EXPIRED: 'FFF4CCCC', // red
  'Expires Soon': 'FFF4CCCC', // red
  Watch: 'FFFFF2CC', // yellow
  OK: 'FFD9EAD3', // green
};

/** Is the File System Access API available (Edge/Chrome)? */
export function isSupported() {
  return (
    typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    'showOpenFilePicker' in window
  );
}

const FILE_TYPES = [
  {
    description: 'Excel Workbook',
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  },
];

// ── Persisting the file handle across sessions (IndexedDB) ──────────────────
const DB_NAME = 'hiet-excel';
const STORE = 'handles';
const HANDLE_KEY = 'logfile';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHandle(handle) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function loadHandle() {
  const db = await openDb();
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(HANDLE_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
}

export async function clearHandle() {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(HANDLE_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// ── Permissions ────────────────────────────────────────────────────────────
/** Current permission for a handle without prompting: 'granted'|'prompt'|'denied'. */
export async function queryPermission(handle, write = true) {
  if (!handle?.queryPermission) return 'denied';
  return handle.queryPermission({ mode: write ? 'readwrite' : 'read' });
}

/** Request permission (must be called from a user gesture). */
export async function requestPermission(handle, write = true) {
  if (!handle?.requestPermission) return false;
  const res = await handle.requestPermission({ mode: write ? 'readwrite' : 'read' });
  return res === 'granted';
}

// ── Workbook helpers ─────────────────────────────────────────────────────────
async function readWorkbook(handle) {
  const ExcelJS = await getExcelJS();
  const file = await handle.getFile();
  const wb = new ExcelJS.Workbook();
  if (file.size > 0) {
    const buf = await file.arrayBuffer();
    await wb.xlsx.load(buf);
  }
  return wb;
}

async function writeWorkbook(handle, wb) {
  const buffer = await wb.xlsx.writeBuffer();
  const writable = await handle.createWritable();
  await writable.write(buffer);
  await writable.close();
}

/** Get the inventory worksheet, creating it + a bold header row if needed. */
function ensureSheet(wb) {
  let ws = wb.getWorksheet(SHEET_NAME) || wb.worksheets[0];
  if (!ws) ws = wb.addWorksheet(SHEET_NAME);

  const firstCell = ws.getRow(1).getCell(1).value;
  if (ws.rowCount === 0 || firstCell === null || firstCell === undefined || firstCell === '') {
    const header = ws.getRow(1);
    HEADER.forEach((h, i) => {
      header.getCell(i + 1).value = h;
    });
    header.font = { bold: true };
    header.commit();
    // Reasonable default column widths.
    [22, 28, 16, 16, 10, 12, 18, 16, 20, 18, 16, 18].forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  } else {
    // Migrate older files by adding any missing identifier header columns.
    const header = ws.getRow(1);
    let changed = false;
    [
      [10, 'GTIN'],
      [11, 'Reference'],
      [12, 'Serial'],
    ].forEach(([col, name]) => {
      if (coerce(header.getCell(col).value) !== name) {
        header.getCell(col).value = name;
        header.getCell(col).font = { bold: true };
        ws.getColumn(col).width = 18;
        changed = true;
      }
    });
    if (changed) header.commit();
  }
  return ws;
}

function coerce(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // ExcelJS rich text / formula / hyperlink objects.
    if ('text' in value) return value.text;
    if ('result' in value) return value.result;
    if ('richText' in value) return value.richText.map((r) => r.text).join('');
    return String(value);
  }
  return value;
}

const norm = (s) => String(coerce(s) ?? '').trim().toLowerCase();

/**
 * Do an entry and a worksheet row refer to the same physical unit/lot?
 * Serialized items are unique per serial; otherwise prefer GTIN, then fall back
 * to the product+lot+expiration triple (keeps legacy rows working).
 */
function rowMatchesEntry(entry, row) {
  const es = normId(entry.serial);
  const rs = normId(coerce(row.getCell(12).value));
  if (es || rs) return Boolean(es && rs && es === rs);

  const eg = normalizeGtin(entry.gtin);
  const rg = normalizeGtin(coerce(row.getCell(10).value));
  if (eg && rg) {
    return (
      eg === rg &&
      norm(entry.lot) === norm(row.getCell(4).value) &&
      norm(entry.expiration) === norm(row.getCell(3).value)
    );
  }
  return (
    norm(entry.product) === norm(row.getCell(2).value) &&
    norm(entry.lot) === norm(row.getCell(4).value) &&
    norm(entry.expiration) === norm(row.getCell(3).value)
  );
}

function applyStatusFill(row, status) {
  const argb = STATUS_FILL[status];
  if (!argb) return;
  row.getCell(8).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb },
  };
}

function entryToValues(e) {
  return [
    e.timestamp ?? '',
    e.product ?? '',
    e.expiration ?? '',
    e.lot ?? '',
    e.quantity ?? '',
    e.unit ?? '',
    e.daysUntil ?? '',
    e.status ?? '',
    e.location ?? '',
    e.gtin ?? '',
    e.ref ?? '',
    e.serial ?? '',
  ];
}

/**
 * Insert or update a single entry in the workbook (matched by product+lot+exp),
 * then persist. Updating keeps one row per item so quantities stay accurate.
 */
export async function upsertEntry(handle, entry) {
  const wb = await readWorkbook(handle);
  const ws = ensureSheet(wb);

  let target = null;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    if (rowMatchesEntry(entry, row)) target = row;
  });

  const values = entryToValues(entry);
  if (target) {
    values.forEach((v, i) => {
      target.getCell(i + 1).value = v;
    });
    applyStatusFill(target, entry.status);
    target.commit();
  } else {
    const row = ws.addRow(values);
    applyStatusFill(row, entry.status);
    row.commit();
  }

  await writeWorkbook(handle, wb);
}

/** Read every data row back as plain entry objects (for cache + dedup). */
export async function readAllEntries(handle) {
  const wb = await readWorkbook(handle);
  const ws = wb.getWorksheet(SHEET_NAME) || wb.worksheets[0];
  if (!ws) return [];
  const out = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const product = coerce(row.getCell(2).value);
    if (!product && !coerce(row.getCell(3).value)) return; // skip blank rows
    out.push({
      timestamp: String(coerce(row.getCell(1).value) || ''),
      product: String(product || ''),
      expiration: String(coerce(row.getCell(3).value) || ''),
      lot: String(coerce(row.getCell(4).value) || ''),
      quantity: Number(coerce(row.getCell(5).value)) || 0,
      unit: String(coerce(row.getCell(6).value) || 'each'),
      location: String(coerce(row.getCell(9).value) || ''),
      gtin: String(coerce(row.getCell(10).value) || ''),
      ref: String(coerce(row.getCell(11).value) || ''),
      serial: String(coerce(row.getCell(12).value) || ''),
    });
  });
  return out;
}

// ── Item Master (catalog) sheet ──────────────────────────────────────────────
// A second worksheet in the SAME workbook holding one row per unique product,
// enriched from GUDID + the captured image. This is the clean source for the
// Meditech Expanse item-master export. Deduped by GTIN, then catalog/REF, then
// product name.

const ITEM_MASTER_SHEET = 'Item Master';
export const ITEM_MASTER_HEADER = [
  'Catalogued',
  'Category',
  'Product Name',
  'Brand Name',
  'Manufacturer',
  'Model / Version',
  'Catalog / REF #',
  'GTIN',
  'Description',
  'GMDN Term',
  'GMDN Definition',
  'FDA Product Code',
  'Product Code Name',
  'Sterile',
  'Sterilization Method',
  'Single Use',
  'HCT/P (Tissue)',
  'Latex',
  'MRI Safety',
  'Rx / OTC',
  'Sizes',
  'Packaging',
  'Captures Lot',
  'Captures Serial',
  'Captures Expiration',
  'Distribution Status',
  'Source',
  'Notes',
];

/** Render a tri-state boolean (true/false/null) as Y / N / blank. */
function yn(v) {
  if (v === true) return 'Y';
  if (v === false) return 'N';
  return '';
}

function catalogItemToValues(it) {
  return [
    it.catalogued ?? '',
    it.category ?? '',
    it.product ?? '',
    it.brandName ?? '',
    it.manufacturer ?? '',
    it.model ?? '',
    it.catalogNumber ?? '',
    it.gtin ?? '',
    it.description ?? '',
    it.gmdnTerm ?? '',
    it.gmdnDefinition ?? '',
    it.productCode ?? '',
    it.productCodeName ?? '',
    yn(it.sterile),
    it.sterilizationMethod ?? '',
    yn(it.singleUse),
    yn(it.hctp),
    yn(it.latex),
    it.mriSafety ?? '',
    it.rxOtc ?? '',
    it.sizes ?? '',
    it.packaging ?? '',
    yn(it.capturesLot),
    yn(it.capturesSerial),
    yn(it.capturesExpiration),
    it.distributionStatus ?? '',
    it.source ?? '',
    it.notes ?? '',
  ];
}

/** Get (or create) the Item Master sheet with a bold header row. */
function ensureItemMasterSheet(wb) {
  let ws = wb.getWorksheet(ITEM_MASTER_SHEET);
  if (!ws) {
    ws = wb.addWorksheet(ITEM_MASTER_SHEET);
    const header = ws.getRow(1);
    ITEM_MASTER_HEADER.forEach((h, i) => {
      header.getCell(i + 1).value = h;
    });
    header.font = { bold: true };
    header.commit();
    // Sensible default widths (wider for text-heavy columns).
    const widths = [18, 12, 30, 22, 22, 18, 16, 18, 40, 28, 48, 14, 28, 9, 20, 11, 14, 8, 26, 10, 24, 30, 13, 15, 18, 22, 12, 30];
    widths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  }
  return ws;
}

const CAT_GTIN = 8; // GTIN column index
const CAT_REF = 7; // Catalog/REF column index
const CAT_NAME = 3; // Product Name column index

function catalogRowMatches(item, row) {
  const ig = normalizeGtin(item.gtin);
  const rg = normalizeGtin(coerce(row.getCell(CAT_GTIN).value));
  if (ig && rg) return ig === rg;

  const ir = normId(item.catalogNumber);
  const rr = normId(coerce(row.getCell(CAT_REF).value));
  if (ir && rr) return ir === rr;

  return Boolean(item.product) && norm(item.product) === norm(row.getCell(CAT_NAME).value);
}

/** Insert or update one catalog item (matched by GTIN/REF/name), then persist. */
export async function upsertCatalogItem(handle, item) {
  const wb = await readWorkbook(handle);
  const ws = ensureItemMasterSheet(wb);

  let target = null;
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // header
    if (catalogRowMatches(item, row)) target = row;
  });

  const values = catalogItemToValues(item);
  if (target) {
    values.forEach((v, i) => {
      target.getCell(i + 1).value = v;
    });
    target.commit();
  } else {
    ws.addRow(values).commit();
  }

  await writeWorkbook(handle, wb);
}

/** Read every catalog row back as plain item objects. */
export async function readAllCatalogItems(handle) {
  const wb = await readWorkbook(handle);
  const ws = wb.getWorksheet(ITEM_MASTER_SHEET);
  if (!ws) return [];
  const cell = (row, i) => String(coerce(row.getCell(i).value) || '');
  const out = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const product = cell(row, CAT_NAME);
    const gtin = cell(row, CAT_GTIN);
    if (!product && !gtin) return; // skip blank rows
    out.push({
      catalogued: cell(row, 1),
      category: cell(row, 2),
      product,
      brandName: cell(row, 4),
      manufacturer: cell(row, 5),
      model: cell(row, 6),
      catalogNumber: cell(row, 7),
      gtin,
      description: cell(row, 9),
      gmdnTerm: cell(row, 10),
      gmdnDefinition: cell(row, 11),
      productCode: cell(row, 12),
      productCodeName: cell(row, 13),
      sterile: cell(row, 14),
      sterilizationMethod: cell(row, 15),
      singleUse: cell(row, 16),
      hctp: cell(row, 17),
      latex: cell(row, 18),
      mriSafety: cell(row, 19),
      rxOtc: cell(row, 20),
      sizes: cell(row, 21),
      packaging: cell(row, 22),
      capturesLot: cell(row, 23),
      capturesSerial: cell(row, 24),
      capturesExpiration: cell(row, 25),
      distributionStatus: cell(row, 26),
      source: cell(row, 27),
      notes: cell(row, 28),
    });
  });
  return out;
}

/** Prompt the tech to pick an existing .xlsx; persists the handle. */
export async function pickExistingFile() {
  const [handle] = await window.showOpenFilePicker({
    types: FILE_TYPES,
    excludeAcceptAllOption: false,
    multiple: false,
  });
  await saveHandle(handle);
  return handle;
}

/** Prompt the tech to create a new .xlsx (initialized with a header); persists. */
export async function createNewFile(suggestedName = 'implant-expiration-log.xlsx') {
  const handle = await window.showSaveFilePicker({ suggestedName, types: FILE_TYPES });
  const ExcelJS = await getExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.created = new Date();
  ensureSheet(wb);
  await writeWorkbook(handle, wb);
  await saveHandle(handle);
  return handle;
}
