import { usePublicApp } from '../../context/PublicAppContext.jsx';

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
        maxWidth: '100%'
      }}
    >
      {tournament.poster_url && (
        <img
          src={tournament.poster_url}
          alt={`Plakat ${tournament.name}`}
          style={{
            width: '100%',
            maxHeight: '260px',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      )}
      <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{tournament.name}</span>
          <span
            style={{
              display: 'inline-block',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              background: 'rgba(255,171,64,0.2)',
              color: '#ffd180',
              fontSize: '0.75rem',
              letterSpacing: '0.08em'
            }}
          >
            Geplant
          </span>
        </div>
        {formattedDate && (
          <p style={{ opacity: 0.8, fontSize: '0.9rem', margin: 0 }}>{formattedDate}</p>
        )}
        {tournament.location && (
          <p style={{ opacity: 0.65, fontSize: '0.875rem', margin: 0 }}>{tournament.location}</p>
        )}
        {tournament.description && (
          <p style={{ opacity: 0.6, fontSize: '0.85rem', margin: 0, marginTop: '0.25rem' }}>
            {tournament.description}
          </p>
        )}
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
