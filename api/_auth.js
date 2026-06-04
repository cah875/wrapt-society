// Lightweight cookie-based auth shared by the serverless functions.
//
// A successful /api/login sets a signed, HttpOnly cookie. Protected endpoints
// (vision, gudid) call isAuthed() and reject when it's missing/invalid, so the
// API can't be used — or your Claude credits burned — without logging in.
//
// Credentials and the signing secret come from environment variables; the
// defaults let it work out of the box, but set APP_PASSWORD and AUTH_SECRET in
// Vercel for real security (the defaults are visible in source).
import crypto from 'node:crypto';

const COOKIE_NAME = 'nwsh_auth';
const MAX_AGE_DAYS = 30;

export function getCredentials() {
  return {
    username: process.env.APP_USERNAME || 'mmtracker',
    password: process.env.APP_PASSWORD || 'Directorlevelshiz',
  };
}

function secret() {
  return process.env.AUTH_SECRET || `nwsh-${getCredentials().password}-static-secret`;
}

export function makeToken(username) {
  const payload = { u: username, exp: Date.now() + MAX_AGE_DAYS * 86400000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export function cookieHeader(token) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${
    MAX_AGE_DAYS * 86400
  }`;
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/** True when the request carries a valid auth cookie. */
export function isAuthed(req) {
  return Boolean(verifyToken(parseCookies(req)[COOKIE_NAME]));
}
