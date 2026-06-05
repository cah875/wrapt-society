// Parse the contracted line-item price list (CSV export) into a lookup index.
//
//   node recon/build/parse-lineprices.mjs
//
// Input : recon/source/Depuy_List_Price_Hip.csv
// Output: recon/data/lineprices.json
//
// The same catalog number can appear in several rows with different effective
// windows, so we index by NORMALIZED catalog number -> array of priced windows.
// The engine then selects the window valid on the date of service.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeCatalog } from '../lib/normalize.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'source', 'Depuy_List_Price_Hip.csv');
const OUT = join(HERE, '..', 'data', 'lineprices.json');

// Minimal CSV reader (handles quoted fields; this export has none, but be safe).
function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// US date M/D/YYYY -> ISO YYYY-MM-DD (null if blank/invalid).
function isoDate(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mo, d, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

const raw = readFileSync(SRC, 'utf8').replace(/^﻿/, '');
const rows = parseCsv(raw);
const header = rows[0];
const col = (name) => header.indexOf(name);

const idx = {
  hospital: col('Hospital'),
  manufacturer: col('Manufacturer'),
  division: col('Division'),
  catalog: col('Manufacturer Catalog Number'),
  desc: col('Product Description'),
  list: col('List price'),
  contracted: col('Contracted price'),
  cap: col('Cap construct price'),
  provisional: col('Provisional price'),
  uom: col('Unitof measure'),
  uomQty: col('UOM quantity'),
  start: col('StartDate'),
  end: col('EndDate'),
  useProv: col('Use provisional price'),
};

const num = (v) => {
  const n = Number(String(v).replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const index = {};
let priced = 0;
let placeholder = 0;

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.length < header.length) continue;
  const catalog = (row[idx.catalog] || '').trim();
  if (!catalog) continue;
  const key = normalizeCatalog(catalog);
  const contracted = num(row[idx.contracted]);
  // A "real" line price is > $5; values of 1/2/3 are placeholders for items
  // that are actually priced inside a capitated construct.
  const isPlaceholder = contracted == null || contracted <= 5;
  if (isPlaceholder) placeholder++; else priced++;

  (index[key] ||= []).push({
    catalog,
    description: (row[idx.desc] || '').trim(),
    list_price: num(row[idx.list]),
    contracted_price: contracted,
    cap_construct_price: num(row[idx.cap]),
    uom: (row[idx.uom] || '').trim() || null,
    uom_qty: num(row[idx.uomQty]),
    start: isoDate(row[idx.start]),
    end: isoDate(row[idx.end]),
    use_provisional: (row[idx.useProv] || '').trim().toLowerCase() === 'yes',
    line_priced: !isPlaceholder, // false => governed by a construct
  });
}

mkdirSync(dirname(OUT), { recursive: true });
const payload = {
  meta: {
    source: 'Depuy_List_Price_Hip.csv',
    hospital: rows[1]?.[idx.hospital] || null,
    manufacturer: rows[1]?.[idx.manufacturer] || null,
    division: rows[1]?.[idx.division] || null,
    rows: rows.length - 1,
    distinct_catalog: Object.keys(index).length,
    line_priced_rows: priced,
    placeholder_rows: placeholder,
    built_at: new Date().toISOString(),
  },
  index,
};
writeFileSync(OUT, JSON.stringify(payload, null, 0) + '\n');
console.log(`Indexed ${payload.meta.rows} rows -> ${Object.keys(index).length} catalog numbers`);
console.log(`  line-priced: ${priced}   placeholder (construct-governed): ${placeholder}`);
console.log(`Wrote ${OUT}`);
