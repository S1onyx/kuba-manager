import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const isCompact = useMediaQuery('(max-width: 1100px)');
  const isMobile = useMediaQuery('(max-width: 720px)');
  const { remainingSeconds, extraElapsedSeconds, halftimePauseRemaining } = useLocalTimer(scoreboard);
  const score = {
    teamA: scoreboard?.scoreA ?? 0,
    teamB: scoreboard?.scoreB ?? 0
  };

  const teamNames = {
    teamA: scoreboard?.teamAName ?? t('scoreboard.teamA'),
    teamB: scoreboard?.teamBName ?? t('scoreboard.teamB')
  };

  const formattedRemaining = formatTime(remainingSeconds);
  const extraExpected =
    scoreboard && (scoreboard.extraSeconds ?? 0) !== 0 ? formatTime(scoreboard.extraSeconds ?? 0) : null;
  const extraElapsed = extraElapsedSeconds > 0 ? formatTime(extraElapsedSeconds) : null;
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
  const stageDescription = formatStageDescription(scoreboard?.stageType, stageLabel, t);
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
    position: 'relative',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: isMobile ? '1.5rem 1rem' : isCompact ? '2rem 1.5rem' : '2.5rem 2rem',
    gap: isMobile ? '1.5rem' : '2.25rem',
    boxSizing: 'border-box',
    color: '#ffffff'
  };

  const halfBadgeFontSize = isMobile ? '1.3rem' : isCompact ? '1.6rem' : '1.9rem';
  const titleFontSize = isMobile ? '2.6rem' : isCompact ? '3.4rem' : '4rem';
  const tournamentFontSize = isMobile ? '1.1rem' : isCompact ? '1.35rem' : '1.6rem';
  const matchcodeFontSize = isMobile ? '0.85rem' : '1rem';

  const hasHeader = Boolean(stageDescription || tournamentName || scoreboard?.scheduleCode || error);

  return (
    <div style={containerStyle}>
      {/* Half badge: centered pill in normal flow → never covered, never shifts the axis */}
      <div
        style={{
          alignSelf: 'center',
          padding: isMobile ? '0.3rem 0.9rem' : '0.4rem 1.2rem',
          borderRadius: '999px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.18)',
          fontSize: halfBadgeFontSize,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textShadow: '0 2px 12px rgba(0,0,0,0.7)'
        }}
      >
        {t('scoreboard.halfBadge', { half: currentHalf })}
      </div>

      {hasHeader ? (
        <header style={{ textAlign: 'center', width: '100%' }}>
          {tournamentName ? (
            <p
              style={{
                margin: 0,
                marginBottom: stageDescription ? '0.35rem' : 0,
                fontSize: tournamentFontSize,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.7,
                fontWeight: 500
              }}
            >
              {tournamentName}
            </p>
          ) : null}
          {stageDescription ? (
            <h1
              style={{
                margin: 0,
                marginBottom: scoreboard?.scheduleCode ? '0.35rem' : 0,
                fontSize: titleFontSize,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
                lineHeight: 1.1
              }}
            >
              {stageDescription}
            </h1>
          ) : null}
          {scoreboard?.scheduleCode ? (
            <p style={{ margin: 0, fontSize: matchcodeFontSize, opacity: 0.55, letterSpacing: '0.12em' }}>
              {scoreboard.scheduleCode}
            </p>
          ) : null}
          {error ? (
            <p style={{ margin: 0, marginTop: '0.5rem', color: '#ff8a80', fontSize: '1.1rem' }}>{error}</p>
          ) : null}
        </header>
      ) : null}

      <Scoreboard score={score} teamNames={teamNames} />

      <Timer
        time={formattedRemaining}
        isRunning={Boolean(scoreboard?.isRunning)}
        extraTime={extraExpected}
        extraElapsed={extraElapsed}
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
