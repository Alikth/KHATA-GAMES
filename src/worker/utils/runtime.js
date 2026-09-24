// Shared runtime, HTTP, security, cookie, crypto, auth-session and validation helpers.

const SESSION_TTL = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;
const MAX_PASSWORD_LENGTH = 128;
const SESSION_COOKIE_NAME = "__Host-khata_session";
const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; script-src 'self'; connect-src 'self'; upgrade-insecure-requests"
};


function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...SECURITY_HEADERS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}
async function body(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) { const e = new Error("Request body too large"); e.status = 413; throw e; }
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) { const e = new Error("JSON required"); e.status = 415; throw e; }
  try { return await request.json(); } catch { const e = new Error("Invalid JSON"); e.status = 400; throw e; }
}
function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  return origin === new URL(request.url).origin;
}
async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64url(new Uint8Array(digest));
}
function base64url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function randomToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}
async function constantTimeSecretEqual(a, b) {
  const [ha, hb] = await Promise.all([sha256Base64Url(String(a)), sha256Base64Url(String(b))]);
  if (ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}
function normalizeUsername(value) { return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, ""); }
function validTelegramUsername(value) { return /^[A-Za-z0-9_]{5,32}$/.test(value); }
function validAccountUsername(value) { return /^[A-Za-z0-9_]{3,24}$/.test(value); }
function cookie(name, value, maxAge = SESSION_TTL / 1000) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(maxAge)}`; }
function clearCookie(name) { return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
function getCookie(request, name) { const raw = request.headers.get("Cookie") || ""; const m = raw.match(new RegExp(`(?:^|; )${name}=([^;]*)`)); return m ? decodeURIComponent(m[1]) : null; }
function newId() { return crypto.randomUUID(); }
async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 12000, hash: "SHA-256" }, key, 256);
  return { salt: btoa(String.fromCharCode(...salt)), hash: btoa(String.fromCharCode(...new Uint8Array(bits))) };
}
function bytes(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
async function verifyPassword(password, salt, storedHash) {
  const made = await hashPassword(password, bytes(salt));
  const a = bytes(made.hash), b = bytes(storedHash); if (a.length !== b.length) return false; let diff = 0; for (let i=0;i<a.length;i++) diff |= a[i]^b[i]; return diff === 0;
}
async function getSession(request, env) {
  const token = getCookie(request, SESSION_COOKIE_NAME); if (!token) return null;
  const sid = await sha256Base64Url(token);
  const row = await env.DB.prepare("SELECT * FROM sessions WHERE id = ? AND expires_at > ?").bind(sid, Date.now()).first();
  return row || null;
}
async function requireUser(request, env) {
  const s = await getSession(request, env);
  if (!s || s.is_admin) return null;
  const user = await env.DB.prepare("SELECT id FROM users WHERE id=?").bind(s.user_id).first();
  return user ? s : null;
}
async function createSession(env, userId, admin = 0) {
  const token = randomToken(), id = await sha256Base64Url(token), expires = Date.now() + SESSION_TTL;
  await env.DB.prepare("INSERT INTO sessions (id,user_id,is_admin,expires_at) VALUES (?,?,?,?)").bind(id,userId,admin,expires).run();
  return token;
}
async function deleteSession(request, env) {
  const token=getCookie(request,SESSION_COOKIE_NAME);
  if(token){ const sid=await sha256Base64Url(token); await env.DB.prepare("DELETE FROM sessions WHERE id=?").bind(sid).run(); }
}
async function cleanupExpiredSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(Date.now()).run();
}
async function rateLimit(request, env, action, limit, windowMs = 15 * 60 * 1000) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = action + ":" + await sha256Base64Url(ip);
  const now = Date.now(), bucket = now - (now % windowMs);
  const row = await env.DB.prepare(`INSERT INTO rate_limits (bucket_key, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(bucket_key) DO UPDATE SET count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END, window_start = excluded.window_start
    RETURNING count`).bind(key, bucket).first();
  return Number(row?.count || 1) <= limit;
}
function publicUser(u) { return u ? { id: u.id, username: u.username } : null; }
async function players(env) { return (await env.DB.prepare("SELECT id, username, region, house, castle, created_at AS createdAt FROM players ORDER BY created_at").all()).results; }


export {
  SESSION_TTL,
  SESSION_COOKIE_NAME,
  MAX_BODY_BYTES,
  MAX_PASSWORD_LENGTH,
  SECURITY_HEADERS,
  json,
  body,
  sameOrigin,
  sha256Base64Url,
  base64url,
  randomToken,
  constantTimeSecretEqual,
  normalizeUsername,
  validTelegramUsername,
  validAccountUsername,
  cookie,
  clearCookie,
  getCookie,
  newId,
  hashPassword,
  bytes,
  verifyPassword,
  getSession,
  requireUser,
  createSession,
  deleteSession,
  cleanupExpiredSessions,
  rateLimit,
  publicUser,
  players
};
