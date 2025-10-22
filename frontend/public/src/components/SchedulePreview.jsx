import BracketStageList from './BracketStageList.jsx';

const containerStyle = {
  background: 'rgba(0,0,0,0.28)',
  borderRadius: '20px',
  padding: '1.5rem',
  display: 'grid',
  gap: '1.5rem'
};

const groupCardStyle = {
  background: 'rgba(0,0,0,0.32)',
  borderRadius: '18px',
  padding: '1.1rem 1.25rem',
  display: 'grid',
  gap: '0.9rem'
};

const roundHeaderStyle = {
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.7
};

const matchRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  alignItems: 'center',
  columnGap: '0.7rem',
  fontSize: '0.95rem'
};

const matchTimeLabelStyle = {
  gridColumn: '1 / -1',
  fontSize: '0.8rem',
  letterSpacing: '0.06em',
  opacity: 0.7,
  textAlign: 'center'
};

const responsiveStyles = `
  @media (max-width: 768px) {
    .schedule-preview {
      padding: 1.25rem;
    }
    .schedule-preview__group {
      padding: 1rem 1.05rem;
    }
    .schedule-preview__match {
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      column-gap: 0.45rem;
    }
  }

  @media (max-width: 520px) {
    .schedule-preview__match {
      grid-template-columns: 1fr;
      row-gap: 0.35rem;
      text-align: center;
    }
  }
`;

const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', {
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
  const formatted = dateTimeFormatter.format(date).split(', ').join(' · ');
  return `${formatted} Uhr`;
}

function renderGroupSchedule(groupStages, formatDateTime) {
  if (!groupStages || groupStages.length === 0) {
    return null;
  }

  return (
    <section style={{ display: 'grid', gap: '1.25rem' }}>
      <header>
        <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>Gruppen-Spielplan</h3>
        <p style={{ fontSize: '0.95rem', opacity: 0.75 }}>
          Jede Gruppe spielt eine vollständige Runde – alle Teams treffen einmal aufeinander.
        </p>
      </header>
      <div style={{ display: 'grid', gap: '1.1rem' }}>
        {groupStages.map((group) => (
          <article key={group.stage_label} className="schedule-preview__group" style={groupCardStyle}>
            <strong style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>{group.stage_label}</strong>
            <div style={{ display: 'grid', gap: '0.8rem' }}>
              {group.rounds.map((round) => (
                <div key={`${group.stage_label}-round-${round.round}`} style={{ display: 'grid', gap: '0.55rem' }}>
                  <span style={roundHeaderStyle}>Runde {round.round}</span>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {round.matches.map((match) => {
                      const scheduledLabel = formatDateTime ? formatDateTime(match.scheduled_at) : null;
                      return (
                        <div
                          key={match.id || `${group.stage_label}-${round.round}-${match.match_order}`}
                          className="schedule-preview__match"
                          style={matchRowStyle}
                        >
                          <span style={{ fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {match.home_label}
                          </span>
                          <span
                            style={{
                              opacity: match.result?.hasResult ? 1 : 0.7,
                              fontWeight: match.result?.hasResult ? 700 : 400,
                              letterSpacing: '0.02em',
                              minWidth: '4.5rem',
                              textAlign: 'center'
                            }}
                          >
                            {match.result?.hasResult
                              ? `${match.result.scoreA ?? 0} : ${match.result.scoreB ?? 0}`
                              : 'vs'}
                          </span>
                          <span style={{ fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {match.away_label}
                          </span>
                          {scheduledLabel ? <span style={matchTimeLabelStyle}>{scheduledLabel}</span> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SchedulePreview({ schedule }) {
  if (!schedule) {
    return null;
  }

  const hasGroup = Array.isArray(schedule.group) && schedule.group.length > 0;
  const hasKnockout = Array.isArray(schedule.knockout) && schedule.knockout.length > 0;
  const hasPlacement = Array.isArray(schedule.placement) && schedule.placement.length > 0;
  const showEmptyNotice = !hasGroup && !hasKnockout && !hasPlacement;

  return (
    <section className="schedule-preview" style={containerStyle}>
      <header>
        <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.05em' }}>Spielplan</h2>
        <p style={{ opacity: 0.75, fontSize: '0.95rem' }}>
          Automatisch generierte Partien auf Basis der Gruppen und KO-Runden.
        </p>
      </header>

      {showEmptyNotice ? (
        <p style={{ opacity: 0.75, fontSize: '0.95rem' }}>
          Der vorläufige Spielplan wurde noch nicht veröffentlicht. Sobald Paarungen feststehen, erscheinen sie
          automatisch an dieser Stelle.
        </p>
      ) : (
        <>
          {renderGroupSchedule(schedule.group, formatMatchDateTime)}

          {hasKnockout ? (
            <BracketStageList
              stages={schedule.knockout}
              title="KO-Phase"
              description="Duell-Baum der Finalrunden – Sieger steigen jeweils eine Ebene auf."
              formatDateTime={formatMatchDateTime}
            />
          ) : null}

          {hasPlacement ? (
            <BracketStageList
              stages={schedule.placement}
              title="Platzierungsspiele"
              description="Spiele um die weiteren Platzierungen – alle Teams absolvieren gleich viele Partien."
              formatDateTime={formatMatchDateTime}
            />
          ) : null}
        </>
      )}

      <style>{responsiveStyles}</style>
    </section>
  );
}
