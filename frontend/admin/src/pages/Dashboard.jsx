import { useMemo, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout.jsx';
import ScoreboardSummary from '../components/dashboard/ScoreboardSummary.jsx';
import SidebarNavigation from '../components/dashboard/SidebarNavigation.jsx';
import ControlTab from '../components/dashboard/ControlTab.jsx';
import AudioTab from '../components/dashboard/AudioTab.jsx';
import HistoryTab from '../components/dashboard/HistoryTab.jsx';
import PlayersTab from '../components/dashboard/PlayersTab.jsx';
import TeamsTab from '../components/dashboard/TeamsTab.jsx';
import TournamentsTab from '../components/dashboard/TournamentsTab.jsx';
import ScheduleTab from '../components/dashboard/ScheduleTab.jsx';
import useFeedback from '../hooks/useFeedback.js';
import useScoreboardCore from '../hooks/useScoreboardCore.js';
import useMatchContext from '../hooks/useMatchContext.js';
import useScheduleManager from '../hooks/useScheduleManager.js';
import useHistoryManager from '../hooks/useHistoryManager.js';
import useTeamManager from '../hooks/useTeamManager.js';
import usePlayerManager from '../hooks/usePlayerManager.js';
import useTournamentManager from '../hooks/useTournamentManager.js';
import useTournamentStructure from '../hooks/useTournamentStructure.js';
import useAudioManager from '../hooks/useAudioManager.js';
import { DashboardProvider } from '../context/DashboardContext.jsx';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('control');
  const feedback = useFeedback();

  const scoreboardCtrl = useScoreboardCore({ updateMessage: feedback.updateMessage });
  const matchContext = useMatchContext({
    scoreboard: scoreboardCtrl.scoreboard,
    updateMessage: feedback.updateMessage,
    setScoreboard: scoreboardCtrl.setScoreboard
  });
  const teamManager = useTeamManager({ updateMessage: feedback.updateMessage });
  const tournamentManager = useTournamentManager({
    scoreboard: scoreboardCtrl.scoreboard,
    updateMessage: feedback.updateMessage,
    setScoreboard: scoreboardCtrl.setScoreboard,
    setContextForm: matchContext.setContextForm,
    setContextFormDirty: matchContext.setContextFormDirty
  });
  const tournamentStructure = useTournamentStructure({
    expandedTournamentId: tournamentManager.expandedTournamentId,
    teams: teamManager.teams,
    updateMessage: feedback.updateMessage
  });
  const scheduleManager = useScheduleManager({
    resolvedTournamentId: matchContext.resolvedTournamentId,
    scoreboard: scoreboardCtrl.scoreboard,
    initializeStateFromScoreboard: scoreboardCtrl.initializeStateFromScoreboard,
    setTeamDirty: scoreboardCtrl.setTeamDirty,
    setPenaltyForms: scoreboardCtrl.setPenaltyForms,
    setManualDirty: scoreboardCtrl.setManualDirty,
    setContextForm: matchContext.setContextForm,
    setContextFormDirty: matchContext.setContextFormDirty,
    updateMessage: feedback.updateMessage
  });
  const historyManager = useHistoryManager({ updateMessage: feedback.updateMessage });
  const playerManager = usePlayerManager({
    updateMessage: feedback.updateMessage,
    refreshActiveTeams: scoreboardCtrl.refreshActiveTeams
  });
  const audioManager = useAudioManager({ updateMessage: feedback.updateMessage });

  const contextValue = useMemo(
    () => ({
      feedback,
      ui: { activeTab, setActiveTab },
      scoreboard: {
        scoreboard: scoreboardCtrl.scoreboard,
        displayViewPending: scoreboardCtrl.displayViewPending,
        teamForm: scoreboardCtrl.teamForm,
        teamDirty: scoreboardCtrl.teamDirty,
        manualScores: scoreboardCtrl.manualScores,
        manualDirty: scoreboardCtrl.manualDirty,
        selectedScorer: scoreboardCtrl.selectedScorer,
        timerInput: scoreboardCtrl.timerInput,
        submittingTimer: scoreboardCtrl.submittingTimer,
        penaltyForms: scoreboardCtrl.penaltyForms,
        halftimeInput: scoreboardCtrl.halftimeInput,
        halftimePauseInput: scoreboardCtrl.halftimePauseInput,
        extraTimeInput: scoreboardCtrl.extraTimeInput,
        handleTeamInputChange: scoreboardCtrl.handleTeamInputChange,
        handleTeamSelectChange: scoreboardCtrl.handleTeamSelectChange,
        handleTeamSubmit: scoreboardCtrl.handleTeamSubmit,
        handleScore: scoreboardCtrl.handleScore,
        handleManualScoreChange: scoreboardCtrl.handleManualScoreChange,
        handleManualScoreSubmit: scoreboardCtrl.handleManualScoreSubmit,
        handleResetScores: scoreboardCtrl.handleResetScores,
        handlePenaltyFormChange: scoreboardCtrl.handlePenaltyFormChange,
        handlePenaltySubmit: scoreboardCtrl.handlePenaltySubmit,
        handlePenaltyRemove: scoreboardCtrl.handlePenaltyRemove,
        handleHalftimeSubmit: scoreboardCtrl.handleHalftimeSubmit,
        handleHalftimePauseSubmit: scoreboardCtrl.handleHalftimePauseSubmit,
        handleExtraTimeSubmit: scoreboardCtrl.handleExtraTimeSubmit,
        handleExtraTimeAdjust: scoreboardCtrl.handleExtraTimeAdjust,
        handleTimerSubmit: scoreboardCtrl.handleTimerSubmit,
        handleStart: scoreboardCtrl.handleStart,
        handlePause: scoreboardCtrl.handlePause,
        handleFinishGame: scoreboardCtrl.handleFinishGame,
        handleSaveGame: scoreboardCtrl.handleSaveGame,
        handleNewGame: scoreboardCtrl.handleNewGame
      },
      scoreboardState: {
        setSelectedScorer: scoreboardCtrl.setSelectedScorer,
        setTimerInput: scoreboardCtrl.setTimerInput,
        setHalftimeInput: scoreboardCtrl.setHalftimeInput,
        setHalftimePauseInput: scoreboardCtrl.setHalftimePauseInput,
        setExtraTimeInput: scoreboardCtrl.setExtraTimeInput,
        setHalftimeDirty: scoreboardCtrl.setHalftimeDirty,
        setHalftimePauseDirty: scoreboardCtrl.setHalftimePauseDirty,
        setExtraDirty: scoreboardCtrl.setExtraDirty,
        setTeamDirty: scoreboardCtrl.setTeamDirty,
        setManualDirty: scoreboardCtrl.setManualDirty,
        setPenaltyForms: scoreboardCtrl.setPenaltyForms
      },
      scoreboardActions: {
        handleDisplayViewChange: scoreboardCtrl.handleDisplayViewChange
      },
      scoreboardMeta: {
        formattedRemaining: scoreboardCtrl.formattedRemaining,
        statusLabel: scoreboardCtrl.statusLabel,
        liveStateLabel: scoreboardCtrl.liveStateLabel
      },
      matchContext,
      schedule: scheduleManager,
      teams: { ...teamManager },
      players: { ...playerManager },
      tournaments: { ...tournamentManager },
      tournamentStructure: { ...tournamentStructure },
      audio: { ...audioManager },
      history: { ...historyManager }
    }),
    [
      feedback,
      activeTab,
      scoreboardCtrl,
      matchContext,
      scheduleManager,
      teamManager,
      playerManager,
      tournamentManager,
      tournamentStructure,
      audioManager,
      historyManager
    ]
  );

  if (scoreboardCtrl.loading && !scoreboardCtrl.scoreboard) {
    return <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Lade Scoreboard...</p>;
  }

  return (
    <DashboardProvider value={contextValue}>
      <AdminLayout
        sidebar={
          <SidebarNavigation
            activeTab={activeTab}
            onSelect={setActiveTab}
            scoreboard={scoreboardCtrl.scoreboard}
            formattedRemaining={scoreboardCtrl.formattedRemaining}
            liveStateLabel={scoreboardCtrl.liveStateLabel}
            error={feedback.error}
            info={feedback.info}
          />
        }
        header={
          scoreboardCtrl.scoreboard ? (
            <ScoreboardSummary
              scoreboard={scoreboardCtrl.scoreboard}
              formattedRemaining={scoreboardCtrl.formattedRemaining}
              liveStateLabel={scoreboardCtrl.liveStateLabel}
              onToggleDisplayView={scoreboardCtrl.handleDisplayViewChange}
              displayViewPending={scoreboardCtrl.displayViewPending}
            />
          ) : null
        }
      >
        {activeTab === 'control' ? (
          <ControlTab />
        ) : activeTab === 'schedule' ? (
          <ScheduleTab />
        ) : activeTab === 'audio' ? (
          <AudioTab />
        ) : activeTab === 'history' ? (
          <HistoryTab />
        ) : activeTab === 'players' ? (
          <PlayersTab />
        ) : activeTab === 'teams' ? (
          <TeamsTab />
        ) : (
          <TournamentsTab />
        )}
      </AdminLayout>
    </DashboardProvider>
  );
}
