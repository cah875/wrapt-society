// Vercel serverless function: Claude Vision extraction.
//
// POST /api/vision
//   { image: <dataURL|base64>, apiKey?, model? }   → extract fields
//   { test: true, apiKey?, model? }                → connectivity check
//
// The API key is taken from the request body (user's Settings page) when
// present, otherwise from the ANTHROPIC_API_KEY environment variable.
import Anthropic from '@anthropic-ai/sdk';
import { readJsonBody, sendJson, requirePost } from './_lib.js';
import { isAuthed } from './_auth.js';

const DEFAULT_MODEL = process.env.CLAUDE_VISION_MODEL || 'claude-sonnet-4-6';

const EXTRACTION_PROMPT = `You are reading a photo of medical implant or biologic packaging at a hospital loading dock. Extract these fields exactly as printed:

- product: the product/device name and manufacturer (e.g. "VG2 Cervical T57P, LifeNet Health VertiGRAFT"). Combine brand + model/description if visible.
- expiration_date: the use-by / expiration date in strict YYYY-MM-DD format. If only month and year are printed, use the LAST day of that month. Look for "EXP", "Use By", an hourglass symbol, or the UDI "(17)" value (format YYMMDD → 20YY-MM-DD).
- lot_number: the lot / batch number (labeled LOT, Lot #, Batch, or the UDI "(10)" value). Many tissue/allograft products have NO lot — return null if there isn't one.
- serial_number: the serial / unique unit ID. Often labeled "ID", "SN", "S/N", or the UDI "(21)" value (e.g. "2110913-1072"). Allografts are usually serialized. Return null if none.
- reference_code: the catalog / reference / product code, often labeled "Code", "REF", "Catalog", or "Ref #" (e.g. "VG2C-T57P"). Return null if none.
- gtin: the GTIN / device identifier. Find the human-readable text printed near any barcode or QR code and look for the "(01)" application identifier — the exactly 14 digits immediately after "(01)" are the GTIN (e.g. the text "(01)10884522000147" → GTIN is "10884522000147"). CRITICAL: read only the printed numeric text — do NOT attempt to visually decode barcode or QR code patterns. If the printed text shows "(01)XXXXXXXXXXXXXX", transcribe those 14 digits exactly, character by character. Return null if no "(01)..." text is visible in the image.

Also assess:
- confidence: one of "high", "medium", "low" reflecting how legible the packaging is.
- blurry: true if the image is too blurry/dark to read reliably.
- notes: a short note about anything unreadable or ambiguous (empty string if none).

Respond with ONLY a single JSON object and nothing else:
{"product": string|null, "expiration_date": string|null, "lot_number": string|null, "serial_number": string|null, "reference_code": string|null, "gtin": string|null, "confidence": "high"|"medium"|"low", "blurry": boolean, "notes": string}

Use null for any field you genuinely cannot read. Do not guess or fabricate values, especially the GTIN, serial, and reference code — only report characters you can actually read.`;

/** Split a data URL (or raw base64) into { mediaType, data }. */
function parseImage(image) {
  if (!image || typeof image !== 'string') return null;
  const m = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (m) return { mediaType: m[1], data: m[2] };
  // Assume raw base64 JPEG if no data-URL prefix.
  return { mediaType: 'image/jpeg', data: image };
}

/** Pull the first JSON object out of a model response. */
function parseJsonResponse(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  if (!isAuthed(req)) return sendJson(res, 401, { error: 'Please log in.' });

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid request body.' });
  }

  const apiKey = body.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return sendJson(res, 400, {
      error:
        'No Claude API key configured. Add one in Settings or set ANTHROPIC_API_KEY.',
    });
  }

  const model = body.model || DEFAULT_MODEL;
  const anthropic = new Anthropic({ apiKey });

  // Lightweight connectivity / credential test.
  if (body.test) {
    try {
      await anthropic.messages.create({
        model,
        max_tokens: 8,
        messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
      });
      return sendJson(res, 200, { ok: true, model });
    } catch (err) {
      return sendJson(res, statusFromError(err), {
        error: cleanError(err, 'Claude Vision test failed.'),
      });
    }
  }

  const parsed = parseImage(body.image);
  if (!parsed) {
    return sendJson(res, 400, { error: 'No image provided.' });
  }

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: parsed.mediaType,
                data: parsed.data,
              },
            },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const text = (message.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const result = parseJsonResponse(text);
    if (!result) {
      return sendJson(res, 502, {
        error: 'Could not parse extraction result. Please retake or enter manually.',
        raw: text,
      });
    }

    return sendJson(res, 200, {
      product: result.product ?? null,
      expiration_date: result.expiration_date ?? null,
      lot_number: result.lot_number ?? null,
      serial_number: result.serial_number ?? null,
      reference_code: result.reference_code ?? null,
      gtin: result.gtin ?? null,
      confidence: result.confidence || 'low',
      blurry: Boolean(result.blurry),
      notes: result.notes || '',
      model,
    });
  } catch (err) {
    return sendJson(res, statusFromError(err), {
      error: cleanError(err, 'Vision extraction failed.'),
    });
  }
}

function statusFromError(err) {
  const s = err?.status || err?.statusCode;
  if (s === 401) return 401;
  if (s === 429) return 429;
  if (typeof s === 'number' && s >= 400 && s < 600) return s;
  return 502;
}

function cleanError(err, fallback) {
  const status = err?.status || err?.statusCode;
  if (status === 401) return 'Invalid Claude API key.';
  if (status === 429) return 'Claude rate limit reached. Please wait and retry.';
  return err?.message || fallback;
}
