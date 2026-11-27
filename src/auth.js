import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { q } from './db.js';

const COOKIE = 'creneau_sid';
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored).split(':');
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, actual);
}

export const newToken = (bytes = 24) => randomBytes(bytes).toString('base64url');

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function currentTeacher(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const s = q.authByToken.get(token, Date.now());
  return s ? q.teacherById.get(s.teacher_id) : null;
}

const secureFlag = () => (process.env.BASE_URL || '').startsWith('https://') ? '; Secure' : '';

export function startSession(res, teacherId) {
  const token = newToken();
  q.insertAuth.run(token, teacherId, Date.now() + THIRTY_DAYS);
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${THIRTY_DAYS / 1000}${secureFlag()}`);
}

export function endSession(req, res) {
  const token = readCookie(req, COOKIE);
  if (token) q.deleteAuth.run(token);
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag()}`);
}
