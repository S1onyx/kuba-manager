import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ADMIN_AUTH, ADMIN_SESSION_KEY } from '../../config.js';

const toToken = (username, password) => {
  const value = `${username}:${password}`;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(value);
  }
  return value;
};

export default function AuthGate({ children }) {
  const { t } = useTranslation();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
      setError(t('auth.invalidCredentials'));
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
        <h1 className="auth-card__title">{t('auth.title')}</h1>
        <p className="auth-card__subtitle">
          {t('auth.subtitle')}
        </p>
        {error ? <p className="auth-card__error">{error}</p> : null}
        <form onSubmit={handleSubmit} autoComplete="off">
          <label className="auth-card__field">
            <span>{t('auth.username')}</span>
            <input
              name="username"
              type="text"
              placeholder={t('auth.usernamePlaceholder')}
              autoComplete="off"
              required
            />
          </label>
          <label className="auth-card__field">
            <span>{t('auth.password')}</span>
            <div className="auth-card__password">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.password')}
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="auth-card__toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t('auth.hidePasswordAria') : t('auth.showPasswordAria')}
              >
                {showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              </button>
            </div>
          </label>
          <div className="auth-card__actions">
            <button type="submit">{t('auth.submit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
