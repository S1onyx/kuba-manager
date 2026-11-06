import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_LOGINS = 10;
const DEV_FALLBACK_PASSWORD = 'kuba-manager';

const sessions = new Map();
const failedLogins = new Map();

function decodePasswordHash(encoded) {
  const raw = String(encoded ?? '').trim();
  if (!raw) return null;
  if (raw.startsWith('$2')) return raw;
  const decoded = Buffer.from(raw, 'base64').toString('utf8').trim();
  return decoded.startsWith('$2') ? decoded : null;
}

export function getAuthConfig(env = process.env) {
  const username = String(env.ADMIN_USERNAME ?? '').trim() || 'admin';
  const passwordHash = decodePasswordHash(env.ADMIN_PASSWORD_HASH);
  const isProduction = env.NODE_ENV === 'production';
  return {
    username,
    passwordHash,
    devFallback: !passwordHash && !isProduction
  };
}

function safeEqual(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest();
  const right = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(left, right);
}

export async function verifyCredentials(username, password, config = getAuthConfig()) {
  const usernameMatches = safeEqual(username ?? '', config.username);
  if (config.passwordHash) {
    const passwordMatches = await bcrypt.compare(String(password ?? ''), config.passwordHash);
    return usernameMatches && passwordMatches;
  }
  if (config.devFallback) {
    return usernameMatches && safeEqual(password ?? '', DEV_FALLBACK_PASSWORD);
  }
  return false;
}

export function createSession(now = Date.now()) {
  const token = crypto.randomBytes(32).toString('base64url');
  sessions.set(token, now + SESSION_TTL_MS);
  return { token, expiresAt: new Date(now + SESSION_TTL_MS).toISOString() };
}

export function isValidSession(token, now = Date.now()) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= now) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token) {
  sessions.delete(token);
}

export function isLoginBlocked(key, now = Date.now()) {
  const entry = failedLogins.get(key);
  if (!entry || entry.windowStart + LOGIN_WINDOW_MS <= now) {
    failedLogins.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILED_LOGINS;
}

export function registerFailedLogin(key, now = Date.now()) {
  const entry = failedLogins.get(key);
  if (!entry || entry.windowStart + LOGIN_WINDOW_MS <= now) {
    failedLogins.set(key, { windowStart: now, count: 1 });
    return;
  }
  entry.count += 1;
}

export function clearFailedLogins(key) {
  failedLogins.delete(key);
}

export function readBearerToken(req) {
  const header = String(req.headers?.authorization ?? '');
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;
}

export function requireAdmin(req, res, next) {
  if (isValidSession(readBearerToken(req))) {
    return next();
  }
  return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Anmeldung erforderlich.' });
}

export function requireAdminExcept(publicRoutes) {
  return (req, res, next) => {
    const isPublic = publicRoutes.some(([method, path]) => req.method === method && req.path === path);
    return isPublic ? next() : requireAdmin(req, res, next);
  };
}
