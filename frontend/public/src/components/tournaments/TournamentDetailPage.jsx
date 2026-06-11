import { useEffect, useState } from 'react';
import { fetchTournamentDetail } from '../../api.js';
import { navigateTo } from '../../hooks/useHashRoute.js';

export default function TournamentDetailPage({ tournamentId }) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchTournamentDetail(tournamentId)
      .then(setTournament)
      .catch(() => setError('Turnier konnte nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, [tournamentId]);

  const formattedDate = tournament?.planned_at
    ? new Date(tournament.planned_at).toLocaleDateString('de-DE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : null;

  const formattedDeadline = tournament?.registration_deadline
    ? new Date(tournament.registration_deadline).toLocaleDateString('de-DE', {
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
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
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
          fontSize: '0.875rem'
        }}
      >
        ← Zurück
      </button>

      {loading && <p style={{ opacity: 0.7 }}>Lade Turnierdetails...</p>}
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
                  Plakat als PDF öffnen
                </a>
              </object>
            ) : (
              <img
                src={tournament.poster_url}
                alt={`Plakat ${tournament.name}`}
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
              }}>Geplant</span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo(`/anmelden/${tournament.id}`)}
              style={{
                padding: '0.65rem 1.5rem', borderRadius: '999px', border: 'none',
                background: 'rgba(86,160,255,0.8)', color: '#fff', fontSize: '0.95rem',
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              Jetzt anmelden →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {formattedDate && (
              <div style={cardStyle}>
                <p style={sectionTitleStyle}>Datum</p>
                <p style={{ margin: 0 }}>{formattedDate}</p>
              </div>
            )}
            {tournament.location && (
              <div style={cardStyle}>
                <p style={sectionTitleStyle}>Ort</p>
                <p style={{ margin: 0 }}>{tournament.location}</p>
              </div>
            )}
            {formattedDeadline && (
              <div style={cardStyle}>
                <p style={sectionTitleStyle}>Anmeldefrist</p>
                <p style={{ margin: 0 }}>{formattedDeadline}</p>
              </div>
            )}
          </div>

          {tournament.description && (
            <div style={cardStyle}>
              <p style={sectionTitleStyle}>Über das Turnier</p>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tournament.description}</p>
            </div>
          )}

          {tournament.schedule_info && (
            <div style={cardStyle}>
              <p style={sectionTitleStyle}>Ablauf & Zeiten</p>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tournament.schedule_info}</p>
            </div>
          )}

          {tournament.travel_info && (
            <div style={cardStyle}>
              <p style={sectionTitleStyle}>Anreise</p>
              <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{tournament.travel_info}</p>
            </div>
          )}

          {tournament.contact_email && (
            <div style={cardStyle}>
              <p style={sectionTitleStyle}>Kontakt</p>
              <a href={`mailto:${tournament.contact_email}`} style={{ color: '#7cb9ff' }}>
                {tournament.contact_email}
              </a>
            </div>
          )}

          {tournament.registration_url && (
            <div style={cardStyle}>
              <p style={sectionTitleStyle}>Anmeldelink</p>
              <a href={tournament.registration_url} target="_blank" rel="noopener noreferrer" style={{ color: '#7cb9ff' }}>
                {tournament.registration_url}
              </a>
            </div>
          )}

          {Array.isArray(tournament.links) && tournament.links.length > 0 && (
            <div style={cardStyle}>
              <p style={sectionTitleStyle}>Links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tournament.links.map((link, index) => (
                  <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7cb9ff' }}>
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
              style={{ padding: '0.85rem 2.5rem', borderRadius: '999px', border: 'none', background: 'rgba(86,160,255,0.8)', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}
            >
              Team anmelden →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
