export default function Scoreboard({ score, teamNames }) {
  const wrapperStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) auto auto auto minmax(0, 1.2fr)',
    alignItems: 'center',
    columnGap: '1.2rem',
    width: '100%',
    maxWidth: '1300px',
    margin: '0 auto',
    padding: '2.1rem 2.8rem',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '24px',
    boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(6px)'
  };

  const nameStyleLeft = {
    fontSize: '2.6rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    opacity: 0.92,
    wordBreak: 'break-word',
    lineHeight: 1.15,
    textAlign: 'right',
    display: 'block'
  };

  const nameStyleRight = {
    ...nameStyleLeft,
    textAlign: 'left'
  };

  const scoreStyle = {
    fontSize: '5.8rem',
    fontWeight: 700,
    textShadow: '0 0 25px rgba(0,0,0,0.6)',
    minWidth: '3.6rem',
    textAlign: 'center'
  };

  const separatorStyle = {
    fontSize: '4.4rem',
    fontWeight: 700,
    opacity: 0.75,
    padding: '0 0.75rem'
  };

  return (
    <div style={wrapperStyle}>
      <span style={nameStyleLeft}>{teamNames.teamA}</span>
      <span style={scoreStyle}>{score.teamA}</span>
      <span style={separatorStyle}>:</span>
      <span style={scoreStyle}>{score.teamB}</span>
      <span style={nameStyleRight}>{teamNames.teamB}</span>
    </div>
  );
}
