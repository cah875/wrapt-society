// GET /api/me → 200 { authed:true } when logged in, else 401.
import { sendJson } from './_lib.js';
import { isAuthed } from './_auth.js';

export default function handler(req, res) {
  if (isAuthed(req)) return sendJson(res, 200, { authed: true });
  return sendJson(res, 401, { authed: false });
}
