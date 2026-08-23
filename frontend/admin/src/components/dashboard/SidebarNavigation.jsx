import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTROL_TABS } from '../../constants/dashboard.js';
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../../i18n/index.js';

export default function SidebarNavigation({
  activeTab,
  onSelect,
  scoreboard,
  formattedRemaining,
  liveStateLabel,
  error,
  info
}) {
  const { t, i18n } = useTranslation();
  const navItems = CONTROL_TABS;
  const activeLanguage = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        <div
          style={{
            fontSize: '0.8rem',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            opacity: 0.7
          }}
        >
          Kuba Manager
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.35rem, 5vw, 1.8rem)', letterSpacing: '0.06em' }}>{t('sidebar.title')}</h1>
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          {t('sidebar.subtitle')}
        </p>
      </div>

      {scoreboard ? (
        <div
          style={{
            display: 'grid',
            gap: '0.5rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(76,201,255,0.28)',
            background: 'rgba(18, 34, 52, 0.85)'
          }}
        >
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.65 }}>
            {t('sidebar.live')}
          </span>
          <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
            {scoreboard.teamAName} vs {scoreboard.teamBName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', opacity: 0.8 }}>
            <span>
              {scoreboard.scoreA} : {scoreboard.scoreB}
            </span>
            <span>
              {formattedRemaining} · {liveStateLabel}
            </span>
          </div>
        </div>
      ) : null}

      <nav style={{ display: 'grid', gap: '0.65rem' }}>
        {navItems.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              style={{
                justifyContent: 'flex-start',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.12)',
                background: isActive ? 'rgba(76, 201, 255, 0.16)' : 'rgba(8, 20, 35, 0.6)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                transition: 'background var(--transition-base), border-color var(--transition-base), color var(--transition-base)'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.18)'
                }}
              />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </nav>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <span
          style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.65 }}
        >
          {t('languageSwitcher.label')}
        </span>
        <LanguagePicker activeLanguage={activeLanguage} onSelect={(language) => i18n.changeLanguage(language)} />
      </div>

      {error ? (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,95,95,0.12)',
            border: '1px solid rgba(255,95,95,0.4)',
            color: '#ff9e9e',
            fontSize: '0.9rem'
          }}
        >
          {error}
        </div>
      ) : null}
      {info ? (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(122,229,130,0.12)',
            border: '1px solid rgba(122,229,130,0.4)',
            color: '#9ff0a4',
            fontSize: '0.9rem'
          }}
        >
          {info}
        </div>
      ) : null}
    </div>
  );
}

function LanguagePicker({ activeLanguage, onSelect }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('languageSwitcher.label')}
        title={t('languageSwitcher.label')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          minHeight: '44px',
          padding: '0.3rem 0.8rem',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.14)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          letterSpacing: '0.06em',
          cursor: 'pointer'
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{activeLanguage.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
          <path d="M1.5 2.5L8 8l6.5-5.5" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={t('languageSwitcher.label')}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            minWidth: '170px',
            padding: '0.3rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'rgba(10, 20, 34, 0.97)',
            boxShadow: 'var(--shadow-card)',
            backdropFilter: 'blur(8px)',
            zIndex: 60,
            display: 'grid',
            gap: '0.1rem'
          }}
        >
          {SUPPORTED_LANGUAGES.map((language) => {
            const isActive = language === activeLanguage;
            return (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onSelect(language);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  width: '100%',
                  minHeight: '44px',
                  padding: '0.45rem 0.7rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  boxShadow: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <span>{t(`languages.${language}`)}</span>
                <span style={{ opacity: 0.55, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                  {language.toUpperCase()}
                </span>
              </button>
            );
          })}
          <p
            style={{
              margin: 0,
              padding: '0.5rem 0.7rem 0.3rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.72rem',
              lineHeight: 1.4,
              color: 'var(--text-muted)'
            }}
          >
            {t('languageSwitcher.aiNotice')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
