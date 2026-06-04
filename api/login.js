// POST /api/login  { username, password }  → sets auth cookie on success.
import { readJsonBody, sendJson, requirePost } from './_lib.js';
import { getCredentials, makeToken, cookieHeader } from './_auth.js';

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid request.' });
  }

  const username = (body.username || '').toString().trim();
  const password = (body.password || '').toString();
  const creds = getCredentials();

  const ok =
    username.toLowerCase() === creds.username.toLowerCase() && password === creds.password;

  if (!ok) {
    return sendJson(res, 401, { error: 'Incorrect username or password.' });
  }

  res.setHeader('Set-Cookie', cookieHeader(makeToken(creds.username)));
  return sendJson(res, 200, { ok: true });
}
