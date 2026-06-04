// Thin client for the Vercel serverless endpoints (/api/*).
// Every call optionally forwards the user's in-app credentials so the app
// works both with server-side env vars (preferred) and with keys pasted into
// the Settings page.
import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

function unwrapError(err, fallback) {
  const data = err?.response?.data;
  if (data?.error) return new Error(data.error);
  if (err?.code === 'ECONNABORTED') return new Error('Request timed out. Please try again.');
  if (!err?.response) return new Error('Network error — you may be offline.');
  return new Error(fallback || 'Request failed.');
}

/**
 * Send a captured image to Claude Vision for extraction.
 * @param {string} imageBase64 - data URL or raw base64 of a JPEG/PNG.
 * @param {object} settings - app settings (for optional client key).
 * @returns {Promise<{product, expiration_date, lot_number, confidence, blurry, notes}>}
 */
export async function extractFromImage(imageBase64, settings = {}) {
  try {
    const { data } = await client.post('/vision', {
      image: imageBase64,
      apiKey: settings.anthropicApiKey || undefined,
      model: settings.visionModel || undefined,
    });
    return data;
  } catch (err) {
    throw unwrapError(err, 'Vision extraction failed.');
  }
}

/** Verify the Claude Vision credentials/connectivity. */
export async function testVision(settings = {}) {
  try {
    const { data } = await client.post('/vision', {
      test: true,
      apiKey: settings.anthropicApiKey || undefined,
      model: settings.visionModel || undefined,
    });
    return data;
  } catch (err) {
    throw unwrapError(err, 'Vision test failed.');
  }
}

function sheetAuth(settings) {
  return {
    sheetId: settings.sheetId || undefined,
    sheetTab: settings.sheetTab || undefined,
    serviceAccountJson: settings.googleServiceAccountJson || undefined,
  };
}

/** Append one or more inventory rows to the configured Google Sheet. */
export async function appendRows(rows, settings = {}) {
  try {
    const { data } = await client.post('/sheets', {
      action: 'append',
      rows,
      ...sheetAuth(settings),
    });
    return data;
  } catch (err) {
    throw unwrapError(err, 'Could not write to Google Sheet.');
  }
}

/** Read recent rows back from the sheet (used to refresh the dashboard). */
export async function readRows(settings = {}) {
  try {
    const { data } = await client.post('/sheets', {
      action: 'read',
      ...sheetAuth(settings),
    });
    return data;
  } catch (err) {
    throw unwrapError(err, 'Could not read Google Sheet.');
  }
}

/** Verify the Google Sheets credentials/connectivity. */
export async function testSheets(settings = {}) {
  try {
    const { data } = await client.post('/sheets', {
      action: 'test',
      ...sheetAuth(settings),
    });
    return data;
  } catch (err) {
    throw unwrapError(err, 'Sheets test failed.');
  }
}
