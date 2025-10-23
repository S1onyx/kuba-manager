import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function TournamentSection() {
  const {
    tournaments: { list, selectedId, select, loading, error },
    scoreboardState: { scoreboard, currentTournamentMeta },
    summary: { scoreboardPublic }
  } = usePublicApp();

  if (loading) {
    return (
      <SectionWrapper title="Öffentliche Turniere">
        <p style={{ opacity: 0.75 }}>Lade Turnierliste...</p>
      </SectionWrapper>
    );
  }

  if (error) {
    return (
      <SectionWrapper title="Öffentliche Turniere">
        <p style={{ color: '#ffb0b0' }}>{error}</p>
      </SectionWrapper>
    );
  }

  if (!list || list.length === 0) {
    return (
      <SectionWrapper title="Öffentliche Turniere">
        <p style={{ opacity: 0.75 }}>Noch keine Turniere als öffentlich markiert.</p>
      </SectionWrapper>
    );
  }

  const activeTournamentId = scoreboard?.tournamentId ?? currentTournamentMeta?.id;

  return (
    <SectionWrapper title="Öffentliche Turniere">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {list.map((tournament) => {
          const isSelected = selectedId === tournament.id;
          const isLive = scoreboardPublic && activeTournamentId === tournament.id;
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
                color: isSelected ? '#dcefff' : '#f0f4ff',
                fontWeight: isSelected ? 600 : 500,
                letterSpacing: '0.05em',
                cursor: 'pointer'
              }}
            >
              {tournament.name}
              {isLive ? ' · Live' : ''}
            </button>
          );
        })}
      </div>
    </SectionWrapper>
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
