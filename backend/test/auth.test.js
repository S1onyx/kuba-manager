import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import {
  getAuthConfig,
  verifyCredentials,
  createSession,
  isValidSession,
  destroySession,
  isLoginBlocked,
  registerFailedLogin,
  requireAdminExcept
} from '../src/auth/index.js';

const hash = bcrypt.hashSync('FAKE-PASSWORD-FOR-TESTING', 4);

test('Hash wird roh oder base64-kodiert akzeptiert', () => {
  const env = { NODE_ENV: 'production', ADMIN_USERNAME: 'chef' };
  assert.equal(getAuthConfig({ ...env, ADMIN_PASSWORD_HASH: hash }).passwordHash, hash);
  assert.equal(getAuthConfig({ ...env, ADMIN_PASSWORD_HASH: Buffer.from(hash).toString('base64') }).passwordHash, hash);
});

test('Login prüft Benutzername und Passwort gegen den Hash', async () => {
  const config = getAuthConfig({ NODE_ENV: 'production', ADMIN_USERNAME: 'chef', ADMIN_PASSWORD_HASH: hash });
  assert.equal(await verifyCredentials('chef', 'FAKE-PASSWORD-FOR-TESTING', config), true);
  assert.equal(await verifyCredentials('chef', 'falsch', config), false);
  assert.equal(await verifyCredentials('admin', 'FAKE-PASSWORD-FOR-TESTING', config), false);
});

test('Produktion ohne Hash: Login gesperrt, auch mit Standardpasswort', async () => {
  const config = getAuthConfig({ NODE_ENV: 'production' });
  assert.equal(await verifyCredentials('admin', 'kuba-manager', config), false);
});

test('Session läuft nach 24h ab und ist nach Logout ungültig', () => {
  const now = Date.now();
  const { token } = createSession(now);
  assert.equal(isValidSession(token, now + 1000), true);
  assert.equal(isValidSession(token, now + 25 * 60 * 60 * 1000), false);
  const second = createSession(now).token;
  destroySession(second);
  assert.equal(isValidSession(second, now), false);
  assert.equal(isValidSession('erfunden', now), false);
});

test('Nach 10 Fehlversuchen wird Login 15 Minuten gesperrt', () => {
  const now = Date.now();
  for (let i = 0; i < 10; i += 1) registerFailedLogin('1.2.3.4', now);
  assert.equal(isLoginBlocked('1.2.3.4', now), true);
  assert.equal(isLoginBlocked('1.2.3.4', now + 16 * 60 * 1000), false);
});

test('Beamer-Routen bleiben offen, alles andere braucht Login', () => {
  const guard = requireAdminExcept([['GET', '/standings']]);
  const run = (method, path, authorization) => {
    let status = null;
    let passed = false;
    const res = { status: (code) => { status = code; return { json: () => {} }; } };
    guard({ method, path, headers: { authorization } }, res, () => { passed = true; });
    return passed ? 'next' : status;
  };
  assert.equal(run('GET', '/standings'), 'next');
  assert.equal(run('POST', '/score'), 401);
  assert.equal(run('POST', '/score', `Bearer ${createSession().token}`), 'next');
});
