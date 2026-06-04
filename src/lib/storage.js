// localStorage-backed persistence for settings and the inventory cache.
// The cache is both a fast dashboard source AND an offline fallback queue:
// entries that fail to reach Google Sheets are kept with synced=false and
// retried later.

const SETTINGS_KEY = 'hiet.settings.v1';
const INVENTORY_KEY = 'hiet.inventory.v1';
const MAX_CACHE = 50;

export const DEFAULT_SETTINGS = {
  anthropicApiKey: '', // optional client-supplied key (server env var preferred)
  visionModel: '', // optional model override
  sheetUrl: '',
  sheetId: '',
  sheetTab: 'Inventory',
  googleServiceAccountJson: '', // optional client-supplied SA creds
  cameraDeviceId: '',
  alertDays: 30,
  location: '',
  unitTypes: ['each', 'box', 'case', 'set', 'vial'],
  theme: 'light', // 'light' | 'dark'
  highContrast: false,
  fontScale: 1, // 0.9 – 1.4
};

function safeParse(json, fallback) {
  try {
    return json ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSettings() {
  const stored = safeParse(localStorage.getItem(SETTINGS_KEY), {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadInventory() {
  return safeParse(localStorage.getItem(INVENTORY_KEY), []);
}

export function saveInventory(entries) {
  // Keep only the most recent MAX_CACHE entries to bound storage.
  const trimmed = entries.slice(0, MAX_CACHE);
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(trimmed));
  return trimmed;
}

/** Extract the spreadsheet ID from a full Google Sheets URL (or pass-through). */
export function extractSheetId(urlOrId) {
  if (!urlOrId) return '';
  const m = String(urlOrId).match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : String(urlOrId).trim();
}

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
