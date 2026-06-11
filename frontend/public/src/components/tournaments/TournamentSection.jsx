import { usePublicApp } from '../../context/PublicAppContext.jsx';
import { navigateTo } from '../../hooks/useHashRoute.js';

export default function TournamentSection() {
  const {
    tournaments: { list, selectedId, select, loading, error },
    scoreboardState: { scoreboard, currentTournamentMeta },
    summary: { scoreboardPublic }
  } = usePublicApp();

  if (loading) {
    return (
      <SectionWrapper title="Turniere">
        <p style={{ opacity: 0.75 }}>Lade Turnierliste...</p>
      </SectionWrapper>
    );
  }

  if (error) {
    return (
      <SectionWrapper title="Turniere">
        <p style={{ color: '#ffb0b0' }}>{error}</p>
      </SectionWrapper>
    );
  }

  if (!list || list.length === 0) {
    return (
      <SectionWrapper title="Turniere">
        <p style={{ opacity: 0.75 }}>Noch keine Turniere als öffentlich markiert.</p>
      </SectionWrapper>
    );
  }

  const activeTournamentId = scoreboard?.tournamentId ?? currentTournamentMeta?.id;
  const activeTournaments = list.filter((t) => t.status === 'active' || !t.status);
  const plannedTournaments = list.filter((t) => t.status === 'planned');

  return (
    <>
      {plannedTournaments.length > 0 && (
        <SectionWrapper title="Kommende Turniere">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center'
            }}
          >
            {plannedTournaments.map((tournament) => (
              <PlannedTournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </SectionWrapper>
      )}

      {activeTournaments.length > 0 && (
        <SectionWrapper title="Turniere">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {activeTournaments.map((tournament) => {
              const isSelected = selectedId === tournament.id;
              const isLive = scoreboardPublic && activeTournamentId === tournament.id;
              const isCompleted = tournament.is_completed;
              return (
                <button
                  key={tournament.id}
                  type="button"
                  onClick={() => select(tournament.id)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: isSelected ? 'rgba(86, 160, 255, 0.25)' : 'transparent',
                    color: isSelected ? '#dcefff' : isCompleted ? 'rgba(255,255,255,0.45)' : '#f0f4ff',
                    fontWeight: isSelected ? 600 : 500,
                    letterSpacing: '0.05em',
                    cursor: 'pointer'
                  }}
                >
                  {tournament.name}
                  {isLive ? ' · Live' : isCompleted ? ' · Abgeschlossen' : ''}
                </button>
              );
            })}
          </div>
        </SectionWrapper>
      )}
    </>
  );
}

function PlannedTournamentCard({ tournament }) {
  const formattedDate = tournament.planned_at
    ? new Date(tournament.planned_at).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.35)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        width: '300px',
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {tournament.poster_url ? (
        <img
          src={tournament.poster_url}
          alt={`Plakat ${tournament.name}`}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '2rem' }}>
          🏆
        </div>
      )}
      <div style={{ padding: '1rem 1.25rem', display: 'grid', gap: '0.4rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tournament.name}</span>
          <span style={{ display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(255,171,64,0.2)', color: '#ffd180', fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            Geplant
          </span>
        </div>
        {formattedDate && <p style={{ opacity: 0.75, fontSize: '0.85rem', margin: 0 }}>{formattedDate}</p>}
        {tournament.location && <p style={{ opacity: 0.55, fontSize: '0.8rem', margin: 0 }}>{tournament.location}</p>}
      </div>
      <div style={{ padding: '0 1.25rem 1rem' }}>
        <button
          type="button"
          onClick={() => navigateTo(`/turnier/${tournament.id}`)}
          style={{
            width: '100%',
            padding: '0.55rem',
            borderRadius: '8px',
            border: '1px solid rgba(86,160,255,0.4)',
            background: 'rgba(86,160,255,0.1)',
            color: '#7cb9ff',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.04em'
          }}
        >
          Details &amp; Anmeldung →
        </button>
      </div>
    </div>
  );
}

function SectionWrapper({ title, children }) {
  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.05em' }}>{title}</h2>
      {children}
    </section>
  );
}
