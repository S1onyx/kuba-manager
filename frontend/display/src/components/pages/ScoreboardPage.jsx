import Scoreboard from '../Scoreboard.jsx';
import Timer from '../Timer.jsx';
import PenaltiesSection from '../scoreboard/PenaltiesSection.jsx';
import StandingsSection from '../scoreboard/StandingsSection.jsx';
import { formatStageDescription, formatTime } from '../../utils/formatting.js';

const pageStyle = {
  width: '1600px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2.5rem 3rem',
  gap: '2.2rem',
  boxSizing: 'border-box',
  color: '#ffffff'
};

export default function ScoreboardPage({
  scoreboard,
  error,
  standings,
  standingsMeta,
  standingsError,
  standingsLoading
}) {
  const score = {
    teamA: scoreboard?.scoreA ?? 0,
    teamB: scoreboard?.scoreB ?? 0
  };

  const teamNames = {
    teamA: scoreboard?.teamAName ?? 'Team A',
    teamB: scoreboard?.teamBName ?? 'Team B'
  };

  const formattedRemaining = formatTime(scoreboard?.remainingSeconds ?? 0);
  const extraExpected =
    scoreboard && (scoreboard.extraSeconds ?? 0) !== 0 ? formatTime(scoreboard.extraSeconds ?? 0) : null;
  const extraElapsed =
    scoreboard && (scoreboard.extraElapsedSeconds ?? 0) !== 0
      ? formatTime(scoreboard.extraElapsedSeconds ?? 0)
      : null;
  const halftimeFormatted =
    scoreboard?.halftimeSeconds ? formatTime(scoreboard.halftimeSeconds) : null;
  const isHalftimeBreak = Boolean(scoreboard?.isHalftimeBreak);
  const halftimeBreakRemaining = isHalftimeBreak
    ? formatTime(scoreboard?.halftimePauseRemaining ?? 0)
    : null;
  const isExtraTime = Boolean(scoreboard?.isExtraTime);
  const currentHalf = scoreboard?.currentHalf ?? 1;
  const penalties = scoreboard?.penalties ?? { a: [], b: [] };
  const tournamentName =
    scoreboard?.tournamentName || standingsMeta?.tournamentName || '';
  const stageLabel = scoreboard?.stageLabel ?? standingsMeta?.stageLabel;
  const stageDescription = formatStageDescription(scoreboard?.stageType, stageLabel);
  const showStandingsSection =
    scoreboard?.stageType === 'group' && Array.isArray(standings) && standings.length > 0;

  return (
    <div style={pageStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '4.5rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}
        >
          Kunstrad Basketball
        </h1>
        {error ? <p style={{ color: '#ff8a80', fontSize: '1.2rem' }}>{error}</p> : null}
      </header>

      {tournamentName || scoreboard?.stageLabel ? (
        <div style={{ textAlign: 'center' }}>
          {tournamentName ? (
            <h2
              style={{
                fontSize: '2.4rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem'
              }}
            >
              {tournamentName}
            </h2>
          ) : null}
          {stageDescription ? (
            <p
              style={{
                fontSize: '1.6rem',
                opacity: 0.85,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <span>{stageDescription}</span>
              {scoreboard?.scheduleCode ? (
                <span style={{ fontSize: '1.1rem', opacity: 0.7, letterSpacing: '0.12em' }}>
                  Matchcode {scoreboard.scheduleCode}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <Scoreboard score={score} teamNames={teamNames} />

      <Timer
        time={formattedRemaining}
        isRunning={Boolean(scoreboard?.isRunning)}
        extraTime={extraExpected}
        extraElapsed={extraElapsed}
        halftimeAt={halftimeFormatted}
        half={currentHalf}
        isHalftimeBreak={isHalftimeBreak}
        halftimeBreakRemaining={halftimeBreakRemaining}
        isExtraTime={isExtraTime}
      />

      <PenaltiesSection penalties={penalties} teamNames={teamNames} />

      <StandingsSection
        visible={showStandingsSection}
        meta={standingsMeta}
        loading={standingsLoading}
        error={standingsError}
        standings={standings}
      />
    </div>
  );
}
