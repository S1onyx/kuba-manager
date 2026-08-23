import { useTranslation } from 'react-i18next';
import useMediaQuery from '../hooks/useMediaQuery.js';

// Shared axis grid: left number | center glyph | right number.
// `1fr auto 1fr` guarantees the center cell's midpoint is at exactly 50%
// of the row width, so every colon + the dot stack on one vertical line.
function AxisRow({ left, center, right, style, centerStyle }) {
  return (
    <div
      style={{
        width: '100%',
        display: 'grid',
        // minmax(0,1fr): tracks stay equal even with long content → colon never drifts
        gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
        alignItems: 'center'
      }}
    >
      <span style={{ ...style, textAlign: 'right', minWidth: 0 }}>{left}</span>
      <span style={{ ...style, ...centerStyle, textAlign: 'center', padding: '0 0.1em' }}>{center}</span>
      <span style={{ ...style, textAlign: 'left', minWidth: 0 }}>{right}</span>
    </div>
  );
}

export default function Timer({
  time,
  isRunning,
  extraTime,
  extraElapsed,
  isHalftimeBreak,
  halftimeBreakRemaining
}) {
  const { t } = useTranslation();
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const isStacked = useMediaQuery('(max-width: 720px)');

  const dotColor = isRunning ? '#4caf50' : '#ff7043';
  const fontSize = isStacked ? '5.5rem' : isCompact ? '8rem' : '9.5rem';

  const monoStyle = {
    fontSize,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textShadow: '0 0 25px rgba(0,0,0,0.6)',
    fontVariantNumeric: 'tabular-nums',
    fontFeatureSettings: '"tnum"',
    fontFamily: "'Share Tech Mono', 'Roboto Mono', 'SFMono-Regular', 'Menlo', monospace",
    lineHeight: 1
  };

  const splitColon = (value) => {
    const v = value || '00:00';
    const i = v.indexOf(':');
    return i >= 0 ? [v.slice(0, i), v.slice(i + 1)] : [v, ''];
  };

  const [mins, secs] = splitColon(time);
  // Extra time shown inline behind the clock: elapsed if running, else the planned amount
  const extra = extraElapsed || extraTime || null;

  return (
    <div style={{ width: '100%', display: 'grid', gap: isStacked ? '0.75rem' : '1rem', justifyItems: 'center' }}>
      <AxisRow
        style={monoStyle}
        centerStyle={{ opacity: 0.9 }}
        left={mins}
        center=":"
        right={
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.15em' }}>
            {secs}
            {extra ? (
              <span
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  fontFamily: 'system-ui, sans-serif',
                  lineHeight: 1,
                  alignSelf: 'center'
                }}
              >
                <span style={{ fontSize: '0.32em', fontWeight: 600, opacity: 0.9 }}>+{extra}</span>
                <span
                  style={{
                    fontSize: '0.16em',
                    fontWeight: 500,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    opacity: 0.65
                  }}
                >
                  {t('scoreboard.extraTime')}
                </span>
              </span>
            ) : null}
          </span>
        }
      />

      {isHalftimeBreak ? (
        <div style={{ width: '100%', display: 'grid', justifyItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: isStacked ? '1rem' : '1.3rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: 0.7
            }}
          >
            {t('scoreboard.halftimeBreak')}
          </span>
          {(() => {
            const [hm, hs] = splitColon(halftimeBreakRemaining);
            const hStyle = {
              fontSize: isStacked ? '3.5rem' : isCompact ? '5rem' : '6rem',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"tnum"',
              fontFamily: "'Share Tech Mono', 'Roboto Mono', 'SFMono-Regular', 'Menlo', monospace",
              lineHeight: 1
            };
            return <AxisRow style={hStyle} centerStyle={{ opacity: 0.9 }} left={hm} center=":" right={hs} />;
          })()}
        </div>
      ) : (
        // CSS circle (not a glyph — "●" has asymmetric side bearings) in the center column → dead on the colon axis.
        <AxisRow
          style={{ lineHeight: 1 }}
          left=""
          right=""
          center={
            <span
              style={{
                display: 'block',
                width: isStacked ? '0.7rem' : '0.95rem',
                height: isStacked ? '0.7rem' : '0.95rem',
                borderRadius: '50%',
                background: dotColor,
                boxShadow: `0 0 12px ${dotColor}`
              }}
            />
          }
        />
      )}
    </div>
  );
}
