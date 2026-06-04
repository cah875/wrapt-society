// POST /api/logout → clears the auth cookie.
import { sendJson } from './_lib.js';
import { clearCookieHeader } from './_auth.js';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', clearCookieHeader());
  return sendJson(res, 200, { ok: true });
}
