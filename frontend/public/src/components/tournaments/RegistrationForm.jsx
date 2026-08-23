import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { submitRegistration } from '../../api.js';
import { SUPPORTED_LANGUAGES, resolveLanguage } from '../../i18n/index.js';

const responsiveStyles = `
  @media (max-width: 768px) {
    .registration-form__contact-grid {
      grid-template-columns: 1fr;
    }
    .registration-form__submit {
      width: 100%;
      justify-self: stretch;
    }
  }

  @media (max-width: 480px) {
    .registration-form__player-row {
      grid-template-columns: 1fr 64px;
    }
  }
`;

function emptyPlayer() {
  return { name: '', jerseyNumber: '' };
}

export default function RegistrationForm({ tournament, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [teamName, setTeamName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [players, setPlayers] = useState([emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer()]);
  const [audioFile, setAudioFile] = useState(null);
  const [language, setLanguage] = useState(() => resolveLanguage(i18n.resolvedLanguage ?? i18n.language));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLanguage(resolveLanguage(i18n.resolvedLanguage ?? i18n.language));
  }, [i18n, i18n.language, i18n.resolvedLanguage]);

  const updatePlayer = (i, field, value) => {
    setPlayers((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validPlayers = players.filter((p) => p.name.trim());
    if (validPlayers.length < 4) {
      setError(t('registration.minPlayers'));
      return;
    }

    const fd = new FormData();
    fd.append('team_name', teamName.trim());
    fd.append('contact_name', contactName.trim());
    fd.append('contact_email', contactEmail.trim());
    fd.append('players', JSON.stringify(validPlayers));
    fd.append('language', language);
    if (audioFile) fd.append('audio', audioFile);

    setSubmitting(true);
    try {
      await submitRegistration(tournament.id, fd);
      onSuccess?.();
    } catch (err) {
      const codeKey = err?.code ? `error.${err.code}` : null;
      const translated = codeKey && i18n.exists(codeKey) ? t(codeKey) : null;
      setError(translated || err.message || t('error.registrationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: '1rem',
    minHeight: '44px',
    boxSizing: 'border-box'
  };

  const labelStyle = { display: 'grid', gap: '0.3rem', fontSize: '0.875rem', opacity: 0.85 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
      <style>{responsiveStyles}</style>
      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>{t('registration.teamData')}</h3>
        <label style={labelStyle}>
          {t('registration.teamName')}
          <input style={inputStyle} value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder={t('registration.teamNamePlaceholder')} />
        </label>
        <div className="registration-form__contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label style={labelStyle}>
            {t('registration.contactName')}
            <input style={inputStyle} value={contactName} onChange={(e) => setContactName(e.target.value)} required placeholder={t('registration.contactNamePlaceholder')} />
          </label>
          <label style={labelStyle}>
            {t('registration.email')}
            <input style={inputStyle} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required placeholder={t('registration.emailPlaceholder')} />
          </label>
          <label style={labelStyle}>
            {t('registration.language')}
            <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)}>
              {SUPPORTED_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {t(`languages.${code}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>{t('registration.playersHeading')}</h3>
        {players.map((p, i) => (
          <div key={i} className="registration-form__player-row" style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.5rem', alignItems: 'end' }}>
            <label style={labelStyle}>
              {i < 4
                ? t('registration.playerRequired', { number: i + 1 })
                : t('registration.playerOptional', { number: i + 1 })}
              <input
                style={inputStyle}
                value={p.name}
                onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                required={i < 4}
                placeholder={t('registration.playerNamePlaceholder')}
              />
            </label>
            <label style={{ ...labelStyle }}>
              {t('registration.jerseyNumber')}
              <input
                style={{ ...inputStyle }}
                type="number"
                min="0"
                max="99"
                value={p.jerseyNumber}
                onChange={(e) => updatePlayer(i, 'jerseyNumber', e.target.value)}
                placeholder="#"
              />
            </label>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>{t('registration.anthem')}</h3>
        <label style={labelStyle}>
          {t('registration.anthemUpload')}
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            onChange={(e) => setAudioFile(e.target.files[0] ?? null)}
            style={{ ...inputStyle, padding: '0.4rem' }}
          />
        </label>
        {audioFile && (
          <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>{t('registration.anthemSelected', { name: audioFile.name })}</p>
        )}
      </section>

      {error && (
        <p style={{ margin: 0, color: '#ffb0b0', fontSize: '0.9rem' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="registration-form__submit"
        style={{
          padding: '0.75rem 2rem',
          borderRadius: '999px',
          border: 'none',
          background: submitting ? 'rgba(86,160,255,0.3)' : 'rgba(86,160,255,0.8)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          justifySelf: 'start',
          minHeight: '48px'
        }}
      >
        {submitting ? t('registration.submitting') : t('registration.submit')}
      </button>
    </form>
  );
}
