import { useEffect, useMemo, useState } from 'react';
import DisplayLayout from './components/layout/DisplayLayout.jsx';
import FullscreenToggle from './components/FullscreenToggle.jsx';
import DisplayViewToggle from './components/DisplayViewToggle.jsx';
import BracketPage from './components/pages/BracketPage.jsx';
import ScoreboardPage from './components/pages/ScoreboardPage.jsx';
import useBodyScrollLock from './hooks/useBodyScrollLock.js';
import useDisplayScaling from './hooks/useDisplayScaling.js';
import useScoreboardData from './hooks/useScoreboardData.js';
import useStandingsData from './hooks/useStandingsData.js';
import useStructureData from './hooks/useStructureData.js';
import useTournamentSummaryData from './hooks/useTournamentSummaryData.js';

export default function App() {
  useBodyScrollLock();

  const { scoreboard, error: scoreboardError } = useScoreboardData();
  const displayView = scoreboard?.displayView ?? 'scoreboard';
  const [mirrorMode, setMirrorMode] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const stored = window.localStorage.getItem('kuba-display-mirror');
      setMirrorMode(stored === '1');
    } catch (error) {
      console.warn('Konnte Mirror-Mode nicht laden:', error);
    }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (mirrorMode) {
        window.localStorage.setItem('kuba-display-mirror', '1');
      } else {
        window.localStorage.removeItem('kuba-display-mirror');
      }
    } catch (error) {
      console.warn('Konnte Mirror-Mode nicht speichern:', error);
    }
  }, [mirrorMode]);
  const [fullscreenActive, setFullscreenActive] = useState(() =>
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  );

  const normalizedView = displayView === 'bracket' ? 'bracket' : 'scoreboard';
  const effectiveDisplayView =
    mirrorMode && (normalizedView === 'bracket' || normalizedView === 'scoreboard')
      ? normalizedView === 'bracket'
        ? 'scoreboard'
        : 'bracket'
      : normalizedView;

  const {
    standings,
    meta: standingsMeta,
    error: standingsError,
    loading: standingsLoading,
    recordedGamesCount
  } = useStandingsData(scoreboard);

  const {
    structure,
    error: structureError,
    loading: structureLoading
  } = useStructureData(scoreboard, effectiveDisplayView);

  const {
    summary: tournamentSummary,
    error: tournamentSummaryError,
    loading: tournamentSummaryLoading
  } = useTournamentSummaryData(scoreboard);

  const scaleDependencies = useMemo(
    () => [
      effectiveDisplayView,
      structure?.tournament?.id,
      structure?.groups?.length,
      structure?.schedule?.knockout?.length,
      structure?.schedule?.placement?.length,
      recordedGamesCount
    ],
    [
      effectiveDisplayView,
      structure?.tournament?.id,
      structure?.groups?.length,
      structure?.schedule?.knockout?.length,
      structure?.schedule?.placement?.length,
      recordedGamesCount
    ]
  );

  const { rootRef, contentRef, scale } = useDisplayScaling(scaleDependencies);

  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const autoFullscreen = searchParams?.has('fullscreen');

  const activeContent =
    effectiveDisplayView === 'bracket' ? (
      <BracketPage
        scoreboard={scoreboard}
        error={scoreboardError}
        structure={structure}
        structureError={structureError}
        structureLoading={structureLoading}
      />
    ) : (
      <ScoreboardPage
        scoreboard={scoreboard}
        error={scoreboardError}
        standings={standings}
        standingsMeta={standingsMeta}
        standingsError={standingsError}
        standingsLoading={standingsLoading}
        tournamentSummary={tournamentSummary}
        summaryError={tournamentSummaryError}
        summaryLoading={tournamentSummaryLoading}
      />
    );

  const overlayControls = fullscreenActive ? null : (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      <DisplayViewToggle displayView={displayView} />
      <button
        type="button"
        onClick={() => setMirrorMode((prev) => !prev)}
        style={{
          padding: '0.55rem 1rem',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.3)',
          background: mirrorMode ? 'rgba(148, 77, 255, 0.4)' : 'rgba(0, 0, 0, 0.45)',
          color: '#fff',
          fontSize: '0.85rem',
          letterSpacing: '0.04em',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)'
        }}
      >
        {mirrorMode ? 'Display 2 (invertiert)' : 'Display 1 (Standard)'}
      </button>
      <FullscreenToggle
        auto={autoFullscreen}
        fixed={false}
        onChange={(value) => setFullscreenActive(Boolean(value))}
      />
    </div>
  );

  return (
    <DisplayLayout rootRef={rootRef} contentRef={contentRef} scale={scale} overlay={overlayControls}>
      {activeContent}
    </DisplayLayout>
  );
}
