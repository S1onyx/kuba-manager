import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TopBar from '../components/TopBar.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { navigate } from '../hooks/useHashRoute.js';
import { errorMessage } from '../utils/errors.js';

export default function LoginPage({ next }) {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('register');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const target = next && next.startsWith('/') && !next.startsWith('/login') ? next : '/';

  const submit = async (event) => {
    event.preventDefault();
    if (mode === 'register' && password !== password2) {
      setError({ message: t('auth.passwordMismatch'), local: true });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register(nickname, password);
      else await login(nickname, password);
      navigate(target);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar />
      <h1 className="page-title">{mode === 'register' ? t('auth.registerTitle') : t('auth.loginTitle')}</h1>
      <div className="tabs" role="tablist" style={{ marginBottom: 14 }}>
        {['register', 'login'].map((entry) => (
          <button
            key={entry}
            type="button"
            role="tab"
            aria-selected={mode === entry}
            onClick={() => {
              setMode(entry);
              setError(null);
            }}
          >
            {entry === 'register' ? t('auth.register') : t('auth.login')}
          </button>
        ))}
      </div>
      <form className="card stack" onSubmit={submit}>
        <div className="field">
          <label htmlFor="nickname">{t('auth.nickname')}</label>
          <input
            id="nickname"
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
          {mode === 'register' ? <span className="dim small">{t('auth.nicknameHint')}</span> : null}
        </div>
        <div className="field">
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={mode === 'register' ? 8 : undefined}
            maxLength={200}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        {mode === 'register' ? (
          <div className="field">
            <label htmlFor="password2">{t('auth.passwordRepeat')}</label>
            <input
              id="password2"
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={200}
              required
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
            />
            <span className="dim small">{t('auth.passwordHint')}</span>
          </div>
        ) : null}
        {error ? <div className="banner banner--error small">{error.local ? error.message : errorMessage(t, error)}</div> : null}
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? t('common.loading') : mode === 'register' ? t('auth.registerSubmit') : t('auth.loginSubmit')}
        </button>
        <span className="dim small">{mode === 'register' ? t('auth.privacyHint') : t('auth.forgotHint')}</span>
      </form>
    </>
  );
}
