const listStyle = {
  display: 'grid',
  gap: '0.8rem'
};

const itemStyle = {
  display: 'grid',
  gap: '0.45rem',
  padding: '0.85rem 1.1rem',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.04)'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  fontSize: '0.95rem',
  columnGap: '0.75rem'
};

const teamStyle = {
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const scoreStyle = {
  fontWeight: 700,
  letterSpacing: '0.04em',
  minWidth: '4.5rem',
  textAlign: 'center'
};

const metaStyle = {
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.65
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .recent-results__item {
      padding: 0.75rem 0.9rem;
    }
    .recent-results__row {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      font-size: 0.85rem;
      column-gap: 0.5rem;
    }
  }

  @media (max-width: 520px) {
    .recent-results__row {
      grid-template-columns: 1fr;
      text-align: center;
      row-gap: 0.35rem;
    }
    .recent-results__score {
      order: -1;
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
            <div className="recent-results__row" style={rowStyle}>
              <strong style={{ ...teamStyle, textAlign: 'left' }}>{game.teamA}</strong>
              <span className="recent-results__score" style={scoreStyle}>
                {game.scoreA} : {game.scoreB}
              </span>
              <strong style={{ ...teamStyle, textAlign: 'right' }}>{game.teamB}</strong>
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
