// Utilidades compartidas de la API: respuestas, validación, contraseñas y sesiones.
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers}
  });

export async function body(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) throw new HttpError(415, 'Se esperaba JSON.');
  try { return await request.json(); } catch { throw new HttpError(400, 'JSON no válido.'); }
}

// Texto obligatorio/opcional con límite de longitud.
export function text(value, label, {max = 120, min = 1, optional = false} = {}) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v && optional) return '';
  if (v.length < min || v.length > max) throw new HttpError(400, `${label}: entre ${min} y ${max} caracteres.`);
  return v;
}
export function email(value) {
  const v = text(value, 'Correo', {max: 120}).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new HttpError(400, 'Correo no válido.');
  return v;
}
export function phone(value) {
  const v = text(value, 'Teléfono', {max: 25});
  if (!/^[+\d][\d\s().-]{6,24}$/.test(v)) throw new HttpError(400, 'Teléfono no válido.');
  return v;
}
export function int(value, label, {min = 0, max = 9999} = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${label}: número entero entre ${min} y ${max}.`);
  return n;
}
export function oneOf(value, list, label) {
  if (!list.includes(value)) throw new HttpError(400, `${label} no válido.`);
  return value;
}

const enc = new TextEncoder();
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => Uint8Array.from(hex.match(/../g).map(h => parseInt(h, 16)));

export const randomHex = (bytes = 16) => toHex(crypto.getRandomValues(new Uint8Array(bytes)));
export const sha256 = async s => toHex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

// PBKDF2-SHA256, 100 000 iteraciones (máximo que admite Workers).
export async function hashPassword(password, saltHex = randomHex(16)) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: 100000}, key, 256);
  return {hash: toHex(bits), salt: saltHex};
}
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 100) throw new HttpError(400, 'La contraseña debe tener entre 8 y 100 caracteres.');
  return password;
}

const COOKIE = 'aw_session';
const WEEK = 60 * 60 * 24 * 7;

export async function createSession(db, userId, request) {
  const token = randomHex(32);
  await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)')
    .bind(await sha256(token), userId, Math.floor(Date.now() / 1000) + WEEK).run();
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${WEEK}${secure}`;
}
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function cookieToken(request) {
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|; )${COOKIE}=([a-f0-9]{64})`));
  return m ? m[1] : null;
}
export async function currentUser(db, request) {
  const token = cookieToken(request);
  if (!token) return null;
  const row = await db.prepare(`SELECT u.id,u.email,u.name,u.role,u.vendor_id,u.must_change FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>?`).bind(await sha256(token), Math.floor(Date.now() / 1000)).first();
  return row || null;
}
export async function destroySession(db, request) {
  const token = cookieToken(request);
  if (token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(token)).run();
}

// Límite simple de intentos: 8 por 15 minutos por clave (correo + IP).
export async function rateLimit(db, key, limit = 8, windowSec = 900) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare('SELECT count,window_start FROM login_attempts WHERE key=?').bind(key).first();
  if (!row || now - row.window_start > windowSec) {
    await db.prepare('INSERT OR REPLACE INTO login_attempts(key,count,window_start) VALUES(?,1,?)').bind(key, now).run();
    return;
  }
  if (row.count >= limit) throw new HttpError(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
  await db.prepare('UPDATE login_attempts SET count=count+1 WHERE key=?').bind(key).run();
}
export const clearLimit = (db, key) => db.prepare('DELETE FROM login_attempts WHERE key=?').bind(key).run();

export function requireRole(user, ...roles) {
  if (!user) throw new HttpError(401, 'Inicia sesión para continuar.');
  if (!roles.includes(user.role)) throw new HttpError(403, 'No tienes permiso para esta acción.');
  return user;
}
