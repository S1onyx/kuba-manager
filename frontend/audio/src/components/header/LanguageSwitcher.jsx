import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../../i18n/index.js';

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
    <div ref={rootRef} className="language-switcher" style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('languageSwitcher.label')}
        title={t('languageSwitcher.label')}
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
        <div className="language-switcher__menu" role="listbox" aria-label={t('languageSwitcher.label')}>
          {SUPPORTED_LANGUAGES.map((language) => {
            const isActive = language === activeLanguage;
            return (
              <button
                key={language}
                type="button"
                className={`language-switcher__item${isActive ? ' language-switcher__item--active' : ''}`}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  i18n.changeLanguage(language);
                  setOpen(false);
                }}
              >
                <span>{t(`languages.${language}`)}</span>
                <span className="language-switcher__code">{language.toUpperCase()}</span>
              </button>
            );
          })}
          <p className="language-switcher__notice">{t('languageSwitcher.aiNotice')}</p>
        </div>
      ) : null}
    </div>
  );
}
