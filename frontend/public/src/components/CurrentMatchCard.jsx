const cardStyle = {
  display: 'grid',
  gap: '1.5rem',
  padding: '1.75rem',
  background: 'rgba(0, 0, 0, 0.35)',
  borderRadius: '22px',
  backdropFilter: 'blur(5px)',
  boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
  width: '100%'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.75rem',
  width: '100%'
};

const badgeStyle = {
  padding: '0.35rem 0.8rem',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.12)',
  fontSize: '0.85rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const teamsWrapperStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto 1fr',
  gap: '1rem',
  alignItems: 'center',
  width: '100%'
};

const teamColumnStyle = {
  display: 'grid',
  gap: '0.4rem',
  justifyItems: 'start',
  textAlign: 'left',
  width: '100%'
};

const leftTeamColumnStyle = {
  ...teamColumnStyle,
  justifyItems: 'end',
  textAlign: 'right'
};

const teamNameStyle = {
  fontSize: '2.05rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  lineHeight: 1.15,
  wordBreak: 'break-word',
  whiteSpace: 'normal'
};

const scoreStyle = {
  fontSize: '4.4rem',
  fontWeight: 700,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '5.5rem',
  textAlign: 'center'
};

const infoMetaStyle = {
  display: 'flex',
  gap: '1.25rem',
  flexWrap: 'wrap',
  fontSize: '0.95rem',
  opacity: 0.8
};
const responsiveStyles = `
  @media (max-width: 768px) {
    .current-card {
      gap: 1.25rem;
      padding: 1.5rem;
    }
    .current-card__teams {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 0.75rem;
    }
    .current-card__team {
      justify-items: center !important;
      text-align: center !important;
    }
    .current-card__team-name {
      font-size: clamp(1.25rem, 4vw, 1.6rem);
      letter-spacing: 0.05em;
    }
    .current-card__score {
      font-size: 3.4rem;
      min-width: auto;
    }
    .current-card__info {
      justify-content: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }
    .current-card__badge {
      font-size: 0.75rem;
      padding: 0.3rem 0.7rem;
    }
    .current-card__status {
      width: 100%;
      text-align: center;
    }
  }
  @media (max-width: 480px) {
    .current-card {
      padding: 1.35rem;
    }
    .current-card__teams {
      gap: 0.65rem;
    }
    .current-card__team-name {
      font-size: clamp(1.1rem, 5.2vw, 1.3rem);
      line-height: 1.25;
      letter-spacing: 0.04em;
    }
    .current-card__score {
      font-size: 2.8rem;
      padding: 0 0.25rem;
      width: 100%;
    }
    .current-card__info {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .current-card__status {
      font-size: 0.85rem;
    }
  }
`;

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function buildStatusLabel(scoreboard) {
  if (!scoreboard) return 'Keine Daten';
  if (scoreboard.isHalftimeBreak) return 'Halbzeitpause';
  if (scoreboard.isExtraTime) {
    return scoreboard.isRunning ? 'Nachspielzeit · läuft' : 'Nachspielzeit';
  }
  return scoreboard.isRunning ? 'Live' : 'Pause';
}

function buildStageLabel(scoreboard) {
  if (!scoreboard?.stageType || !scoreboard?.stageLabel) {
    return null;
  }
  if (scoreboard.stageType === 'group') {
    return `Gruppenphase – ${scoreboard.stageLabel}`;
  }
  return scoreboard.stageLabel;
}

export default function CurrentMatchCard({ scoreboard }) {
  const status = buildStatusLabel(scoreboard);
  const stageLabel = buildStageLabel(scoreboard);
  const halfInfo = scoreboard?.currentHalf ? `Halbzeit ${scoreboard.currentHalf}` : '';
  const timer = formatTime(scoreboard?.remainingSeconds ?? 0);
  const extraTime = (scoreboard?.extraSeconds ?? 0) > 0 ? formatTime(scoreboard.extraSeconds) : null;
  const penaltiesA = scoreboard?.penalties?.a?.length ?? 0;
  const penaltiesB = scoreboard?.penalties?.b?.length ?? 0;

  return (
    <>
      <section className="current-card" style={cardStyle}>
        {scoreboard ? (
          <>
            <header style={headerStyle}>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                {scoreboard.tournamentName ? (
                  <span style={{ fontSize: '1rem', opacity: 0.8 }}>{scoreboard.tournamentName}</span>
                ) : null}
                <span className="current-card__badge" style={{ ...badgeStyle, background: 'rgba(86, 160, 255, 0.2)', color: '#d8e9ff' }}>
                  {status}
                </span>
              </div>
              {stageLabel ? (
                <strong
                  className="current-card__status"
                  style={{
                    fontSize: '1.05rem',
                    opacity: 0.9,
                    display: 'block',
                    textAlign: 'right',
                    lineHeight: 1.25,
                    maxWidth: '100%',
                    wordBreak: 'break-word'
                  }}
                >
                  {stageLabel}
                </strong>
              ) : null}
            </header>

            <div className="current-card__teams" style={teamsWrapperStyle}>
              <div className="current-card__team current-card__team--left" style={leftTeamColumnStyle}>
                <div className="current-card__team-name" style={teamNameStyle}>{scoreboard.teamAName || 'Team A'}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.75 }}>Strafen: {penaltiesA}</div>
              </div>

              <div className="current-card__score" style={scoreStyle}>
                {scoreboard.scoreA ?? 0} <span style={{ opacity: 0.6 }}>:</span> {scoreboard.scoreB ?? 0}
              </div>

              <div className="current-card__team current-card__team--right" style={teamColumnStyle}>
                <div className="current-card__team-name" style={teamNameStyle}>{scoreboard.teamBName || 'Team B'}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.75 }}>Strafen: {penaltiesB}</div>
              </div>
            </div>

            <div className="current-card__info" style={infoMetaStyle}>
              <span>Zeit: {timer}</span>
              {halfInfo ? <span>{halfInfo}</span> : null}
              {extraTime ? <span>Nachspielzeit {extraTime}</span> : null}
              {scoreboard.halftimeSeconds ? <span>Halbzeit bei {formatTime(scoreboard.halftimeSeconds)}</span> : null}
            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', opacity: 0.8 }}>Kein aktuelles Spiel ausgewählt.</p>
        )}
      </section>
      <style>{responsiveStyles}</style>
    </>
  );
}
