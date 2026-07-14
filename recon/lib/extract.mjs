// Turn raw OCR text from a photographed billsheet into a structured case:
// a header (patient / MRN / case # / date of service) plus one item per
// implant sticker (REF, LOT, qty, description).
//
// Sticker sheets are noisy: barcode digit runs, GS1 "(01)..." lines, vendor
// addresses, STERILE/REV boilerplate, and OCR confusions (O→0, S→5, B→8).
// The strategy is anchor-and-block: find REF catalog-number anchors, treat
// the lines between anchors as that item's block, and keep only the lines
// that look like a product description.

import { normalizeCatalog } from './normalize.mjs';

// Common OCR digit confusions, applied only when correcting candidate
// catalog/ref digits (never to free text).
const DIGIT_FIX = { O: '0', o: '0', Q: '0', D: '0', I: '1', l: '1', i: '1',
  '|': '1', Z: '2', S: '5', s: '5', B: '8', G: '6', T: '7' };
const fixDigits = (s) => s.replace(/[OoQDIli|ZSsBGT]/g, (c) => DIGIT_FIX[c] || c);

// DePuy-style catalog refs on these sheets: 3-4 digits, 2 digits, 3 digits,
// usually hyphenated (1365-40-720, 508-32-204, 804-06-318).
const REF_SHAPE = /(\d{3,4})\s*[-–.]\s*(\d{2})\s*[-–.]\s*(\d{3})/;

// Lines that are sticker plumbing, not product description.
const NOISE = [
  /^\(?0?1\)?\s*\d{8,}/,           // GS1 (01)GTIN human-readable line
  /\(\s*\d{2}\s*\)\s*\d{4,}/,      // (17)expiry(10)lot runs
  /\d{12,}/,                        // long barcode digit runs
  /^[|Il\s.:_\-—=]+$/,              // barcode misread as bars
  /\bSTERILE\b/i,
  /\bREV\W*[A-Z]?\s*$/i,
  /\bQTY\b/i,
  /\bLOT\b/i,
  /\bREF\b/i,
  /\bUDI\b/i,
  /\bMR\b\s*$/,                     // MR-conditional chip
  /DEPUY|LOUGHBEG|RINGASKIDDY|CO\.?\s*CORK|IRELAND|WARSAW|ORTHOPAEDICS/i,
  /DJOSURGICAL|ENOVIS|KOMET/i,
  /^\s*(20\d\d[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d\d)\s*$/, // bare dates
  /EXPIR|USE BY/i,
  /^PAGE\b/i, /HOSPITAL SIGNATURE|TRANSPORT|FREIGHT|ADDITIONAL HANDLING|BILL-?ONLY COST/i,
  /PLACE STICKERS|WASTED|GUIDELINE|REASON FOR WASTE/i,
  /OPTIMIZE|REP SIGNATURE|VHN\s|PATIENT\s*STICKER/i,
];

const isNoise = (line) => NOISE.some((re) => re.test(line));

// Letter-heavy enough to be words rather than a mangled barcode — but always
// keep lines carrying a millimetre size ("40mm +5 12/14 TAPER"): the construct
// size tier depends on them even when they are letter-poor.
function looksLikeText(line) {
  if (/\d+\s*MM\b/i.test(line)) return true;
  const letters = (line.match(/[A-Za-z]/g) || []).length;
  return letters >= 4 && letters / Math.max(line.length, 1) > 0.35;
}

function toIsoDate(mdY) {
  const m = mdY.match(/(\d{1,2})[\/](\d{1,2})[\/](20\d\d)/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/**
 * @param {string} text        raw OCR output (newline-separated)
 * @param {object} [lineIndex] lineprices.index — when given, refs are
 *                             validated (and digit-fixed) against the catalog
 * @returns {{header: object, items: object[], warnings: string[]}}
 */
export function extractSheet(text, lineIndex) {
  const rawLines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const warnings = [];

  // ---- header ---------------------------------------------------------
  const header = { patient: null, mrn: null, case_id: null, date_of_service: null };
  const head = rawLines.slice(0, 12).join('\n');
  const mrn = head.match(/\bMR\s?(\d{6,10})\b/i) || text.match(/\bMR\s?(\d{6,10})\b/i);
  if (mrn) header.mrn = `MR${mrn[1]}`;
  const kase = text.match(/\bNW\s?(\d{8,12})\b/i);
  if (kase) header.case_id = `NW${kase[1]}`;
  const dos = text.match(/DOS\W{0,3}(\d{1,2}\/\d{1,2}\/20\d\d)/i) || head.match(/(\d{1,2}\/\d{1,2}\/20\d\d)/);
  if (dos) header.date_of_service = toIsoDate(dos[1]);
  // Patient: a "Last,First M" token near the top that isn't a doctor line
  // (may carry a prefix like "Patient sticker Gregg,Vernon L").
  for (const l of rawLines.slice(0, 8)) {
    if (/\b(MD|DO|PA|NP)\b\.?\s*$/.test(l)) continue;
    const m = l.match(/([A-Z][A-Za-z'\-]{2,})\s*,\s*([A-Z][A-Za-z'\-\s.]{1,30})$/);
    if (m) { header.patient = `${m[1]}, ${m[2].trim()}`; break; }
  }

  // ---- item anchors ----------------------------------------------------
  // An anchor line contains a catalog ref — with or without a leading "REF".
  const anchors = [];
  rawLines.forEach((line, idx) => {
    // Prefer explicit REF-labelled tokens; fall back to any ref-shaped token.
    const scope = line.match(/REF\W{0,3}([0-9OoQDIli|ZSsBGT\-–.\s]{8,16})/i);
    const target = fixDigits(scope ? scope[1] : line);
    const m = target.match(REF_SHAPE);
    if (!m) return;
    const ref = `${m[1]}-${m[2]}-${m[3]}`;
    // Guard against barcode runs mis-shaping into a ref: require hyphen/dot
    // separators in the original, or an explicit REF label on the line.
    if (!scope && !/[-–.]/.test(line)) return;
    anchors.push({ idx, ref, labelled: !!scope });
  });

  // Dedup consecutive anchors with the same ref (sticker printed twice / OCR echo).
  const uniq = [];
  for (const a of anchors) {
    const prev = uniq[uniq.length - 1];
    if (prev && prev.ref === a.ref) continue;
    uniq.push(a);
  }

  // ---- blocks → items --------------------------------------------------
  const items = uniq.map((a, i) => {
    const end = i + 1 < uniq.length ? uniq[i + 1].idx : Math.min(rawLines.length, a.idx + 14);
    const block = rawLines.slice(a.idx, end);

    const lot = (() => {
      for (const l of block) {
        const m = fixOcrLot(l);
        if (m) return m;
      }
      return null;
    })();

    const qty = (() => {
      for (const l of block) {
        const m = l.match(/QTY\W{0,3}(\d{1,2})\b/i);
        if (m) return Number(m[1]);
      }
      return 1;
    })();

    const descLines = block
      .map((l) => l.replace(/REF\W{0,3}[0-9OoQDIli|ZSsBGT\-–.\s]{8,16}/i, ' ').trim())
      .filter((l) => l && !isNoise(l) && looksLikeText(l));
    let description = descLines.join(' ').replace(/\s+/g, ' ').trim().toUpperCase();

    // Validate the ref against the catalog; try digit-fix variants if the
    // straight read isn't found.
    let ref = a.ref;
    let validated = false;
    let catalogDescription = null;
    if (lineIndex) {
      const hit = lineIndex[normalizeCatalog(ref)];
      if (hit) { validated = true; catalogDescription = hit[0].description; }
    }

    return { ref, lot, qty, description, catalogDescription, validated, source_line: a.idx };
  });

  if (!items.length) warnings.push('No catalog REF numbers found — try a sharper photo or Sparse OCR mode.');
  for (const it of items) {
    if (lineIndex && !it.validated) warnings.push(`REF ${it.ref} not found in the contract price file — check the digits.`);
    if (!it.description) warnings.push(`REF ${it.ref}: no readable description near the sticker.`);
  }

  return { header, items, warnings };
}

// LOT tokens mix letters+digits (D26032664, 5069982, M85R42) — only strip
// obvious OCR bar noise, don't digit-fix (letters are legitimate).
function fixOcrLot(line) {
  const m = line.match(/LOT\W{0,3}([A-Z0-9]{4,14})\b/i);
  return m ? m[1].toUpperCase() : null;
}
