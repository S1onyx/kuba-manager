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
    fontSize: '7rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textShadow: '0 0 25px rgba(0,0,0,0.6)',
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    fontFamily: "'Share Tech Mono', 'Roboto Mono', 'SFMono-Regular', 'Menlo', 'monospace'",
    minWidth: extraElapsed ? '16ch' : '10ch',
    display: 'inline-flex',
    justifyContent: 'center'
  };

  return (
    <div style={{ display: 'grid', gap: '1.5rem', justifyItems: 'center' }}>
      <div style={timeStyle}>{timeDisplay}</div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <span
          style={{
            fontSize: '3rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: statusColor
          }}
        >
          {statusText}
        </span>
        {isHalftimeBreak && (
          <span style={{ fontSize: '3rem', fontWeight: '600', color: '#ffffff' }}>
            {halftimeBreakRemaining || '00:00'}
          </span>
        )}
      </div>

      <div style={{ fontSize: '2rem', fontWeight: '600', textTransform: 'uppercase', opacity: 0.85 }}>{halfLabel}</div>

      <div style={{ fontSize: '1.3rem', opacity: 0.8, display: 'grid', gap: '0.35rem', textAlign: 'center' }}>
        {extraTime && <span>Geplante Nachspielzeit: +{extraTime}</span>}
        {extraElapsed && <span>Nachspielzeit läuft seit: {extraElapsed}</span>}
        {halftimeAt && <span>Halbzeit bei {halftimeAt}</span>}
      </div>
    </div>
  );
}
