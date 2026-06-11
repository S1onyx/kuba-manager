import { useEffect, useState } from 'react';
import { fetchTournamentDetail } from '../../api.js';
import { navigateTo } from '../../hooks/useHashRoute.js';
import RegistrationForm from './RegistrationForm.jsx';

export default function TournamentRegisterPage({ tournamentId }) {
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
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingBottom: '3rem', display: 'grid', gap: '1.5rem' }}>
      <button
        type="button"
        onClick={() => navigateTo(`/turnier/${tournamentId}`)}
        style={{ alignSelf: 'start', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.75)', borderRadius: '999px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}
      >
        ← Zurück zum Turnier
      </button>

      {loading && <p style={{ opacity: 0.7 }}>Lade...</p>}

      {tournament && !registered && (
        <>
          <div>
            <p style={{ margin: '0 0 0.25rem', opacity: 0.55, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anmeldung</p>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)' }}>{tournament.name}</h1>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '16px', padding: '1.5rem 1.75rem', border: '1px solid rgba(86,160,255,0.15)' }}>
            <RegistrationForm tournament={tournament} onSuccess={() => setRegistered(true)} />
          </div>
        </>
      )}

      {registered && (
        <div style={{ background: 'rgba(64,200,120,0.08)', borderRadius: '16px', padding: '2rem', border: '1px solid rgba(64,200,120,0.2)', textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '2rem' }}>🎉</p>
          <h2 style={{ margin: 0 }}>Anmeldung eingereicht!</h2>
          <p style={{ margin: 0, opacity: 0.75 }}>Du erhältst eine Bestätigungs-E-Mail. Wir melden uns sobald deine Anmeldung geprüft wurde.</p>
          <button
            type="button"
            onClick={() => navigateTo(`/turnier/${tournamentId}`)}
            style={{ justifySelf: 'center', padding: '0.6rem 1.5rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
          >
            Zurück zur Turnierseite
          </button>
        </div>
      )}
    </div>
  );
}
