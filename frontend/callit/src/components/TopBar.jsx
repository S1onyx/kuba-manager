import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { navigate, currentHash } from '../hooks/useHashRoute.js';
import { IconHome, IconUser } from './Icons.jsx';

export const MAIN_SITE_URL =
  import.meta.env.VITE_MAIN_SITE_URL && import.meta.env.VITE_MAIN_SITE_URL.trim().length > 0
    ? import.meta.env.VITE_MAIN_SITE_URL.trim()
    : 'https://kunstradbasketball.de';

export function MainSiteLink() {
  const { t } = useTranslation();
  return (
    <a className="link-row small" href={MAIN_SITE_URL} style={{ textDecoration: 'none', color: 'inherit', marginTop: 16 }}>
      <span className="row" style={{ gap: 8 }}>
        <IconHome width={18} height={18} />
        <span>{t('nav.mainSiteLong')}</span>
      </span>
      <span className="muted">→</span>
    </a>
  );
}

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
        <a className="icon-btn" href={MAIN_SITE_URL} aria-label={t('nav.mainSite')} title={t('nav.mainSite')}>
          <IconHome width={20} height={20} />
        </a>
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
