import Scoreboard from '../Scoreboard.jsx';
import Timer from '../Timer.jsx';
import PenaltiesSection from '../scoreboard/PenaltiesSection.jsx';
import StandingsSection from '../scoreboard/StandingsSection.jsx';
import TournamentSummaryView from '../summary/TournamentSummaryView.jsx';
import useLocalTimer from '../../hooks/useLocalTimer.js';
import useMediaQuery from '../../hooks/useMediaQuery.js';
import { formatStageDescription, formatTime } from '../../utils/formatting.js';

export default function ScoreboardPage({
  scoreboard,
  error,
  standings,
  standingsMeta,
  standingsError,
  standingsLoading,
  tournamentSummary,
  summaryError,
  summaryLoading
}) {
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const isMobile = useMediaQuery('(max-width: 720px)');
  const { remainingSeconds, extraElapsedSeconds, halftimePauseRemaining } = useLocalTimer(scoreboard);
  const score = {
    teamA: scoreboard?.scoreA ?? 0,
    teamB: scoreboard?.scoreB ?? 0
  };

  const teamNames = {
    teamA: scoreboard?.teamAName ?? 'Team A',
    teamB: scoreboard?.teamBName ?? 'Team B'
  };

  const formattedRemaining = formatTime(remainingSeconds);
  const extraExpected =
    scoreboard && (scoreboard.extraSeconds ?? 0) !== 0 ? formatTime(scoreboard.extraSeconds ?? 0) : null;
  const extraElapsed = extraElapsedSeconds > 0 ? formatTime(extraElapsedSeconds) : null;
  const halftimeFormatted =
    scoreboard?.halftimeSeconds ? formatTime(scoreboard.halftimeSeconds) : null;
  const isHalftimeBreak = Boolean(scoreboard?.isHalftimeBreak);
  const halftimeBreakRemaining = isHalftimeBreak
    ? formatTime(halftimePauseRemaining)
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

  if (scoreboard?.tournamentCompleted) {
    return (
      <TournamentSummaryView
        scoreboard={scoreboard}
        summary={tournamentSummary}
        loading={summaryLoading}
        error={summaryError}
      />
    );
  }

  const containerStyle = {
    width: '100%',
    maxWidth: '1600px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isCompact ? 'stretch' : 'center',
    padding: isMobile
      ? '1.5rem clamp(0.75rem, 4vw, 1.5rem)'
      : isCompact
        ? '2rem clamp(1rem, 4vw, 2.25rem)'
        : '2.5rem 3rem',
    gap: isMobile ? '1.5rem' : '2.2rem',
    boxSizing: 'border-box',
    color: '#ffffff'
  };

  const titleFontSize = isMobile ? '2.8rem' : isCompact ? '3.8rem' : '4.5rem';
  const tournamentFontSize = isMobile ? '1.8rem' : isCompact ? '2.1rem' : '2.4rem';
  const stageFontSize = isMobile ? '1.2rem' : isCompact ? '1.4rem' : '1.6rem';
  const matchcodeFontSize = isMobile ? '0.9rem' : '1.1rem';

  return (
    <div style={containerStyle}>
      <header style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: titleFontSize,
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
                fontSize: tournamentFontSize,
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
                fontSize: stageFontSize,
                opacity: 0.85,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <span>{stageDescription}</span>
              {scoreboard?.scheduleCode ? (
                <span style={{ fontSize: matchcodeFontSize, opacity: 0.7, letterSpacing: '0.12em' }}>
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
