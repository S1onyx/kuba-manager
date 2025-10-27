import { useEffect, useState } from 'react';
import { ADMIN_AUTH, ADMIN_SESSION_KEY } from '../../config.js';

const toToken = (username, password) => {
  const value = `${username}:${password}`;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(value);
  }
  return value;
};

export default function AuthGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      setChecking(false);
      return;
    }
    const expectedToken = toToken(ADMIN_AUTH.username, ADMIN_AUTH.password);
    const storedToken = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (storedToken && storedToken === expectedToken) {
      setAuthorized(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const username = (formData.get('username') || '').trim();
    const password = formData.get('password') || '';

    if (username === ADMIN_AUTH.username && password === ADMIN_AUTH.password) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_SESSION_KEY, toToken(username, password));
      }
      setAuthorized(true);
    } else {
      setError('Nutzername oder Passwort ist ungültig.');
    }
  };

  if (checking) {
    return null;
  }

  if (authorized) {
    return children;
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <h1 className="auth-card__title">Admin Login</h1>
        <p className="auth-card__subtitle">
          Bitte Zugangsdaten eingeben, um das Steuerpanel zu öffnen.
        </p>
        {error ? <p className="auth-card__error">{error}</p> : null}
        <form onSubmit={handleSubmit} autoComplete="off">
          <label className="auth-card__field">
            <span>Nutzername</span>
            <input
              name="username"
              type="text"
              placeholder="z. B. admin"
              autoComplete="off"
              required
            />
          </label>
          <label className="auth-card__field">
            <span>Passwort</span>
            <input name="password" type="password" placeholder="Passwort" autoComplete="off" required />
          </label>
          <div className="auth-card__actions">
            <button type="submit">Anmelden</button>
          </div>
        </form>
      </div>
    </div>
  );
}
