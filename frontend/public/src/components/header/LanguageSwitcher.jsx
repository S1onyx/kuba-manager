import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../../i18n/index.js';

const triggerStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  minHeight: '44px',
  padding: '0.3rem 0.8rem',
  borderRadius: '999px',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'transparent',
  color: 'rgba(245,249,255,0.75)',
  fontSize: '0.8rem',
  letterSpacing: '0.08em',
  cursor: 'pointer'
};

const menuStyle = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  right: 0,
  minWidth: '170px',
  padding: '0.3rem',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(8, 18, 32, 0.97)',
  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(8px)',
  zIndex: 60
};

const itemStyle = {
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
  color: 'rgba(245,249,255,0.85)',
  fontSize: '0.85rem',
  textAlign: 'left',
  cursor: 'pointer'
};

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const activeLanguage = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
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
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('languageSwitcher.label')}
        title={t('languageSwitcher.label')}
        style={triggerStyle}
      >
        <GlobeIcon />
        <span>{activeLanguage.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
          <path d="M1.5 2.5L8 8l6.5-5.5" />
        </svg>
      </button>

      {open ? (
        <div role="listbox" aria-label={t('languageSwitcher.label')} style={menuStyle}>
          {SUPPORTED_LANGUAGES.map((language) => {
            const isActive = language === activeLanguage;
            return (
              <button
                key={language}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  i18n.changeLanguage(language);
                  setOpen(false);
                }}
                style={{
                  ...itemStyle,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#9cc8ff' : itemStyle.color
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
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.72rem',
              lineHeight: 1.4,
              color: 'rgba(245,249,255,0.5)'
            }}
          >
            {t('languageSwitcher.aiNotice')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
