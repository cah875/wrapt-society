// Export the reconciliation results as a flat CSV (one row per component line,
// case-level pricing/status repeated per row) — the spreadsheet companion to
// the preview dashboard.
//
//   node recon/build/export-csv.mjs   ->   recon/reconciliation.csv
//
// The output carries PHI (patient name, MRN) so recon/*.csv is gitignored;
// this generator is tracked, the generated file is not.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { reconcile } from '../lib/engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const load = (p) => JSON.parse(readFileSync(p, 'utf8'));

const data = {
  constructs: load(join(ROOT, 'data', 'constructs.json')),
  lineprices: load(join(ROOT, 'data', 'lineprices.json')),
};

const caseDir = join(ROOT, 'cases');
const cases = readdirSync(caseDir).filter((f) => f.endsWith('.json')).sort();

const COLUMNS = [
  'Patient', 'MRN', 'Case ID', 'DOS', 'Side', 'Type',
  'Slot', 'Family', 'Size (mm)', 'REF', 'LOT', 'Qty', 'Description', 'Confidence',
  'Selected Construct', 'Construct Name', 'Construct Price', 'Expected Case Price',
  'Status', 'Flags',
];

// RFC-4180 field escaping: quote when the value has a comma/quote/newline.
const cell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (vals) => vals.map(cell).join(',');

const lines = [row(COLUMNS)];
let componentRows = 0;

for (const f of cases) {
  const raw = load(join(caseDir, f));
  const r = reconcile(raw, data, { pricingPolicy: 'lowest' });
  const flags = r.flags.map((fl) => fl.code).join('; ');
  const con = r.selected;

  for (const c of r.components) {
    lines.push(row([
      raw.patient, raw.mrn, r.case_id, r.date_of_service, raw.side, r.case_type,
      c.slot, c.family, c.sizeMm, c.ref, c.lot, c.qty, c.description, c.confidence,
      con ? con.construct_id : '', con ? con.name : '', con ? con.price : '',
      r.expected_total, r.status, flags,
    ]));
    componentRows++;
  }
}

const OUT = join(ROOT, 'reconciliation.csv');
writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`Wrote ${OUT}  (${cases.length} cases, ${componentRows} component rows)`);
