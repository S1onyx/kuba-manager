import { useMemo } from 'react';
import DisplayLayout from './components/layout/DisplayLayout.jsx';
import FullscreenToggle from './components/FullscreenToggle.jsx';
import BracketPage from './components/pages/BracketPage.jsx';
import ScoreboardPage from './components/pages/ScoreboardPage.jsx';
import useBodyScrollLock from './hooks/useBodyScrollLock.js';
import useDisplayScaling from './hooks/useDisplayScaling.js';
import useScoreboardData from './hooks/useScoreboardData.js';
import useStandingsData from './hooks/useStandingsData.js';
import useStructureData from './hooks/useStructureData.js';

export default function App() {
  useBodyScrollLock();

  const { scoreboard, error: scoreboardError } = useScoreboardData();
  const displayView = scoreboard?.displayView ?? 'scoreboard';

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
  } = useStructureData(scoreboard, displayView);

  const scaleDependencies = useMemo(
    () => [
      displayView,
      scoreboard?.lastUpdated,
      structure?.tournament?.id,
      structure?.groups?.length,
      structure?.schedule?.knockout?.length,
      structure?.schedule?.placement?.length,
      recordedGamesCount
    ],
    [
      displayView,
      scoreboard?.lastUpdated,
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
    displayView === 'bracket' ? (
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
      />
    );

  return (
    <DisplayLayout
      rootRef={rootRef}
      contentRef={contentRef}
      scale={scale}
      overlay={<FullscreenToggle auto={autoFullscreen} />}
    >
      {activeContent}
    </DisplayLayout>
  );
}
