import useMediaQuery from '../hooks/useMediaQuery.js';

export default function Scoreboard({ score, teamNames }) {
  const isCompact = useMediaQuery('(max-width: 1300px)');
  const isStacked = useMediaQuery('(max-width: 720px)');

  const wrapperBase = {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.25)',
    borderRadius: '24px',
    boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
    backdropFilter: 'blur(6px)',
    padding: isStacked ? '1.25rem 1rem' : isCompact ? '1.6rem 0' : '2.1rem 0',
    boxSizing: 'border-box'
  };

  const nameFontSize = isStacked ? '1.6rem' : isCompact ? '2.2rem' : '2.6rem';
  const scoreFontSize = isStacked ? '5.5rem' : isCompact ? '7rem' : '8.5rem';
  const separatorFontSize = isStacked ? '2.4rem' : isCompact ? '3.8rem' : '4.4rem';

  const nameStyle = {
    fontSize: nameFontSize,
    fontWeight: 600,
    letterSpacing: '0.08em',
    opacity: 0.92,
    overflowWrap: 'anywhere',
    lineHeight: 1.15
  };

  const scoreStyle = {
    fontSize: scoreFontSize,
    fontWeight: 700,
    textShadow: '0 0 25px rgba(0,0,0,0.6)',
    flexShrink: 0,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    // Reserve 2-digit width so 9→10 doesn't reflow and trigger a rescale.
    // ponytail: 2ch covers 10–99; 100+ jumps once — bump to 3ch if games hit triple digits.
    display: 'inline-block',
    minWidth: '2ch',
    boxSizing: 'content-box'
  };

  const separatorStyle = {
    fontSize: separatorFontSize,
    fontWeight: 700,
    opacity: 0.75,
    flexShrink: 0,
    textAlign: 'center',
    padding: '0 0.4rem'
  };

  if (isStacked) {
    return (
      <div style={{ ...wrapperBase, display: 'grid', gap: '0.75rem', textAlign: 'center' }}>
        <span style={nameStyle}>{teamNames.teamA}</span>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <span style={scoreStyle}>{score.teamA}</span>
          <span style={separatorStyle}>:</span>
          <span style={scoreStyle}>{score.teamB}</span>
        </div>
        <span style={nameStyle}>{teamNames.teamB}</span>
      </div>
    );
  }

  const gap = isCompact ? '0.5rem' : '0.75rem';

  return (
    // minmax(0,1fr) auto minmax(0,1fr): colon stays at exact 50% even with long names, same axis as Timer
    <div style={{ ...wrapperBase, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap, minWidth: 0 }}>
        <span style={{ ...nameStyle, textAlign: 'right', minWidth: 0 }}>{teamNames.teamA}</span>
        <span style={scoreStyle}>{score.teamA}</span>
      </div>

      <span style={separatorStyle}>:</span>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap, minWidth: 0 }}>
        <span style={scoreStyle}>{score.teamB}</span>
        <span style={{ ...nameStyle, textAlign: 'left', minWidth: 0 }}>{teamNames.teamB}</span>
      </div>
    </div>
  );
}
