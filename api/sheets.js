// Vercel serverless function: Google Sheets append/read.
//
// POST /api/sheets
//   { action: 'append', rows: [...], sheetId?, sheetTab?, serviceAccountJson? }
//   { action: 'read',   sheetId?, sheetTab? }
//   { action: 'test',   sheetId?, sheetTab? }
//
// Credentials resolution order: request body → environment variables.
// The service account must be granted Editor access to the target sheet.
import { google } from 'googleapis';
import { readJsonBody, sendJson, requirePost } from './_lib.js';

const HEADER = [
  'Timestamp',
  'Product Name',
  'Expiration Date',
  'Lot Number',
  'Quantity',
  'Unit Type',
  'Days Until Expiration',
  'Status',
  'Location',
];

function resolveCreds(body) {
  const rawJson = body.serviceAccountJson || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = (body.sheetId || process.env.GOOGLE_SHEET_ID || '').trim();
  const sheetTab = (body.sheetTab || process.env.GOOGLE_SHEET_TAB || 'Inventory').trim();
  return { rawJson, sheetId, sheetTab };
}

/** Accept the service account as raw JSON or base64-encoded JSON. */
function parseServiceAccount(rawJson) {
  if (!rawJson) return null;
  let text = String(rawJson).trim();
  if (!text.startsWith('{')) {
    try {
      text = Buffer.from(text, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }
  try {
    const creds = JSON.parse(text);
    // Private keys often arrive with escaped newlines.
    if (creds.private_key) {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    return creds;
  } catch {
    return null;
  }
}

async function getSheetsClient(creds) {
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

/** Ensure the tab exists, has a header row, and Status conditional formatting. */
async function ensureTab(sheets, spreadsheetId, tabTitle) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  let sheet = meta.data.sheets.find((s) => s.properties.title === tabTitle);

  if (!sheet) {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tabTitle } } }] },
    });
    sheet = { properties: addRes.data.replies[0].addSheet.properties };
  }
  const sheetId = sheet.properties.sheetId;

  // Ensure header row.
  const first = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabTitle}!A1:I1`,
  });
  if (!first.data.values || !first.data.values.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabTitle}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] },
    });
    await applyFormatting(sheets, spreadsheetId, sheetId);
  }
  return sheetId;
}

/** Bold header + color rules on the Status column (H). */
async function applyFormatting(sheets, spreadsheetId, sheetId) {
  const statusCol = 7; // zero-based index of "Status"
  const rng = {
    sheetId,
    startRowIndex: 1,
    startColumnIndex: statusCol,
    endColumnIndex: statusCol + 1,
  };
  const rule = (text, r, g, b) => ({
    addConditionalFormatRule: {
      rule: {
        ranges: [rng],
        booleanRule: {
          condition: { type: 'TEXT_CONTAINS', values: [{ userEnteredValue: text }] },
          format: { backgroundColor: { red: r, green: g, blue: b } },
        },
      },
      index: 0,
    },
  });
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
              cell: { userEnteredFormat: { textFormat: { bold: true } } },
              fields: 'userEnteredFormat.textFormat.bold',
            },
          },
          // RED for expired / soon, YELLOW for watch, GREEN for ok.
          rule('EXPIRED', 0.96, 0.8, 0.8),
          rule('Expires Soon', 0.98, 0.85, 0.85),
          rule('Watch', 0.99, 0.95, 0.78),
          rule('OK', 0.82, 0.94, 0.83),
        ],
      },
    });
  } catch {
    // Formatting is best-effort; data integrity matters more.
  }
}

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid request body.' });
  }

  const { rawJson, sheetId, sheetTab } = resolveCreds(body);

  if (!rawJson) {
    return sendJson(res, 400, {
      error:
        'Google Sheets is not configured. Add service account credentials in Settings or set GOOGLE_SERVICE_ACCOUNT_JSON.',
    });
  }
  if (!sheetId) {
    return sendJson(res, 400, { error: 'No Google Sheet selected. Add the sheet URL in Settings.' });
  }

  const creds = parseServiceAccount(rawJson);
  if (!creds || !creds.client_email || !creds.private_key) {
    return sendJson(res, 400, { error: 'Service account credentials are invalid or malformed.' });
  }

  let sheets;
  try {
    sheets = await getSheetsClient(creds);
  } catch (err) {
    return sendJson(res, 401, {
      error: cleanError(err, 'Could not authenticate the service account.'),
    });
  }

  const action = body.action || 'append';

  try {
    if (action === 'test') {
      await ensureTab(sheets, sheetId, sheetTab);
      return sendJson(res, 200, {
        ok: true,
        sheetId,
        sheetTab,
        serviceAccount: creds.client_email,
      });
    }

    if (action === 'read') {
      await ensureTab(sheets, sheetId, sheetTab);
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetTab}!A2:I`,
      });
      return sendJson(res, 200, { rows: resp.data.values || [] });
    }

    if (action === 'append') {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return sendJson(res, 400, { error: 'No rows to append.' });
      await ensureTab(sheets, sheetId, sheetTab);
      const values = rows.map(normalizeRow);
      const resp = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetTab}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });
      return sendJson(res, 200, {
        ok: true,
        appended: values.length,
        updatedRange: resp.data.updates?.updatedRange,
      });
    }

    return sendJson(res, 400, { error: `Unknown action: ${action}` });
  } catch (err) {
    return sendJson(res, statusFromError(err), {
      error: cleanError(err, 'Google Sheets operation failed.'),
    });
  }
}

/** Coerce an entry object (or array) into the 9-column row order. */
function normalizeRow(row) {
  if (Array.isArray(row)) return row;
  return [
    row.timestamp ?? '',
    row.product ?? '',
    row.expiration ?? '',
    row.lot ?? '',
    row.quantity ?? '',
    row.unit ?? '',
    row.daysUntil ?? '',
    row.status ?? '',
    row.location ?? '',
  ];
}

function statusFromError(err) {
  const s = err?.code || err?.status || err?.response?.status;
  if (typeof s === 'number' && s >= 400 && s < 600) return s;
  return 502;
}

function cleanError(err, fallback) {
  const code = err?.code || err?.response?.status;
  const msg = err?.errors?.[0]?.message || err?.response?.data?.error?.message || err?.message;
  if (code === 403) {
    return 'Permission denied. Share the sheet with the service account email (Editor access).';
  }
  if (code === 404) return 'Spreadsheet not found. Check the Sheet URL/ID.';
  return msg || fallback;
}
