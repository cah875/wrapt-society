// Date helpers for expiration math and parsing.
// All canonical dates are stored as YYYY-MM-DD strings (no timezone surprises).

/** Status thresholds (in days) are configurable; these are sensible defaults. */
export const DEFAULT_ALERT_DAYS = 30;
export const SOON_DAYS = 60;

/**
 * Parse a loosely-formatted date string into YYYY-MM-DD, or null if hopeless.
 * Handles MM/DD/YYYY, M/D/YY, YYYY-MM-DD, "AUG 2026", "2026-08", etc.
 */
export function normalizeDate(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Already ISO (YYYY-MM-DD)
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return iso(m[1], m[2], m[3]);

  // Year-month only (YYYY-MM) → assume end of month (implants often print MM/YYYY)
  m = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) return endOfMonth(+m[1], +m[2]);

  // MM/DD/YYYY or MM-DD-YYYY
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return iso(m[3], m[1], m[2]);

  // MM/DD/YY → assume 20YY
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (m) return iso(`20${m[3]}`, m[1], m[2]);

  // MM/YYYY (common on sterile packaging) → end of month
  m = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) return endOfMonth(+m[2], +m[1]);

  // "AUG 2026", "August 2026", "15 AUG 2026", "AUG 15 2026"
  const months = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  const lower = raw.toLowerCase();
  const monMatch = Object.keys(months).find((mon) => lower.includes(mon));
  if (monMatch) {
    const mon = months[monMatch];
    const year = (lower.match(/\b(20\d{2})\b/) || [])[1];
    const day = (lower.match(/\b(\d{1,2})\b/) || [])[1];
    if (year) {
      return day ? iso(year, mon, day) : endOfMonth(+year, mon);
    }
  }

  // Last resort: let the engine try, but reject invalid.
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return iso(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate()
    );
  }
  return null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function iso(y, m, d) {
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function endOfMonth(year, month) {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${pad(month)}-${pad(last)}`;
}

/** Whole days from today until the given YYYY-MM-DD (negative = already expired). */
export function daysUntil(isoDate, from = new Date()) {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / 86400000);
}

/**
 * Map days-until into a status + display metadata.
 * RED (<alertDays or expired), YELLOW (alertDays–soonDays), GREEN (>soonDays).
 */
export function statusFor(isoDate, alertDays = DEFAULT_ALERT_DAYS, soonDays = SOON_DAYS) {
  const d = daysUntil(isoDate);
  if (d === null) {
    return { code: 'UNKNOWN', label: 'No Date', color: 'gray', days: null };
  }
  if (d < 0) {
    return { code: 'EXPIRED', label: 'EXPIRED', color: 'danger', days: d };
  }
  if (d <= alertDays) {
    return { code: 'EXPIRES_SOON', label: 'Expires Soon', color: 'danger', days: d };
  }
  if (d <= soonDays) {
    return { code: 'WATCH', label: 'Watch', color: 'warn', days: d };
  }
  return { code: 'OK', label: 'OK', color: 'ok', days: d };
}

/** Human-friendly "in 12 days" / "today" / "5 days ago". */
export function relativeDays(days) {
  if (days === null || days === undefined) return '—';
  if (days === 0) return 'today';
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
  return `${Math.abs(days)} day${days === -1 ? '' : 's'} ago`;
}

/** Format a YYYY-MM-DD as MM/DD/YYYY for display. */
export function displayDate(isoDate) {
  if (!isoDate) return '—';
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[2]}/${m[3]}/${m[1]}`;
}
