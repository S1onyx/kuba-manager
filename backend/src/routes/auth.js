import express from 'express';
import {
  clearFailedLogins,
  createSession,
  destroySession,
  isLoginBlocked,
  isValidSession,
  readBearerToken,
  registerFailedLogin,
  verifyCredentials
} from '../auth/index.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password || password.length > 200) {
    return res.status(400).json({ code: 'AUTH_INVALID_INPUT', message: 'Benutzername und Passwort erforderlich.' });
  }

  const clientKey = req.ip || 'unknown';
  if (isLoginBlocked(clientKey)) {
    return res.status(429).json({ code: 'AUTH_TOO_MANY_ATTEMPTS', message: 'Zu viele Fehlversuche. Bitte später erneut versuchen.' });
  }

  try {
    if (!(await verifyCredentials(username.trim(), password))) {
      registerFailedLogin(clientKey);
      return res.status(401).json({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Benutzername oder Passwort falsch.' });
    }
    clearFailedLogins(clientKey);
    res.json(createSession());
  } catch (error) {
    console.error('Login fehlgeschlagen:', error);
    res.status(500).json({ code: 'AUTH_LOGIN_FAILED', message: 'Login fehlgeschlagen.' });
  }
});

router.get('/session', (req, res) => {
  if (!isValidSession(readBearerToken(req))) {
    return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Anmeldung erforderlich.' });
  }
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  const token = readBearerToken(req);
  if (token) destroySession(token);
  res.status(204).end();
});

export default router;
