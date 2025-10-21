const listStyle = {
  display: 'grid',
  gap: '0.75rem'
};

const itemStyle = {
  display: 'grid',
  gap: '0.25rem',
  padding: '0.75rem 1rem',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.05)'
};

const metaStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.65
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .recent-results__item {
      padding: 0.7rem 0.85rem;
    }
    .recent-results__row {
      font-size: 0.85rem;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .recent-results__row {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  }
`;

export default function RecentResults({ games = [] }) {
  if (!games || games.length === 0) {
    return null;
  }

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>Letzte Ergebnisse</h3>
      </header>
      <div style={listStyle}>
        {games.map((game) => (
          <article key={game.id} className="recent-results__item" style={itemStyle}>
            <div
              className="recent-results__row"
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}
            >
              <strong>{game.teamA}</strong>
              <span>
                {game.scoreA} : {game.scoreB}
              </span>
              <strong>{game.teamB}</strong>
            </div>
            <div style={metaStyle}>
              {game.stageType === 'group' ? `Gruppe ${game.stageLabel}` : game.stageLabel || 'KO-Spiel'} ·{' '}
              {new Date(game.created_at).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </article>
        ))}
      </div>
      <style>{responsiveStyles}</style>
    </section>
  );
}
