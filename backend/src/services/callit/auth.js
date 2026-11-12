import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { readBearerToken } from '../../auth/index.js';
import { CallitError, queryOne, write } from './db.js';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 10;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
// Halle teilt sich oft eine öffentliche IP (NAT) – Limit daher großzügig.
const MAX_REGISTRATIONS_PER_IP = 100;

const NICKNAME_PATTERN = /^[\p{L}\p{N} _.-]{3,20}$/u;

const failedLogins = new Map();
// Gleiche Antwortzeit auch für unbekannte Nicknames
const DUMMY_HASH = bcrypt.hashSync('callit-timing-dummy', BCRYPT_ROUNDS);
const registrations = new Map();

const MAX_TRACKED_KEYS = 5000;

function hitWindow(map, key, windowMs, now) {
  if (map.size > MAX_TRACKED_KEYS) {
    map.forEach((entry, entryKey) => {
      if (entry.windowStart + windowMs <= now) map.delete(entryKey);
    });
  }
  const entry = map.get(key);
  if (!entry || entry.windowStart + windowMs <= now) {
    map.set(key, { windowStart: now, count: 1 });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function windowCount(map, key, windowMs, now) {
  const entry = map.get(key);
  if (!entry || entry.windowStart + windowMs <= now) return 0;
  return entry.count;
}

export function resetCallitRateLimits() {
  failedLogins.clear();
  registrations.clear();
}

export function normalizeNickname(value) {
  const nickname = String(value ?? '').trim().replace(/\s+/g, ' ');
  return NICKNAME_PATTERN.test(nickname) ? nickname : null;
}

export function validatePassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 200;
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function publicUser(row) {
  return row ? { id: row.id, nickname: row.nickname, createdAt: row.created_at } : null;
}

async function createSession(userId, now = Date.now()) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString();
  await write([
    ["DELETE FROM callit_sessions WHERE expires_at <= ?", [new Date(now).toISOString()]],
    ['INSERT INTO callit_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hashToken(token), userId, expiresAt]],
    ["UPDATE callit_users SET last_login_at = datetime('now') WHERE id = ?", [userId]]
  ]);
  return { token, expiresAt };
}

export async function registerUser({ nickname, password, clientKey = 'unknown' }, now = Date.now()) {
  const normalized = normalizeNickname(nickname);
  if (!normalized) throw new CallitError('CALLIT_INVALID_NICKNAME', 'Nickname: 3–20 Zeichen (Buchstaben, Ziffern, Leerzeichen, _ . -).');
  if (!validatePassword(password)) throw new CallitError('CALLIT_INVALID_PASSWORD', 'Passwort: mindestens 8 Zeichen.');
  if (windowCount(registrations, clientKey, REGISTER_WINDOW_MS, now) >= MAX_REGISTRATIONS_PER_IP) {
    throw new CallitError('CALLIT_TOO_MANY_REGISTRATIONS', 'Zu viele Registrierungen. Bitte später erneut versuchen.', 429);
  }
  if (await queryOne('SELECT id FROM callit_users WHERE nickname = ?', [normalized])) {
    throw new CallitError('CALLIT_NICKNAME_TAKEN', 'Dieser Nickname ist bereits vergeben.', 409);
  }
  hitWindow(registrations, clientKey, REGISTER_WINDOW_MS, now);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const { lastId } = await write(['INSERT INTO callit_users (nickname, password_hash) VALUES (?, ?)', [normalized, passwordHash]]);
  const user = await queryOne('SELECT * FROM callit_users WHERE id = ?', [lastId]);
  return { user: publicUser(user), session: await createSession(user.id, now) };
}

export async function loginUser({ nickname, password, clientKey = 'unknown' }, now = Date.now()) {
  if (typeof nickname !== 'string' || typeof password !== 'string' || !nickname.trim() || !password || password.length > 200) {
    throw new CallitError('CALLIT_INVALID_INPUT', 'Nickname und Passwort erforderlich.');
  }
  const limiterKey = `${clientKey}|${nickname.trim().toLowerCase()}`;
  if (windowCount(failedLogins, limiterKey, LOGIN_WINDOW_MS, now) >= MAX_FAILED_LOGINS) {
    throw new CallitError('CALLIT_TOO_MANY_ATTEMPTS', 'Zu viele Fehlversuche. Bitte später erneut versuchen.', 429);
  }
  const user = await queryOne('SELECT * FROM callit_users WHERE nickname = ?', [nickname.trim().replace(/\s+/g, ' ')]);
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH) && Boolean(user);
  if (!valid) {
    hitWindow(failedLogins, limiterKey, LOGIN_WINDOW_MS, now);
    throw new CallitError('CALLIT_INVALID_CREDENTIALS', 'Nickname oder Passwort falsch.', 401);
  }
  if (user.is_banned) throw new CallitError('CALLIT_USER_BANNED', 'Dieses Konto ist gesperrt.', 403);
  failedLogins.delete(limiterKey);
  return { user: publicUser(user), session: await createSession(user.id, now) };
}

export async function resolveSession(token, now = Date.now()) {
  if (!token) return null;
  const row = await queryOne(
    `SELECT u.* FROM callit_sessions s JOIN callit_users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    [hashToken(token), new Date(now).toISOString()]
  );
  return row && !row.is_banned ? row : null;
}

export async function logoutSession(token) {
  if (token) await write(['DELETE FROM callit_sessions WHERE token_hash = ?', [hashToken(token)]]);
}

export async function deleteUserCascade(userId) {
  const { changes } = await write([
    ['DELETE FROM callit_sessions WHERE user_id = ?', [userId]],
    ['DELETE FROM callit_tips WHERE user_id = ?', [userId]],
    ['DELETE FROM callit_special_tips WHERE user_id = ?', [userId]],
    ['DELETE FROM callit_participants WHERE user_id = ?', [userId]],
    ['DELETE FROM callit_users WHERE id = ?', [userId]]
  ]);
  return changes > 0;
}

export async function renameUser(userId, nickname) {
  const normalized = normalizeNickname(nickname);
  if (!normalized) throw new CallitError('CALLIT_INVALID_NICKNAME', 'Ungültiger Nickname.');
  const taken = await queryOne('SELECT id FROM callit_users WHERE nickname = ? AND id != ?', [normalized, userId]);
  if (taken) throw new CallitError('CALLIT_NICKNAME_TAKEN', 'Dieser Nickname ist bereits vergeben.', 409);
  await write(['UPDATE callit_users SET nickname = ? WHERE id = ?', [normalized, userId]]);
}

export async function setUserBanned(userId, banned) {
  const statements = [['UPDATE callit_users SET is_banned = ? WHERE id = ?', [banned ? 1 : 0, userId]]];
  if (banned) statements.push(['DELETE FROM callit_sessions WHERE user_id = ?', [userId]]);
  await write(statements);
}

export async function resetUserPassword(userId) {
  const temporaryPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  const { changes } = await write([
    ['UPDATE callit_users SET password_hash = ? WHERE id = ?', [passwordHash, userId]],
    ['DELETE FROM callit_sessions WHERE user_id = ?', [userId]]
  ]);
  return changes > 0 ? temporaryPassword : null;
}

export async function changeOwnPassword(userId, currentPassword, nextPassword) {
  const user = await queryOne('SELECT * FROM callit_users WHERE id = ?', [userId]);
  if (!user || typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new CallitError('CALLIT_INVALID_CREDENTIALS', 'Aktuelles Passwort falsch.', 401);
  }
  if (!validatePassword(nextPassword)) throw new CallitError('CALLIT_INVALID_PASSWORD', 'Passwort: mindestens 8 Zeichen.');
  await write(['UPDATE callit_users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(nextPassword, BCRYPT_ROUNDS), userId]]);
}

export async function optionalCallitUser(req, _res, next) {
  try {
    req.callitUser = await resolveSession(readBearerToken(req));
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireCallitUser(req, res, next) {
  try {
    req.callitUser = await resolveSession(readBearerToken(req));
    if (!req.callitUser) {
      return res.status(401).json({ code: 'CALLIT_AUTH_REQUIRED', message: 'Bitte anmelden.' });
    }
    next();
  } catch (error) {
    next(error);
  }
}
