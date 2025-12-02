import useMediaQuery from '../hooks/useMediaQuery.js';

export default function Timer({
  time,
  isRunning,
  extraTime,
  extraElapsed,
  halftimeAt,
  half,
  isHalftimeBreak,
  halftimeBreakRemaining,
  isExtraTime
}) {
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const isStacked = useMediaQuery('(max-width: 720px)');
  const halfLabel = half === 2 ? '2. Halbzeit' : '1. Halbzeit';
  const timeDisplay = extraElapsed ? `${time} +${extraElapsed}` : time;

  let statusText;
  if (isHalftimeBreak) {
    statusText = 'Halbzeitpause';
  } else if (isExtraTime) {
    statusText = isRunning ? 'Nachspielzeit' : 'Nachspielzeit (Pause)';
  } else {
    statusText = isRunning ? 'Läuft' : 'Pause';
  }

  let statusColor;
  if (isHalftimeBreak) {
    statusColor = '#ffd54f';
  } else if (isExtraTime) {
    statusColor = '#4fc3f7';
  } else if (isRunning) {
    statusColor = '#4caf50';
  } else {
    statusColor = '#ff7043';
  }

  const timeStyle = {
    fontSize: isStacked ? '4.2rem' : isCompact ? '6rem' : '7rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textShadow: '0 0 25px rgba(0,0,0,0.6)',
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    fontFamily: "'Share Tech Mono', 'Roboto Mono', 'SFMono-Regular', 'Menlo', 'monospace'",
    width: '18ch',
    maxWidth: '100%',
    display: 'inline-flex',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    textAlign: 'center'
  };

  return (
    <div
      style={{
        display: 'grid',
        gap: isStacked ? '1rem' : '1.5rem',
        justifyItems: 'center',
        textAlign: 'center'
      }}
    >
      <div style={timeStyle}>{timeDisplay}</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <span
          style={{
            fontSize: isStacked ? '2rem' : '3rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: statusColor
          }}
        >
          {statusText}
        </span>
        {isHalftimeBreak && (
          <span style={{ fontSize: isStacked ? '2.2rem' : '3rem', fontWeight: '600', color: '#ffffff' }}>
            {halftimeBreakRemaining || '00:00'}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: isStacked ? '1.3rem' : isCompact ? '1.6rem' : '2rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          opacity: 0.85
        }}
      >
        {halfLabel}
      </div>

      <div
        style={{
          fontSize: isStacked ? '1rem' : '1.3rem',
          opacity: 0.8,
          display: 'grid',
          gap: '0.35rem',
          textAlign: 'center'
        }}
      >
        {extraTime && <span>Geplante Nachspielzeit: +{extraTime}</span>}
        {extraElapsed && <span>Nachspielzeit läuft seit: {extraElapsed}</span>}
        {halftimeAt && <span>Halbzeit bei {halftimeAt}</span>}
      </div>
    </div>
  );
}
