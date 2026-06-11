import { useEffect, useRef, useState } from 'react';
import { fetchTournamentDetail } from '../../api.js';
import { navigateTo } from '../../hooks/useHashRoute.js';
import RegistrationForm from './RegistrationForm.jsx';

export default function TournamentDetailPage({ tournamentId }) {
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const formRef = useRef(null);

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
            <img
              src={tournament.poster_url}
              alt={`Plakat ${tournament.name}`}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '16px' }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>{tournament.name}</h1>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '999px',
                background: 'rgba(255,171,64,0.2)', color: '#ffd180', fontSize: '0.8rem', letterSpacing: '0.08em'
              }}>Geplant</span>
            </div>
            {!registered && (
              <button
                type="button"
                onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  padding: '0.65rem 1.5rem', borderRadius: '999px', border: 'none',
                  background: 'rgba(86,160,255,0.8)', color: '#fff', fontSize: '0.95rem',
                  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                Jetzt anmelden →
              </button>
            )}
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

          <div ref={formRef} style={{ ...cardStyle, borderColor: 'rgba(86,160,255,0.2)' }}>
            <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem' }}>
              {registered ? '✓ Anmeldung eingereicht' : 'Team anmelden'}
            </h2>
            {registered ? (
              <p style={{ margin: 0, opacity: 0.8 }}>
                Deine Anmeldung wurde erfolgreich eingereicht. Du erhältst eine Bestätigungs-E-Mail.
              </p>
            ) : (
              <RegistrationForm tournament={tournament} onSuccess={() => setRegistered(true)} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
