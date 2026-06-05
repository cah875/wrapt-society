// Classify a scanned implant component into the dimensions a capitated
// construct actually cares about: { slot, family, sizeMm }.
//
// Constructs are NOT matched by catalog number — they are matched by the
// COMBINATION of component families and size tiers. So the reconciliation
// engine needs each line on a billsheet reduced to (slot, family, size).
//
// This is a rules-based classifier seeded for the DePuy Synthes hip line in
// the example agreement. It is intentionally data-driven (keyword tables) so
// new families/vendors are added by extending the tables, not the logic.

// Slot detection — order matters (first hit wins).
const SLOT_RULES = [
  { slot: 'Stem', re: /\bSTEM\b/ },
  { slot: 'Head', re: /\bHEAD\b/ },
  { slot: 'Metal Liner', re: /\b(METAL LINER|DUAL MOBILITY (LINER|CUP))\b/ },
  // knee (checked before hip Liner/Cup so "INSERT"/"TIBIAL" win for knees)
  { slot: 'Tib Tray', re: /\bTIB(IAL)? (TRAY|BASE|BASEPLATE)\b/ },
  { slot: 'Femur', re: /\bFEMORAL (COMPONENT|KNEE)\b|\bFEMUR\b/ },
  { slot: 'Insert', re: /\b(INSERT|BEARING)\b/ },
  { slot: 'Patella', re: /\bPATELLA\b/ },
  // hip
  { slot: 'Liner', re: /\bLINER\b/ },
  { slot: 'Cup', re: /\b(SHELL|CUP|ACETABULAR (SHELL|CUP|SECTOR))\b/ },
];

// Family detection per slot — order matters (most specific first).
const FAMILY_RULES = {
  Stem: [
    ['Actis', /ACTIS/],
    ['Corail', /CORAIL/],
    ['Summit Cemented', /SUMMIT.*CEMENT/],
    ['Summit Duofix', /SUMMIT.*DUOFIX/],
    ['Summit Porous', /SUMMIT.*POROUS/],
    ['Summit Porous', /SUMMIT/], // fallback
    ['AML', /\bAML\b/],
    ['C-Stem', /C-?STEM/],
    ['TriLock', /TRI-?LOCK/],
    ['Emphasys', /EMPHASYS/],
    ['S-Rom', /S-?ROM/],
  ],
  Head: [
    ['Ceramic Delta TS', /DELTA\s*TS/],
    ['Ceramic ARTICULEZE', /ARTICUL/],
    ['Ceramic Delta (not TS)', /DELTA|BIOLOX|CERAMIC/],
    ['Metal', /\b(METAL|COCR|CO-CR)\b/],
  ],
  Liner: [
    ['BI-MENTUM AltrX', /BI-?MENTUM.*ALTRX/],
    ['BI-MENTUM Liner', /BI-?MENTUM/],
    ['Emphasys AOX', /EMPHASYS.*AOX|AOX/],
    ['AltrX', /ALTRX|ALTR-?X/],
    ['Marathon', /MARATHON/],
  ],
  Cup: [
    ['Emphasys Gription S', /EMPHASYS.*GRIPTION/],
    ['Gription', /GRIPTION/],
    ['Porocoat Multihole', /POROCOAT.*MULTI/],
    ['Porocoat', /POROCOAT/],
    ['Duofix', /DUOFIX/],
  ],
  'Metal Liner': [
    ['Pinnacle DM', /PINNACLE.*DM|DUAL MOBILITY/],
    ['Emphasys DM', /EMPHASYS.*DM/],
  ],
  Femur: [['HP UNI', /HP UNI/], ['Porous', /POROUS|CEMENTLESS/], ['Cemented', /CEMENT/]],
  Insert: [['FB AOX', /\bFB\b.*AOX|FIXED BEARING/], ['RP AOX', /\bRP\b.*AOX|ROTATING/], ['HP UNI', /HP UNI/]],
  'Tib Tray': [['Porous FB', /POROUS.*FB/], ['Cemented FB', /CEMENT.*FB/], ['HP UNI Metal', /HP UNI/]],
  Patella: [['All Poly Dome', /DOME/], ['All Poly Anatomic', /ANATOMIC|PATELLA/]],
};

// Which size on the label drives the construct size tier, per slot.
//   Head tier  -> head diameter
//   Liner tier -> inner diameter (the bearing/head size), e.g. "40mm ID"
//   Cup        -> not tiered by size in this schedule
function extractSize(slot, desc) {
  const d = desc.toUpperCase();
  if (slot === 'Liner') {
    const id = d.match(/(\d+(?:\.\d+)?)\s*MM?\s*ID/) || d.match(/(\d+(?:\.\d+)?)\s*ID/);
    if (id) return Number(id[1]);
  }
  if (slot === 'Cup') {
    const od = d.match(/(\d+(?:\.\d+)?)\s*MM?\s*OD/);
    if (od) return Number(od[1]);
  }
  const mm = d.match(/(\d+(?:\.\d+)?)\s*MM/);
  return mm ? Number(mm[1]) : null;
}

function pick(rules, text) {
  for (const [val, re] of rules) if (re.test(text)) return val;
  return null;
}

/**
 * @param {{ref?:string, description:string, gtin?:string, lot?:string, qty?:number}} item
 * @returns {{slot, family, sizeMm, confidence, notes:string[]}}
 */
export function classify(item) {
  const desc = (item.description || '').toUpperCase();
  const notes = [];

  let slot = null;
  for (const r of SLOT_RULES) {
    if (r.re.test(desc)) { slot = r.slot; break; }
  }
  if (!slot) {
    return { slot: null, family: null, sizeMm: null, confidence: 'none',
      notes: ['Could not determine component slot from description'] };
  }

  const family = pick(FAMILY_RULES[slot] || [], desc);
  if (!family) notes.push(`No known ${slot} family matched`);

  const sizeMm = extractSize(slot, desc);
  if (sizeMm == null && (slot === 'Head' || slot === 'Liner')) {
    notes.push('Size not found — construct size tier cannot be verified');
  }

  const confidence = family && sizeMm != null ? 'high'
    : family ? 'medium' : 'low';

  return { slot, family, sizeMm, confidence, notes };
}
