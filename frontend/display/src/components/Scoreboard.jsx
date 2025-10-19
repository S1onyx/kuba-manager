export default function Scoreboard({ score, teamNames }) {
  const wrapperStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '3rem',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 3rem',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '24px',
    boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(6px)'
  };

  const teamStyle = {
    display: 'grid',
    gap: '1rem',
    textTransform: 'uppercase'
  };

  const nameStyle = {
    fontSize: '2.5rem',
    fontWeight: '600',
    letterSpacing: '0.08em',
    opacity: 0.9
  };

  const scoreStyle = {
    fontSize: '6rem',
    fontWeight: '700',
    textShadow: '0 0 25px rgba(0,0,0,0.6)'
  };

  return (
    <div style={wrapperStyle}>
      <div style={{ ...teamStyle, textAlign: 'right' }}>
        <span style={nameStyle}>{teamNames.teamA}</span>
        <span style={scoreStyle}>{score.teamA}</span>
      </div>

      <div style={{ fontSize: '5rem', fontWeight: '700', opacity: 0.8 }}>:</div>

      <div style={{ ...teamStyle, textAlign: 'left' }}>
        <span style={nameStyle}>{teamNames.teamB}</span>
        <span style={scoreStyle}>{score.teamB}</span>
      </div>
    </div>
  );
}
