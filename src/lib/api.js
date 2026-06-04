// Thin client for the Vercel serverless Vision endpoint (/api/vision).
// Inventory persistence happens entirely client-side (local Excel file); the
// only server call is Claude Vision, which keeps the Anthropic key off the
// client when configured via environment variables.
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

// ── Authentication ──────────────────────────────────────────────────────────
/** Returns true if the current session is logged in. */
export async function checkAuth() {
  try {
    await client.get('/me');
    return true;
  } catch {
    return false;
  }
}

/** Log in with username/password; sets the auth cookie on success. */
export async function login(username, password) {
  try {
    await client.post('/login', { username, password });
    return true;
  } catch (err) {
    throw unwrapError(err, 'Login failed.');
  }
}

/** Log out (clears the auth cookie). */
export async function logout() {
  try {
    await client.post('/logout');
  } catch {
    // ignore
  }
}

/**
 * Look up a product name for a GTIN via the FDA GUDID database.
 * @returns {Promise<{gtin, name, brandName, company, model}>}
 * @throws if not found / lookup failed.
 */
export async function lookupGtin(gtin) {
  try {
    const { data } = await client.get('/gudid', { params: { gtin } });
    return data;
  } catch (err) {
    throw unwrapError(err, 'GTIN lookup failed.');
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
