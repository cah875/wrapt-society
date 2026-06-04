// Parse GS1 / UDI barcodes scanned from medical device packaging.
//
// Implant packages carry a UDI in a GS1 carrier (GS1-128 linear or GS1
// DataMatrix). The data is a series of Application Identifiers (AIs):
//   (01) GTIN-14, (17) expiration YYMMDD, (10) lot/batch, (21) serial,
//   (11) production date YYMMDD.
//
// Fixed-length AIs have known lengths; variable-length AIs (10, 21) run until a
// GS1 separator (FNC1 == ASCII 29 / "\x1d") or the end of the string. Most USB
// scanners emit the separator as \x1d; configure the scanner to "send GS / FNC1"
// for the most reliable parsing.

// Lengths of the (subset of) fixed-length AIs we care about, plus a few common.
const FIXED_AI = {
  '00': 18,
  '01': 14,
  '11': 6,
  '12': 6,
  '13': 6,
  '15': 6,
  '16': 6,
  '17': 6,
  '20': 2,
};

const GS = '\x1d';

/** Strip a leading symbology identifier (e.g. "]d2", "]C1") if present. */
function stripSymbology(raw) {
  return raw.replace(/^\][A-Za-z]\d/, '');
}

/** Convert GS1 YYMMDD → YYYY-MM-DD. DD == "00" means end of month. */
function gs1Date(yymmdd) {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  let dd = Number(yymmdd.slice(4, 6));
  // UDI dates are 20xx (GS1 pivots, but device dates are always future/recent).
  const year = 2000 + yy;
  if (mm < 1 || mm > 12) return '';
  if (dd === 0) dd = new Date(year, mm, 0).getDate(); // last day of month
  const pad = (n) => String(n).padStart(2, '0');
  return `${year}-${pad(mm)}-${pad(dd)}`;
}

/** Pad a bare GTIN (UPC/EAN) up to 14 digits. */
function toGtin14(digits) {
  return digits.padStart(14, '0');
}

/**
 * Parse a scanned string into normalized device fields.
 * @returns {{gtin, expiration, lot, serial, productionDate, raw, isUdi}}
 */
export function parseScan(input) {
  const result = {
    gtin: '',
    expiration: '',
    lot: '',
    serial: '',
    productionDate: '',
    raw: input || '',
    isUdi: false,
  };
  if (!input) return result;

  let s = stripSymbology(String(input).trim());

  // Bare product barcode (UPC-A/EAN-13/GTIN-14) with no AIs.
  if (/^\d{8}$|^\d{12,14}$/.test(s)) {
    result.gtin = toGtin14(s);
    return result;
  }

  // Walk AI segments.
  let i = 0;
  let safety = 0;
  while (i < s.length && safety++ < 50) {
    // Skip any stray separators.
    if (s[i] === GS) {
      i += 1;
      continue;
    }
    const ai = s.slice(i, i + 2);
    if (!/^\d{2}$/.test(ai)) break; // not an AI we can read; stop
    i += 2;

    let value;
    if (FIXED_AI[ai] != null) {
      value = s.slice(i, i + FIXED_AI[ai]);
      i += FIXED_AI[ai];
    } else {
      // Variable length: read until separator or end.
      const gsIdx = s.indexOf(GS, i);
      const end = gsIdx === -1 ? s.length : gsIdx;
      value = s.slice(i, end);
      i = end;
    }

    switch (ai) {
      case '01':
        result.gtin = value;
        result.isUdi = true;
        break;
      case '17':
        result.expiration = gs1Date(value);
        result.isUdi = true;
        break;
      case '10':
        result.lot = value;
        result.isUdi = true;
        break;
      case '21':
        result.serial = value;
        break;
      case '11':
        result.productionDate = gs1Date(value);
        break;
      default:
        break; // ignore other AIs
    }
  }

  return result;
}

/** Does a scanned string look like a barcode we can use? */
export function looksLikeScan(input) {
  if (!input) return false;
  const s = stripSymbology(String(input).trim());
  return /^\d{8}$|^\d{12,14}$/.test(s) || /^01\d{14}/.test(s) || s.includes(GS);
}
