import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTournamentDetail } from '../../api.js';
import { navigateTo } from '../../hooks/useHashRoute.js';
import RegistrationForm from './RegistrationForm.jsx';

const responsiveStyles = `
  @media (max-width: 768px) {
    .tournament-register__panel {
      padding: 1.25rem 1.1rem;
      border-radius: 12px;
    }
  }

  @media (max-width: 480px) {
    .tournament-register__panel {
      padding: 1.1rem 0.9rem;
    }
  }
`;

export default function TournamentRegisterPage({ tournamentId }) {
  const { t } = useTranslation();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    fetchTournamentDetail(tournamentId)
      .then(setTournament)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tournamentId]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem', display: 'grid', gap: '1.5rem', width: '100%' }}>
      <style>{responsiveStyles}</style>
      <button
        type="button"
        onClick={() => navigateTo(`/turnier/${tournamentId}`)}
        style={{ alignSelf: 'start', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.875rem', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
      >
        {t('registration.backToTournament')}
      </button>

      {loading && <p style={{ opacity: 0.7 }}>{t('registration.loading')}</p>}

      {tournament?.registration_closed && !registered && (
        <div className="tournament-register__panel" style={{ background: 'rgba(255,100,100,0.08)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,100,100,0.2)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{t('registration.closed')}</p>
        </div>
      )}

      {tournament && !tournament.registration_closed && !registered && (
        <>
          <div>
            <p style={{ margin: '0 0 0.25rem', opacity: 0.55, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('registration.title')}</p>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)' }}>{tournament.name}</h1>
          </div>
          <div className="tournament-register__panel" style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '16px', padding: '1.5rem 1.75rem', border: '1px solid rgba(86,160,255,0.15)' }}>
            <RegistrationForm tournament={tournament} onSuccess={() => setRegistered(true)} />
          </div>
        </>
      )}

      {registered && (
        <div className="tournament-register__panel" style={{ background: 'rgba(64,200,120,0.08)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(64,200,120,0.2)', textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>{t('registration.successTitle')}</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>{t('registration.successText')}</p>
          <button
            type="button"
            onClick={() => navigateTo(`/turnier/${tournamentId}`)}
            style={{ justifySelf: 'center', padding: '0.6rem 1.5rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
          >
            {t('registration.backToTournamentPage')}
          </button>
        </div>
      )}
    </div>
  );
}
