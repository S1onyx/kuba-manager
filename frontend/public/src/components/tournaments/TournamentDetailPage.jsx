import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTournamentDetail } from '../../api.js';
import { useDateLocale } from '../../i18n/index.js';
import { navigateTo } from '../../hooks/useHashRoute.js';

const responsiveStyles = `
  @media (max-width: 768px) {
    .tournament-detail__card {
      padding: 1.1rem 1rem;
      border-radius: 12px;
    }
    .tournament-detail__info-grid {
      grid-template-columns: 1fr;
    }
    .tournament-detail__cta {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default function TournamentDetailPage({ tournamentId }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchTournamentDetail(tournamentId)
      .then(setTournament)
      .catch(() => setError(t('error.loadTournamentDetail')))
      .finally(() => setLoading(false));
  }, [tournamentId, t]);

  const formattedDate = tournament?.planned_at
    ? new Date(tournament.planned_at).toLocaleDateString(dateLocale, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : null;

  const formattedDeadline = tournament?.registration_deadline
    ? new Date(tournament.registration_deadline).toLocaleDateString(dateLocale, {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : null;

  const cardStyle = {
    background: 'rgba(0,0,0,0.35)',
    borderRadius: '16px',
    padding: '1.5rem',
    border: '1px solid rgba(255,255,255,0.08)'
  };

  const sectionTitleStyle = {
    margin: '0 0 0.75rem 0',
    fontSize: '1rem',
    letterSpacing: '0.06em',
    opacity: 0.7,
    textTransform: 'uppercase',
    fontWeight: 600
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem', width: '100%' }}>
      <style>{responsiveStyles}</style>
      <button
        type="button"
        onClick={() => navigateTo('/')}
        style={{
          alignSelf: 'start',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.75)',
          borderRadius: '999px',
          padding: '0.4rem 1rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          minHeight: '44px',
          display: 'inline-flex',
          alignItems: 'center'
        }}
      >
        {t('tournamentDetail.back')}
      </button>

      {loading && <p style={{ opacity: 0.7 }}>{t('tournamentDetail.loading')}</p>}
      {error && <p style={{ color: '#ffb0b0' }}>{error}</p>}

      {tournament && (
        <>
          {tournament.poster_url && (
            tournament.poster_mime_type === 'application/pdf' ? (
              <object
                data={tournament.poster_url}
                type="application/pdf"
                style={{ width: '100%', aspectRatio: '1 / 1.414', borderRadius: '16px', background: 'rgba(0,0,0,0.15)', display: 'block' }}
              >
                <a
                  href={tournament.poster_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', padding: '1.5rem', textAlign: 'center', color: '#7cb9ff' }}
                >
                  {t('tournamentDetail.openPosterPdf')}
                </a>
              </object>
            ) : (
              <img
                src={tournament.poster_url}
                alt={t('tournaments.posterAlt', { name: tournament.name })}
                style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '16px', background: 'rgba(0,0,0,0.15)' }}
              />
            )
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>{tournament.name}</h1>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '999px',
                background: 'rgba(255,171,64,0.2)', color: '#ffd180', fontSize: '0.8rem', letterSpacing: '0.08em'
              }}>{t('tournaments.plannedBadge')}</span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo(`/anmelden/${tournament.id}`)}
              className="tournament-detail__cta"
              style={{
                padding: '0.65rem 1.5rem', borderRadius: '999px', border: 'none',
                background: 'rgba(86,160,255,0.8)', color: '#fff', fontSize: '0.95rem',
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                minHeight: '44px', display: 'inline-flex', alignItems: 'center'
              }}
            >
              {t('tournamentDetail.registerNow')}
            </button>
          </div>

          <div className="tournament-detail__info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {formattedDate && (
              <div className="tournament-detail__card" style={cardStyle}>
                <p style={sectionTitleStyle}>{t('tournamentDetail.date')}</p>
                <p style={{ margin: 0 }}>{formattedDate}</p>
              </div>
            )}
            {tournament.location && (
              <div className="tournament-detail__card" style={cardStyle}>
                <p style={sectionTitleStyle}>{t('tournamentDetail.location')}</p>
                <p style={{ margin: 0 }}>{tournament.location}</p>
              </div>
            )}
            {formattedDeadline && (
              <div className="tournament-detail__card" style={cardStyle}>
                <p style={sectionTitleStyle}>{t('tournamentDetail.deadline')}</p>
                <p style={{ margin: 0 }}>{formattedDeadline}</p>
              </div>
            )}
          </div>

          {tournament.description && (
            <div className="tournament-detail__card" style={cardStyle}>
              <p style={sectionTitleStyle}>{t('tournamentDetail.about')}</p>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tournament.description}</p>
            </div>
          )}

          {tournament.schedule_info && (
            <div className="tournament-detail__card" style={cardStyle}>
              <p style={sectionTitleStyle}>{t('tournamentDetail.scheduleInfo')}</p>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tournament.schedule_info}</p>
            </div>
          )}

          {tournament.travel_info && (
            <div className="tournament-detail__card" style={cardStyle}>
              <p style={sectionTitleStyle}>{t('tournamentDetail.travel')}</p>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tournament.travel_info}</p>
            </div>
          )}

          {tournament.contact_email && (
            <div className="tournament-detail__card" style={cardStyle}>
              <p style={sectionTitleStyle}>{t('tournamentDetail.contact')}</p>
              <a href={`mailto:${tournament.contact_email}`} style={{ color: '#7cb9ff', overflowWrap: 'anywhere' }}>
                {tournament.contact_email}
              </a>
            </div>
          )}

          {tournament.registration_url && (
            <div className="tournament-detail__card" style={cardStyle}>
              <p style={sectionTitleStyle}>{t('tournamentDetail.registrationLink')}</p>
              <a href={tournament.registration_url} target="_blank" rel="noopener noreferrer" style={{ color: '#7cb9ff', overflowWrap: 'anywhere' }}>
                {tournament.registration_url}
              </a>
            </div>
          )}

          {Array.isArray(tournament.links) && tournament.links.length > 0 && (
            <div className="tournament-detail__card" style={cardStyle}>
              <p style={sectionTitleStyle}>{t('tournamentDetail.links')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tournament.links.map((link, index) => (
                  <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7cb9ff', overflowWrap: 'anywhere' }}>
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => navigateTo(`/anmelden/${tournament.id}`)}
              className="tournament-detail__cta"
              style={{ padding: '0.85rem 2.5rem', borderRadius: '999px', border: 'none', background: 'rgba(86,160,255,0.8)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', minHeight: '48px', display: 'inline-flex', alignItems: 'center' }}
            >
              {t('tournamentDetail.registerTeam')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
