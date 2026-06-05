// Parse the "CAPITATED CONSTRUCTS" schedule (extracted from the DePuy/J&J
// Single-Site Agreement PDF) into structured JSON the engine can match against.
//
//   node recon/build/parse-constructs.mjs
//
// Input : recon/source/constructs-schedule.txt  (boilerplate-stripped PDF text)
// Output: recon/data/constructs.json
//
// Each construct becomes: { construct_id, name, price, type, slots }
// where `slots` maps a component slot (Stem/Head/Liner/Cup/Femur/...) to the
// list of eligible component families, each parsed into { family, sizeTier }.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', 'source', 'constructs-schedule.txt');
const OUT = join(HERE, '..', 'data', 'constructs.json');

// Known slot labels, longest-first so "Metal Liner" wins over "Liner".
const SLOTS = [
  'Sleeve Modular', 'Metal Liner', 'Acetab. Screw', 'Hole Eliminator',
  'Cementralizer', 'Centralizer', 'Cement Restrictor', 'Drill Bit',
  'Pin Non Sterile', 'Pin Sterile', 'Tib Tray',
  'Stem', 'Head', 'Liner', 'Cup', 'Femur', 'Insert', 'Patella',
];
const SLOT_RE = new RegExp(
  '^(' + SLOTS.map((s) => s.replace('.', '\\.')).join('|') + '):\\s*(.*)$',
);
const PRICE_RE = /\$([\d,]+\.\d{2})/;
const OSC_RE = /OSC\d+/;

// The slots that MUST be filled for a construct to be considered satisfied.
// These are the universal primary components; conditional parts (Sleeve
// Modular for S-Rom, dual-mobility Metal Liner) are handled separately so
// they don't wrongly exclude a standard build. Screws/drill bits/restrictors
// are bundled quantities, never price drivers.
const HIP_CORE = ['Stem', 'Head', 'Liner', 'Cup'];
const KNEE_CORE = ['Femur', 'Insert', 'Tib Tray'];

function parseFamily(token) {
  // token e.g. "Ceramic Delta TS > 36mm", "AltrX <= 36mm", "Metal", "Gription"
  const t = token.trim();
  let sizeTier = null;
  let family = t;
  const m = t.match(/(<=|>=|<|>|=)?\s*(\d+)\s*mm/i);
  if (m) {
    family = t.slice(0, m.index).trim();
    const op = m[1] || '=';
    sizeTier = { op, mm: Number(m[2]) };
  }
  return { family: family.replace(/\s+/g, ' ').trim(), sizeTier, raw: t };
}

function splitFamilies(value) {
  // Eligibility lists are comma-separated, but families themselves never
  // contain commas in this schedule, so a plain split is safe.
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseFamily);
}

function classifyType(slots) {
  if (KNEE_CORE.some((k) => slots[k])) return 'knee';
  if (HIP_CORE.some((k) => slots[k])) return 'hip';
  return 'addon'; // upcharges / single-slot add-ons
}

const lines = readFileSync(SRC, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

// A construct block runs up to and including the line bearing its price.
const blocks = [];
let cur = [];
for (const ln of lines) {
  cur.push(ln);
  if (PRICE_RE.test(ln)) {
    blocks.push(cur);
    cur = [];
  }
}

function parseBlock(block) {
  const text = block.join('\n');
  const price = Number(text.match(PRICE_RE)[1].replace(/,/g, ''));
  const osc = (text.match(OSC_RE) || [null])[0];

  const slots = {};
  const nameParts = [];
  let curSlot = null;

  for (const rawLn of block) {
    const ln = rawLn.replace(PRICE_RE, '').replace(/\s+/g, ' ').trim();
    if (!ln) continue;
    const m = ln.match(SLOT_RE);
    if (m) {
      curSlot = m[1];
      slots[curSlot] = (slots[curSlot] ? slots[curSlot] + ' ' : '') + m[2].trim();
    } else if (curSlot === null) {
      nameParts.push(ln); // pre-slot text is the construct name (+ OSC id)
    } else {
      const sm = ln.match(SLOT_RE);
      if (sm) {
        curSlot = sm[1];
        slots[curSlot] = sm[2].trim();
      } else {
        slots[curSlot] = (slots[curSlot] + ' ' + ln).trim();
      }
    }
  }

  let name = nameParts.join(' ').replace(/\s+/g, ' ').trim();
  if (osc) name = name.split(osc)[0].trim();

  const eligibility = {};
  for (const [k, v] of Object.entries(slots)) {
    eligibility[k] = splitFamilies(v.replace(/QTY\s*\d+/gi, '').trim());
  }

  return {
    construct_id: osc,
    name,
    price,
    type: classifyType(slots),
    core_slots: classifyType(slots) === 'knee' ? KNEE_CORE : HIP_CORE,
    slots: eligibility,
    slots_raw: slots,
  };
}

const constructs = blocks.map(parseBlock).filter((c) => c.construct_id);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(constructs, null, 2) + '\n');
console.log(`Parsed ${constructs.length} constructs -> ${OUT}`);
for (const c of constructs) {
  console.log(`  ${c.construct_id}  $${c.price.toFixed(2).padStart(8)}  [${c.type}]  ${c.name}`);
}
