import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AUTH_EXPIRED_EVENT, checkSession, getSessionToken, login } from '../../utils/api.js';
import { formatApiError } from '../../utils/apiError.js';

export default function AuthGate({ children }) {
  const { t } = useTranslation();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!getSessionToken()) {
      setChecking(false);
      return;
    }
    checkSession()
      .then(() => setAuthorized(true))
      .catch(() => setAuthorized(false))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const handleExpired = () => setAuthorized(false);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const formData = new FormData(event.currentTarget);
    const username = (formData.get('username') || '').trim();
    const password = formData.get('password') || '';

    setSubmitting(true);
    try {
      await login(username, password);
      setAuthorized(true);
    } catch (err) {
      setError(formatApiError(err, t, 'auth.invalidCredentials'));
    } finally {
      setSubmitting(false);
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
            <button type="submit" disabled={submitting}>{t('auth.submit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
