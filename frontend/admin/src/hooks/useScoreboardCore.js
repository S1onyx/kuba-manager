import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket.js';
import {
  addPenalty,
  finishGame,
  mutateScore,
  pauseScoreboardTimer,
  removePenalty,
  resetScoreboard,
  saveCurrentGame,
  setDisplayView,
  setExtraTime,
  setHalftime,
  setHalftimePause,
  setScoreAbsolute,
  setScoreboardTimer,
  startNewGame,
  startScoreboardTimer,
  updateTeams,
  fetchScoreboard
} from '../utils/api.js';
import { createPenaltyForms } from '../utils/forms.js';
import { formatTime, parseTimerInput } from '../utils/formatters.js';
import { formatApiError } from '../utils/apiError.js';

export default function useScoreboardCore({ updateMessage }) {
  const { t } = useTranslation();
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamForm, setTeamForm] = useState({ teamAName: '', teamBName: '', teamAId: '', teamBId: '' });
  const [teamDirty, setTeamDirty] = useState(false);
  const [manualScores, setManualScores] = useState({ a: '', b: '' });
  const [manualDirty, setManualDirty] = useState({ a: false, b: false });
  const [selectedScorer, setSelectedScorer] = useState({ a: '', b: '' });
  const [timerInput, setTimerInput] = useState('');
  const [submittingTimer, setSubmittingTimer] = useState(false);
  const [penaltyForms, setPenaltyForms] = useState(createPenaltyForms);
  const [halftimeInput, setHalftimeInput] = useState('');
  const [halftimePauseInput, setHalftimePauseInput] = useState('');
  const [extraTimeInput, setExtraTimeInput] = useState('');
  const [halftimeDirty, setHalftimeDirty] = useState(false);
  const [halftimePauseDirty, setHalftimePauseDirty] = useState(false);
  const [extraDirty, setExtraDirty] = useState(false);
  const [displayViewPending, setDisplayViewPending] = useState(false);

  const initializeStateFromScoreboard = useCallback(
    (data) => {
      setScoreboard(data);
      setTeamForm({
        teamAName: data.teamAName ?? '',
        teamBName: data.teamBName ?? '',
        teamAId: data.teamAId ? String(data.teamAId) : '',
        teamBId: data.teamBId ? String(data.teamBId) : ''
      });
      setManualScores({
        a: String(data.scoreA ?? 0),
        b: String(data.scoreB ?? 0)
      });
      setManualDirty({ a: false, b: false });
      setPenaltyForms(createPenaltyForms());
      setHalftimeInput(formatTime(data.halftimeSeconds ?? 0));
      setHalftimePauseInput(formatTime(data.halftimePauseSeconds ?? 0));
      setExtraTimeInput(formatTime(data.extraSeconds ?? 0));
      setHalftimeDirty(false);
      setHalftimePauseDirty(false);
      setExtraDirty(false);
    },
    []
  );

  useEffect(() => {
    let active = true;

    fetchScoreboard()
      .then((data) => {
        if (!active) return;
        initializeStateFromScoreboard(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        updateMessage('error', t('feedback.scoreboardLoadFailed'));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initializeStateFromScoreboard, updateMessage, t]);

  useEffect(() => {
    const handleUpdate = (payload) => {
      setScoreboard(payload);

      if (!teamDirty) {
        setTeamForm({
          teamAName: payload.teamAName ?? '',
          teamBName: payload.teamBName ?? '',
          teamAId: payload.teamAId ? String(payload.teamAId) : '',
          teamBId: payload.teamBId ? String(payload.teamBId) : ''
        });
      }

      if (!halftimeDirty) {
        setHalftimeInput(formatTime(payload.halftimeSeconds ?? 0));
      }

      if (!halftimePauseDirty) {
        setHalftimePauseInput(formatTime(payload.halftimePauseSeconds ?? 0));
      }

      if (!extraDirty) {
        setExtraTimeInput(formatTime(payload.extraSeconds ?? 0));
      }

      setManualScores((prev) => {
        let next = prev;
        if (!manualDirty.a) {
          const target = String(payload.scoreA ?? 0);
          if (prev.a !== target) {
            next = next === prev ? { ...prev } : next;
            next.a = target;
          }
        }
        if (!manualDirty.b) {
          const target = String(payload.scoreB ?? 0);
          if (prev.b !== target) {
            next = next === prev ? { ...prev } : next;
            next.b = target;
          }
        }
        return next;
      });

      setSelectedScorer((prev) => {
        const next = { ...prev };
        ['a', 'b'].forEach((teamKey) => {
          const roster = payload.players?.[teamKey] ?? [];
          if (!roster.some((player) => String(player.playerId) === String(prev[teamKey]))) {
            next[teamKey] = '';
          }
        });
        return next;
      });

      setPenaltyForms((prev) => ({
        a: {
          ...prev.a,
          playerId:
            prev.a.playerId &&
            (payload.players?.a ?? []).some((player) => String(player.playerId) === String(prev.a.playerId))
              ? prev.a.playerId
              : ''
        },
        b: {
          ...prev.b,
          playerId:
            prev.b.playerId &&
            (payload.players?.b ?? []).some((player) => String(player.playerId) === String(prev.b.playerId))
              ? prev.b.playerId
              : ''
        }
      }));
    };

    socket.on('scoreboard:update', handleUpdate);
    return () => socket.off('scoreboard:update', handleUpdate);
  }, [teamDirty, halftimeDirty, halftimePauseDirty, extraDirty, manualDirty]);

  const handleTeamInputChange = useCallback((field, value) => {
    setTeamDirty(true);
    setTeamForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'teamAName') {
        next.teamAId = '';
      } else if (field === 'teamBName') {
        next.teamBId = '';
      }
      return next;
    });
  }, []);

  const handleTeamSelectChange = useCallback((field, value, teams) => {
    setTeamDirty(true);
    setTeamForm((prev) => {
      const next = { ...prev, [field]: value };
      if (value) {
        const match = teams.find((team) => String(team.id) === value);
        if (field === 'teamAId' && match) {
          next.teamAName = match.name;
        }
        if (field === 'teamBId' && match) {
          next.teamBName = match.name;
        }
      }
      return next;
    });
  }, []);

  const handleTeamSubmit = useCallback(
    async () => {
      const payload = {};

      if (teamForm.teamAId) {
        const numeric = Number(teamForm.teamAId);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          updateMessage('error', t('feedback.invalidSelectionTeamA'));
          return false;
        }
        payload.teamAId = numeric;
      } else if (teamForm.teamAName.trim()) {
        payload.teamAName = teamForm.teamAName;
      }

      if (teamForm.teamBId) {
        const numeric = Number(teamForm.teamBId);
        if (!Number.isInteger(numeric) || numeric <= 0) {
          updateMessage('error', t('feedback.invalidSelectionTeamB'));
          return false;
        }
        payload.teamBId = numeric;
      } else if (teamForm.teamBName.trim()) {
        payload.teamBName = teamForm.teamBName;
      }

      if (Object.keys(payload).length === 0) {
        updateMessage('error', t('feedback.teamRequired'));
        return false;
      }

      try {
        await updateTeams(payload);
        setTeamDirty(false);
        updateMessage('info', t('feedback.teamNamesUpdated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.teamNamesUpdateFailed'));
        return false;
      }
    },
    [teamForm, updateMessage, t]
  );

  const handleScore = useCallback(
    async (team, points) => {
      const teamKey = team === 'b' ? 'b' : 'a';
      const selected = selectedScorer[teamKey];
      const payload = {};

      if (selected) {
        payload.playerId = Number(selected);
      }

      if (points > 0) {
        payload.shotType = points === 3 ? 'three' : points === 2 ? 'field' : 'free';
      } else if (!selected) {
        payload.affectStats = false;
      }

      try {
        await mutateScore(team, points, payload);
        const roster = scoreboard?.players?.[teamKey] ?? [];
        const playerName = selected
          ? roster.find((player) => String(player.playerId) === String(selected))?.name ?? null
          : null;
        const signedPoints = `${points > 0 ? '+' : ''}${points}`;
        const teamName = team.toUpperCase();
        updateMessage('info', playerName
          ? t('feedback.pointsScoredBy', { points: signedPoints, team: teamName, player: playerName })
          : t('feedback.pointsScored', { points: signedPoints, team: teamName }));
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.pointsUpdateFailed'));
      }
    },
    [scoreboard?.players, selectedScorer, updateMessage, t]
  );

  const handleManualScoreChange = useCallback((team, value) => {
    setManualScores((prev) => ({ ...prev, [team]: value }));
    setManualDirty((prev) => ({ ...prev, [team]: true }));
  }, []);

  const handleManualScoreSubmit = useCallback(
    async (team) => {
      const rawValue = manualScores[team];
      const numeric = Number(rawValue);

      if (!Number.isFinite(numeric) || numeric < 0) {
        updateMessage('error', t('feedback.invalidScoreValue'));
        return false;
      }

      try {
        await setScoreAbsolute(team, Math.trunc(numeric));
        setManualDirty((prev) => ({ ...prev, [team]: false }));
        updateMessage('info', t('feedback.scoreSet', { team: team.toUpperCase() }));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.scoreSetFailed'));
        return false;
      }
    },
    [manualScores, updateMessage, t]
  );

  const handleResetScores = useCallback(async () => {
    try {
      await resetScoreboard();
      setManualDirty({ a: false, b: false });
      updateMessage('info', t('feedback.scoresReset'));
    } catch (err) {
      console.error(err);
      updateMessage('error', formatApiError(err, t, 'feedback.scoresResetFailed'));
    }
  }, [updateMessage, t]);

  const handlePenaltyFormChange = useCallback((teamKey, field, value) => {
    setPenaltyForms((prev) => ({
      ...prev,
      [teamKey]: { ...prev[teamKey], [field]: value }
    }));
  }, []);

  const resolvePenaltyDuration = useCallback((form) => {
    if (form.preset === 'custom') {
      return parseTimerInput(form.custom);
    }
    const presetSeconds = Number(form.preset);
    if (!Number.isFinite(presetSeconds) || presetSeconds <= 0) {
      return null;
    }
    return presetSeconds;
  }, []);

  const handlePenaltySubmit = useCallback(
    async (teamKey) => {
      const form = penaltyForms[teamKey];
      const seconds = resolvePenaltyDuration(form);

      if (seconds === null || seconds <= 0) {
        updateMessage('error', t('feedback.invalidPenaltyTime'));
        return false;
      }

      try {
        await addPenalty(teamKey, form.name, seconds, {
          playerId: form.playerId ? Number(form.playerId) : undefined
        });
        setPenaltyForms((prev) => ({
          ...prev,
          [teamKey]: { name: '', preset: '60', custom: '', playerId: '' }
        }));
        updateMessage('info', t('feedback.penaltyAdded', { team: teamKey.toUpperCase() }));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.penaltyAddFailed'));
        return false;
      }
    },
    [penaltyForms, resolvePenaltyDuration, updateMessage, t]
  );

  const handlePenaltyRemove = useCallback(
    async (id) => {
      try {
        await removePenalty(id);
        updateMessage('info', t('feedback.penaltyRemoved'));
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.penaltyRemoveFailed'));
      }
    },
    [updateMessage, t]
  );

  const handleHalftimeSubmit = useCallback(
    async (value) => {
      const seconds = parseTimerInput(value);
      if (seconds === null || seconds < 0) {
        updateMessage('error', t('feedback.invalidHalftime'));
        return false;
      }

      try {
        await setHalftime(seconds);
        setHalftimeDirty(false);
        updateMessage('info', t('feedback.halftimeUpdated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.halftimeUpdateFailed'));
        return false;
      }
    },
    [updateMessage, t]
  );

  const handleHalftimePauseSubmit = useCallback(
    async (value) => {
      const seconds = parseTimerInput(value);
      if (seconds === null || seconds < 0) {
        updateMessage('error', t('feedback.invalidHalftimePause'));
        return false;
      }

      try {
        await setHalftimePause(seconds);
        setHalftimePauseDirty(false);
        updateMessage('info', t('feedback.halftimePauseUpdated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.halftimePauseUpdateFailed'));
        return false;
      }
    },
    [updateMessage, t]
  );

  const handleExtraTimeSubmit = useCallback(
    async (value) => {
      const seconds = parseTimerInput(value);
      if (seconds === null || seconds < 0) {
        updateMessage('error', t('feedback.invalidExtraTime'));
        return false;
      }

      try {
        await setExtraTime(seconds);
        setExtraDirty(false);
        updateMessage('info', t('feedback.extraTimeUpdated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.extraTimeUpdateFailed'));
        return false;
      }
    },
    [updateMessage, t]
  );

  const handleExtraTimeAdjust = useCallback(
    async (deltaSeconds) => {
      if (!scoreboard) {
        return false;
      }

      const delta = Number(deltaSeconds);
      if (!Number.isFinite(delta) || delta === 0) {
        return false;
      }

      const current = Number(scoreboard.extraSeconds ?? 0);
      const nextValue = Math.max(0, current + delta);
      if (nextValue === current) {
        return false;
      }

      try {
        await setExtraTime(nextValue);
        setExtraDirty(false);
        setExtraTimeInput(formatTime(nextValue));
        updateMessage('info', t('feedback.extraTimeSet', { time: formatTime(nextValue) }));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.extraTimeUpdateFailed'));
        return false;
      }
    },
    [scoreboard, updateMessage, setExtraDirty, setExtraTimeInput, t]
  );

  const handleTimerSubmit = useCallback(
    async (value) => {
      const seconds = parseTimerInput(value);
      if (seconds === null) {
        updateMessage('error', t('feedback.invalidTime'));
        return false;
      }

      try {
        setSubmittingTimer(true);
        await setScoreboardTimer(seconds);
        setTimerInput('');
        updateMessage('info', t('feedback.timerUpdated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.timerUpdateFailed'));
        return false;
      } finally {
        setSubmittingTimer(false);
      }
    },
    [updateMessage, t]
  );

  const handleStart = useCallback(async () => {
    try {
      await startScoreboardTimer();
    } catch (err) {
      console.error(err);
      updateMessage('error', formatApiError(err, t, 'feedback.timerStartFailed'));
    }
  }, [updateMessage, t]);

  const handlePause = useCallback(async () => {
    try {
      await pauseScoreboardTimer();
    } catch (err) {
      console.error(err);
      updateMessage('error', formatApiError(err, t, 'feedback.timerPauseFailed'));
    }
  }, [updateMessage, t]);

  const handleFinishGame = useCallback(async () => {
    try {
      const nextState = await finishGame();
      if (nextState && typeof nextState === 'object') {
        setScoreboard(nextState);
      }
      setManualDirty({ a: false, b: false });
      updateMessage('info', t('feedback.gameFinished'));
      return true;
    } catch (err) {
      console.error(err);
      updateMessage('error', formatApiError(err, t, 'feedback.gameFinishFailed'));
      return false;
    }
  }, [updateMessage, t]);

  const handleSaveGame = useCallback(
    async ({ onSaved } = {}) => {
      if (scoreboard?.isRunning) {
        updateMessage('error', t('feedback.gameStillRunning'));
        return false;
      }

      if (!window.confirm(t('feedback.confirmSaveGame'))) {
        return false;
      }

      try {
        await saveCurrentGame();
        updateMessage('info', t('feedback.gameSaved'));
        onSaved?.();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.gameSaveFailed'));
        return false;
      }
    },
    [scoreboard?.isRunning, updateMessage, t]
  );

  const handleNewGame = useCallback(
    async ({ onReset } = {}) => {
      try {
        const newState = await startNewGame();
        initializeStateFromScoreboard(newState);
        setTeamDirty(false);
        setManualDirty({ a: false, b: false });
        setPenaltyForms(createPenaltyForms());
        setTimerInput('');
        updateMessage('info', t('feedback.newGamePrepared'));
        onReset?.();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.newGameFailed'));
        return false;
      }
    },
    [initializeStateFromScoreboard, updateMessage, t]
  );

  const handleDisplayViewChange = useCallback(
    async (targetView) => {
      const normalized = typeof targetView === 'string' ? targetView : '';
      if (!normalized || scoreboard?.displayView === normalized) {
        return;
      }

      setDisplayViewPending(true);
      try {
        await setDisplayView(normalized);
        updateMessage('info', normalized === 'scoreboard'
          ? t('feedback.displayNowScoreboard')
          : t('feedback.displayNowBracket'));
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.displayUpdateFailed'));
      } finally {
        setDisplayViewPending(false);
      }
    },
    [scoreboard?.displayView, updateMessage, t]
  );


  const refreshActiveTeams = useCallback(async () => {
    if (!scoreboard) {
      return;
    }

    const payload = {};
    if (scoreboard.teamAId) {
      payload.teamAId = scoreboard.teamAId;
    } else if (scoreboard.teamAName) {
      payload.teamAName = scoreboard.teamAName;
    }

    if (scoreboard.teamBId) {
      payload.teamBId = scoreboard.teamBId;
    } else if (scoreboard.teamBName) {
      payload.teamBName = scoreboard.teamBName;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      await updateTeams(payload);
    } catch (err) {
      console.error('Aktive Teams konnten nicht aktualisiert werden.', err);
    }
  }, [scoreboard]);

  const formattedRemaining = useMemo(
    () => formatTime(scoreboard?.remainingSeconds ?? 0),
    [scoreboard?.remainingSeconds]
  );

  const statusLabel = useMemo(() => {
    if (scoreboard?.isHalftimeBreak) return t('status.halftimeBreak');
    if (scoreboard?.isExtraTime) return scoreboard?.isRunning ? t('status.extraTime') : t('status.extraTimePaused');
    return scoreboard?.isRunning ? t('status.running') : t('status.paused');
  }, [scoreboard?.isHalftimeBreak, scoreboard?.isExtraTime, scoreboard?.isRunning, t]);

  const liveStateLabel = useMemo(() => {
    if (scoreboard?.isHalftimeBreak) return t('status.halftimeBreak');
    return scoreboard?.isRunning ? t('status.running') : t('status.paused');
  }, [scoreboard?.isHalftimeBreak, scoreboard?.isRunning, t]);

  return {
    scoreboard,
    loading,
    teamForm,
    teamDirty,
    manualScores,
    manualDirty,
    selectedScorer,
    timerInput,
    submittingTimer,
    penaltyForms,
    halftimeInput,
    halftimePauseInput,
    extraTimeInput,
    halftimeDirty,
    halftimePauseDirty,
    extraDirty,
    displayViewPending,
    formattedRemaining,
    statusLabel,
    liveStateLabel,
    setTeamDirty,
    setManualScores,
    setManualDirty,
    setPenaltyForms,
    setSelectedScorer,
    setTimerInput,
    setHalftimeInput,
    setHalftimePauseInput,
    setExtraTimeInput,
    setHalftimeDirty,
    setHalftimePauseDirty,
    setExtraDirty,
    handleTeamInputChange,
    handleTeamSelectChange,
    handleTeamSubmit,
    handleScore,
    handleManualScoreChange,
    handleManualScoreSubmit,
    handleResetScores,
    handlePenaltyFormChange,
    handlePenaltySubmit,
    handlePenaltyRemove,
    handleHalftimeSubmit,
    handleHalftimePauseSubmit,
    handleExtraTimeSubmit,
    handleExtraTimeAdjust,
    handleTimerSubmit,
    handleStart,
    handlePause,
    handleFinishGame,
    handleSaveGame,
    handleNewGame,
    handleDisplayViewChange,
    refreshActiveTeams,
    initializeStateFromScoreboard,
    setScoreboard
  };
}
