import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../i18n/index.js';
import { IconGlobe } from './Icons.jsx';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const active = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('languageSwitcher.label')}
      >
        <IconGlobe />
        <span className="small" style={{ marginLeft: 4 }}>{active.toUpperCase()}</span>
      </button>
      {open ? (
        <div className="lang-menu" role="listbox" aria-label={t('languageSwitcher.label')}>
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language}
              type="button"
              role="option"
              aria-selected={language === active}
              onClick={() => {
                i18n.changeLanguage(language);
                setOpen(false);
              }}
              style={{ fontWeight: language === active ? 700 : 400 }}
            >
              <span>{t(`languages.${language}`)}</span>
              <span className="dim small">{language.toUpperCase()}</span>
            </button>
          ))}
          <p className="dim small" style={{ margin: 0, padding: '6px 10px' }}>
            {t('languageSwitcher.aiNotice')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
