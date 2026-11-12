import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { navigate, currentHash } from '../hooks/useHashRoute.js';
import { IconUser } from './Icons.jsx';

export default function TopBar({ subtitle, profileHref }) {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  return (
    <header className="topbar">
      <a className="brand" href="#/">
        <img src="/favicon.svg" alt="" />
        <span style={{ display: 'grid', minWidth: 0 }}>
          <span className="brand__title">CALLIT</span>
          <span className="brand__sub">{subtitle || t('app.tagline')}</span>
        </span>
      </a>
      <div className="topbar__actions">
        <LanguageSwitcher />
        {isLoggedIn ? (
          <button type="button" className="icon-btn" onClick={() => navigate(profileHref || '/')} aria-label={t('nav.me')}>
            <IconUser width={20} height={20} />
            <span className="small ellipsis" style={{ maxWidth: 90, marginLeft: 4 }}>{user?.nickname}</span>
          </button>
        ) : (
          <button type="button" className="btn btn--small" onClick={() => navigate(`/login?next=${encodeURIComponent(currentHash())}`)}>
            {t('auth.login')}
          </button>
        )}
      </div>
    </header>
  );
}
