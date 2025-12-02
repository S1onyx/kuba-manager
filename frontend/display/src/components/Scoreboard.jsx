import useMediaQuery from '../hooks/useMediaQuery.js';

export default function Scoreboard({ score, teamNames }) {
  const isCompact = useMediaQuery('(max-width: 1300px)');
  const isStacked = useMediaQuery('(max-width: 720px)');

  const wrapperBase = {
    width: '100%',
    maxWidth: isStacked ? '100%' : '1300px',
    margin: '0 auto',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '24px',
    boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(6px)',
    padding: isStacked ? '1.25rem 1.5rem' : isCompact ? '1.6rem 2rem' : '2.1rem 2.8rem'
  };

  const nameFontSize = isStacked ? '1.6rem' : isCompact ? '2.2rem' : '2.6rem';
  const scoreFontSize = isStacked ? '4rem' : isCompact ? '5rem' : '5.8rem';
  const separatorFontSize = isStacked ? '2.4rem' : isCompact ? '3.8rem' : '4.4rem';

  const nameStyle = {
    fontSize: nameFontSize,
    fontWeight: 600,
    letterSpacing: '0.08em',
    opacity: 0.92,
    wordBreak: 'break-word',
    lineHeight: 1.15,
    textAlign: isStacked ? 'center' : undefined
  };

  const scoreStyle = {
    fontSize: scoreFontSize,
    fontWeight: 700,
    textShadow: '0 0 25px rgba(0,0,0,0.6)',
    minWidth: '3.6rem',
    textAlign: 'center'
  };

  const separatorStyle = {
    fontSize: separatorFontSize,
    fontWeight: 700,
    opacity: 0.75,
    padding: '0 0.75rem'
  };

  if (isStacked) {
    return (
      <div
        style={{
          ...wrapperBase,
          display: 'grid',
          gap: '0.75rem',
          textAlign: 'center'
        }}
      >
        <span style={nameStyle}>{teamNames.teamA}</span>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <span style={scoreStyle}>{score.teamA}</span>
          <span style={separatorStyle}>:</span>
          <span style={scoreStyle}>{score.teamB}</span>
        </div>
        <span style={nameStyle}>{teamNames.teamB}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        ...wrapperBase,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) auto auto auto minmax(0, 1.2fr)',
        alignItems: 'center',
        columnGap: isCompact ? '0.9rem' : '1.2rem'
      }}
    >
      <span style={{ ...nameStyle, textAlign: 'right' }}>{teamNames.teamA}</span>
      <span style={scoreStyle}>{score.teamA}</span>
      <span style={separatorStyle}>:</span>
      <span style={scoreStyle}>{score.teamB}</span>
      <span style={{ ...nameStyle, textAlign: 'left' }}>{teamNames.teamB}</span>
    </div>
  );
}
