const gridStyle = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
};

const cardStyle = {
  background: 'rgba(0,0,0,0.32)',
  borderRadius: '18px',
  padding: '1.1rem 1.25rem',
  display: 'grid',
  gap: '0.4rem',
  boxShadow: '0 12px 28px rgba(0,0,0,0.28)'
};

const pillStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.75
};

const scoreStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.95rem',
  opacity: 0.8
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .team-grid {
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.85rem;
    }
    .team-grid__card {
      padding: 1rem 1rem;
      gap: 0.35rem;
    }
    .team-grid__score {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .team-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }
    .team-grid__title {
      font-size: 1.05rem;
    }
  }
`;

export default function TeamStatsGrid({ stats = [], highlightCount = 6 }) {
  if (!stats || stats.length === 0) {
    return null;
  }

  const topTeams = stats.slice(0, highlightCount);

  return (
    <section>
      <header style={{ marginBottom: '1rem' }}>
        <h3 className="team-grid__title" style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>Top-Teams</h3>
        <p style={{ fontSize: '0.95rem', opacity: 0.75 }}>
          Ranking basierend auf Punkten, Tordifferenz und erzielten Körben.
        </p>
      </header>
      <div className="team-grid" style={gridStyle}>
        {topTeams.map((team, index) => (
          <article key={team.team} className="team-grid__card" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={pillStyle}>#{index + 1}</span>
              <strong style={{ fontSize: '1.15rem', letterSpacing: '0.05em' }}>{team.team}</strong>
            </div>
            <div className="team-grid__score" style={{ ...scoreStyle, fontWeight: 600 }}>
              <span>Punkte</span>
              <span>{team.points}</span>
            </div>
            <div className="team-grid__score" style={scoreStyle}>
              <span>Bilanz</span>
              <span>
                {team.wins}-{team.draws}-{team.losses}
              </span>
            </div>
            <div className="team-grid__score" style={scoreStyle}>
              <span>Tore</span>
              <span>
                {team.goalsFor}:{team.goalsAgainst} ({team.goalDiff >= 0 ? '+' : ''}
                {team.goalDiff})
              </span>
            </div>
            <div className="team-grid__score" style={scoreStyle}>
              <span>Spiele</span>
              <span>{team.played}</span>
            </div>
            <div className="team-grid__score" style={scoreStyle}>
              <span>Strafen</span>
              <span>{team.penalties}</span>
            </div>
          </article>
        ))}
      </div>
      <style>{responsiveStyles}</style>
    </section>
  );
}
