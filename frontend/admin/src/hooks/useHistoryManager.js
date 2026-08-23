import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  deleteHistoryGame,
  fetchHistory,
  updateHistoryGame
} from '../utils/api.js';
import { formatDateTime, formatTime, parseTimerInput } from '../utils/formatters.js';
import { formatApiError } from '../utils/apiError.js';
import { useDateLocale } from '../i18n/index.js';

export default function useHistoryManager({ updateMessage }) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [editingGameId, setEditingGameId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const loadHistory = useCallback((showLoader = false) => {
    if (showLoader) {
      setHistoryLoading(true);
    }
    fetchHistory()
      .then((data) => {
        setHistory(data);
        setHistoryError('');
      })
      .catch((err) => {
        setHistoryError(formatApiError(err, t, 'feedback.historyLoadFailed'));
      })
      .finally(() => {
        if (showLoader) {
          setHistoryLoading(false);
        }
      });
  }, [t]);

  useEffect(() => {
    loadHistory(true);
  }, [loadHistory]);

  const startHistoryEdit = useCallback((game) => {
    setEditingGameId(game.id);
    setEditForm({
      team_a: game.team_a,
      team_b: game.team_b,
      score_a: String(game.score_a),
      score_b: String(game.score_b),
      extra_seconds: game.extra_seconds ? formatTime(game.extra_seconds) : '',
      extra_elapsed_seconds: game.extra_elapsed_seconds ? formatTime(game.extra_elapsed_seconds) : '',
      penalty_count_a: String(game.penalties?.a?.length ?? 0),
      penalty_count_b: String(game.penalties?.b?.length ?? 0)
    });
  }, []);

  const handleHistoryEditChange = useCallback((field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const cancelHistoryEdit = useCallback(() => {
    setEditingGameId(null);
    setEditForm(null);
  }, []);

  const handleHistoryEditSubmit = useCallback(
    async (event) => {
      event?.preventDefault();
      if (!editingGameId || !editForm) return false;

      const payload = {};

      const teamA = editForm.team_a?.trim();
      if (!teamA) {
        updateMessage('error', t('feedback.teamARequired'));
        return false;
      }
      payload.team_a = teamA;

      const teamB = editForm.team_b?.trim();
      if (!teamB) {
        updateMessage('error', t('feedback.teamBRequired'));
        return false;
      }
      payload.team_b = teamB;

      const scoreA = Number(editForm.score_a);
      if (!Number.isFinite(scoreA) || scoreA < 0) {
        updateMessage('error', t('feedback.scoreAInvalid'));
        return false;
      }
      payload.score_a = Math.trunc(scoreA);

      const scoreB = Number(editForm.score_b);
      if (!Number.isFinite(scoreB) || scoreB < 0) {
        updateMessage('error', t('feedback.scoreBInvalid'));
        return false;
      }
      payload.score_b = Math.trunc(scoreB);

      const extraSecondsInput = editForm.extra_seconds?.trim();
      if (extraSecondsInput) {
        const parsed = parseTimerInput(extraSecondsInput);
        if (parsed === null) {
          updateMessage('error', t('feedback.extraPlannedInvalid'));
          return false;
        }
        payload.extra_seconds = parsed;
      }

      const extraElapsedInput = editForm.extra_elapsed_seconds?.trim();
      if (extraElapsedInput) {
        const parsed = parseTimerInput(extraElapsedInput);
        if (parsed === null) {
          updateMessage('error', t('feedback.extraElapsedInvalid'));
          return false;
        }
        payload.extra_elapsed_seconds = parsed;
      }

      const penaltyCountA = Number(editForm.penalty_count_a);
      const penaltyCountB = Number(editForm.penalty_count_b);
      if (!Number.isFinite(penaltyCountA) || penaltyCountA < 0) {
        updateMessage('error', t('feedback.penaltiesAInvalid'));
        return false;
      }
      if (!Number.isFinite(penaltyCountB) || penaltyCountB < 0) {
        updateMessage('error', t('feedback.penaltiesBInvalid'));
        return false;
      }

      payload.penalties = {
        a: Array.from({ length: Math.trunc(penaltyCountA) }, (_, idx) => ({
          id: `a-${editingGameId}-${idx}`,
          team: 'a',
          name: t('history.penaltyName', { number: idx + 1 }),
          remainingSeconds: 0,
          totalSeconds: 0,
          isExpired: true
        })),
        b: Array.from({ length: Math.trunc(penaltyCountB) }, (_, idx) => ({
          id: `b-${editingGameId}-${idx}`,
          team: 'b',
          name: t('history.penaltyName', { number: idx + 1 }),
          remainingSeconds: 0,
          totalSeconds: 0,
          isExpired: true
        }))
      };

      try {
        await updateHistoryGame(editingGameId, payload);
        updateMessage('info', t('feedback.gameUpdated'));
        cancelHistoryEdit();
        loadHistory();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.gameUpdateFailed'));
        return false;
      }
    },
    [editingGameId, editForm, loadHistory, cancelHistoryEdit, updateMessage, t]
  );

  const handleHistoryDelete = useCallback(
    async (id) => {
      if (!window.confirm(t('history.confirmDelete'))) {
        return false;
      }

      try {
        await deleteHistoryGame(id);
        if (editingGameId === id) {
          cancelHistoryEdit();
        }
        updateMessage('info', t('feedback.gameDeleted'));
        loadHistory();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.gameDeleteFailed'));
        return false;
      }
    },
    [editingGameId, cancelHistoryEdit, loadHistory, updateMessage, t]
  );

  const formatHistoryDateTime = useCallback(
    (isoString) => formatDateTime(isoString, dateLocale),
    [dateLocale]
  );

  return {
    history,
    historyLoading,
    historyError,
    editingGameId,
    editForm,
    loadHistory,
    startHistoryEdit,
    handleHistoryEditChange,
    cancelHistoryEdit,
    handleHistoryEditSubmit,
    handleHistoryDelete,
    formatDateTime: formatHistoryDateTime
  };
}
