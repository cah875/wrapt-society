// Vercel serverless function: GTIN → product name via the FDA's public GUDID
// (Global Unique Device Identification Database). Free, no key required.
//
// GET /api/gudid?gtin=00844588000036
//   → { name, brandName, company, model, gtin }
//
// Proxied server-side to avoid browser CORS issues and to normalize the result.
import { sendJson } from './_lib.js';
import { isAuthed } from './_auth.js';

const LOOKUP_URL = 'https://accessgudid.nlm.nih.gov/api/v3/devices/lookup.json';

export default async function handler(req, res) {
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Please log in.' });

  const gtin = (req.query?.gtin || '').toString().replace(/\D/g, '');
  if (!gtin) return sendJson(res, 400, { error: 'Missing gtin parameter.' });

  try {
    const resp = await fetch(`${LOOKUP_URL}?di=${encodeURIComponent(gtin)}`, {
      headers: { Accept: 'application/json' },
    });

    if (resp.status === 404) {
      return sendJson(res, 404, { error: 'GTIN not found in GUDID.', gtin });
    }
    if (!resp.ok) {
      return sendJson(res, 502, { error: `GUDID lookup failed (${resp.status}).`, gtin });
    }

    const data = await resp.json();
    const device = data?.gudid?.device || {};
    const brandName = device.brandName || '';
    const model = device.versionModelNumber || '';
    const company = device.companyName || '';

    // Compose a friendly name: "Company BrandName Model".
    const name = [company, brandName, model]
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    return sendJson(res, 200, {
      gtin,
      name: name || brandName || '',
      brandName,
      company,
      model,
    });
  } catch (err) {
    return sendJson(res, 502, { error: err.message || 'GUDID lookup error.', gtin });
  }
}
