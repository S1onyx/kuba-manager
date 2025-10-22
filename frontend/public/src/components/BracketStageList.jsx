const sectionStyle = {
  background: 'rgba(0,0,0,0.32)',
  borderRadius: '20px',
  padding: '1.5rem',
  display: 'grid',
  gap: '1.35rem'
};

const stageWrapperStyle = {
  display: 'grid',
  gap: '0.75rem'
};

const matchStyle = {
  display: 'grid',
  gap: '0.55rem',
  padding: '1rem 1.15rem',
  borderRadius: '16px',
  background: 'rgba(255,255,255,0.05)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.18)'
};

const matchRowStyle = {
  display: 'grid',
  gap: '0.4rem',
  textAlign: 'center',
  justifyItems: 'center'
};

const stageLabelStyle = {
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.75
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .bracket-stage__match {
      padding: 0.9rem 1rem;
    }
  }

  @media (max-width: 480px) {
    .bracket-stage__row {
      gap: 0.3rem;
    }
  }
`;

const separatorStyle = {
  fontSize: '0.9rem',
  fontWeight: 600,
  opacity: 0.65
};

const teamNameStyle = {
  fontWeight: 600
};

const matchTimeStyle = {
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  opacity: 0.7
};

function renderMatch(match, index, formatDateTime) {
  const labelKey = match.id || `${match.stage_label}-${index}`;
  const hasResult = Boolean(match.result?.hasResult);
  const scoreText = hasResult ? `${match.result.scoreA ?? 0} : ${match.result.scoreB ?? 0}` : 'vs';
  const scheduledLabel = formatDateTime ? formatDateTime(match.scheduled_at) : null;
  return (
    <article key={labelKey} className="bracket-stage__match" style={matchStyle}>
      <div className="bracket-stage__row" style={matchRowStyle}>
        <span className="bracket-stage__team bracket-stage__team--home" style={teamNameStyle}>
          {match.home_label}
        </span>
        <span
          className="bracket-stage__separator"
          style={{
            ...separatorStyle,
            opacity: hasResult ? 1 : separatorStyle.opacity,
            fontWeight: hasResult ? 700 : separatorStyle.fontWeight
          }}
        >
          {scoreText}
        </span>
        <span className="bracket-stage__team bracket-stage__team--away" style={teamNameStyle}>
          {match.away_label}
        </span>
      </div>
      {scheduledLabel ? <span style={matchTimeStyle}>{scheduledLabel}</span> : null}
      {match.metadata?.description ? (
        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{match.metadata.description}</span>
      ) : null}
    </article>
  );
}

export default function BracketStageList({ stages = [], title, description, formatDateTime }) {
  if (!stages || stages.length === 0) {
    return null;
  }

  return (
    <section className="ko-section" style={sectionStyle}>
      {title ? (
        <header>
          <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>{title}</h3>
          {description ? <p style={{ fontSize: '0.95rem', opacity: 0.75 }}>{description}</p> : null}
        </header>
      ) : null}

      <div style={{ display: 'grid', gap: '1.15rem' }}>
        {stages.map((stage) => (
          <div key={stage.stage_label} style={stageWrapperStyle}>
            <strong style={stageLabelStyle}>{stage.stage_label}</strong>
            {stage.matches.map((match, index) => renderMatch(match, index, formatDateTime))}
          </div>
        ))}
      </div>
      <style>{responsiveStyles}</style>
    </section>
  );
}
