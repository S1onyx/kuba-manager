import useMediaQuery from '../../hooks/useMediaQuery.js';

function resolveParticipantName(entry, fallback) {
  if (!entry) {
    return fallback || '—';
  }
  if (entry.teamName) return entry.teamName;
  if (entry.placeholder) return entry.placeholder;
  if (entry.label) return entry.label;
  if (entry.name) return entry.name;
  return fallback || '—';
}

const sectionStyle = {
  width: '100%',
  display: 'grid',
  gap: 'clamp(1.1rem, 3vw, 1.5rem)'
};

const stagesGridStyle = {
  display: 'grid',
  gap: 'clamp(1rem, 2.5vw, 1.25rem)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))'
};

const stageCardStyle = {
  padding: 'clamp(1rem, 2.5vw, 1.2rem)',
  borderRadius: '18px',
  background: 'rgba(0,0,0,0.28)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
  backdropFilter: 'blur(6px)',
  display: 'grid',
  gap: '0.9rem'
};

const stageHeaderStyle = {
  margin: 0,
  fontSize: 'clamp(1.1rem, 2.4vw, 1.35rem)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em'
};

const matchListStyle = {
  display: 'grid',
  gap: '0.75rem'
};

const matchRowStyle = {
  display: 'grid',
  gap: '0.65rem',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  background: 'rgba(255,255,255,0.08)',
  padding: '0.85rem 1rem',
  borderRadius: '12px'
};

const teamStyle = {
  fontSize: '1.05rem',
  fontWeight: 600,
  textAlign: 'left'
};

const scoreStyle = {
  fontSize: '1.15rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textAlign: 'center'
};

const codeStyle = {
  marginTop: '0.3rem',
  fontSize: '0.85rem',
  opacity: 0.7,
  letterSpacing: '0.08em'
};

const scheduleFormatter = new Intl.DateTimeFormat('de-DE', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

function formatMatchDateTime(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const formatted = scheduleFormatter.format(date).split(', ').join(' · ');
  return `${formatted} Uhr`;
}

export default function BracketStageMatches({ title, stages }) {
  const validStages = Array.isArray(stages)
    ? stages.filter((stage) => Array.isArray(stage.matches) && stage.matches.length > 0)
    : [];
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const isStacked = useMediaQuery('(max-width: 720px)');

  if (validStages.length === 0) {
    return null;
  }

  return (
    <section style={sectionStyle}>
      <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 2.6vw, 1.8rem)', letterSpacing: '0.06em' }}>{title}</h2>
      <div style={stagesGridStyle}>
        {validStages.map((stage) => (
          <article key={stage.stage_label || stage.label} style={stageCardStyle}>
            {(() => {
              const firstMatch = stage.matches?.[0];
              const roundNumber = firstMatch?.round_number ?? firstMatch?.round ?? null;
              return (
                <div>
                  <h3 style={stageHeaderStyle}>{stage.stage_label || stage.label || 'Phase'}</h3>
                  {roundNumber ? (
                    <p style={{ margin: 0, opacity: 0.7, fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                      Runde {roundNumber}
                    </p>
                  ) : null}
                </div>
              );
            })()}
            <div style={matchListStyle}>
              {stage.matches.map((match) => {
                const homeName = resolveParticipantName(match.home, match.home_label);
                const awayName = resolveParticipantName(match.away, match.away_label);
                const hasResult = match.result?.hasResult;
                const scoreDisplay = hasResult
                  ? `${match.result.scoreA ?? 0}:${match.result.scoreB ?? 0}`
                  : 'vs';

                const scheduledLabel = formatMatchDateTime(match.scheduled_at);
                const metaSegments = [];
                if (scheduledLabel) {
                  metaSegments.push(scheduledLabel);
                }
                if (match.code) {
                  metaSegments.push(`Matchcode ${match.code}`);
                } else if (hasResult && match.result?.finishedAt) {
                  const finishedAtLabel = new Date(match.result.finishedAt).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                    .split(', ')
                    .join(' · ');
                  metaSegments.push(`${finishedAtLabel} Uhr`);
                }
                const metaLine = metaSegments.join(' · ');

                return (
                  <div
                    key={match.id ?? match.code ?? `${homeName}-${awayName}`}
                    style={{
                      ...matchRowStyle,
                      gridTemplateColumns: isStacked ? '1fr' : matchRowStyle.gridTemplateColumns,
                      gap: isStacked ? '0.5rem' : matchRowStyle.gap,
                      textAlign: isStacked ? 'center' : 'left'
                    }}
                  >
                    <div
                      style={{
                        ...teamStyle,
                        fontSize: isCompact ? '1rem' : teamStyle.fontSize,
                        textAlign: isStacked ? 'center' : 'left'
                      }}
                    >
                      {homeName}
                    </div>
                    <div
                      style={{
                        ...scoreStyle,
                        fontSize: isCompact ? '1rem' : scoreStyle.fontSize
                      }}
                    >
                      {scoreDisplay}
                    </div>
                    <div
                      style={{
                        ...teamStyle,
                        fontSize: isCompact ? '1rem' : teamStyle.fontSize,
                        textAlign: isStacked ? 'center' : 'right'
                      }}
                    >
                      {awayName}
                    </div>
                    {metaLine ? (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          ...codeStyle,
                          textAlign: 'center'
                        }}
                      >
                        {metaLine}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
