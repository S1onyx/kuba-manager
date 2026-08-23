import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchTournamentSchedule,
  selectScheduleMatch,
  updateTournamentScheduleEntry
} from '../utils/api.js';
import {
  formatDateTime,
  formatDateTimeLocalInput,
  normalizeLocalDateTimeToISO
} from '../utils/formatters.js';
import { createPenaltyForms } from '../utils/forms.js';
import { formatApiError } from '../utils/apiError.js';
import { formatStageLabelI18n } from '../utils/stageLabels.js';
import { useDateLocale } from '../i18n/index.js';

const PHASES = new Set(['group', 'knockout', 'placement']);

const normalizePhaseFilter = (value) => (PHASES.has(value) ? value : 'all');

const extractTimePart = (value = '') => {
  if (!value) {
    return null;
  }
  const match = value.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
};

export default function useScheduleManager({
  resolvedTournamentId,
  scoreboard,
  initializeStateFromScoreboard,
  setTeamDirty,
  setPenaltyForms,
  setManualDirty,
  setContextForm,
  setContextFormDirty,
  updateMessage,
  refreshScheduleDependencies = []
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [schedulePickerCode, setSchedulePickerCode] = useState('');
  const [scheduleSelection, setScheduleSelection] = useState('');
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const refreshSchedule = useCallback(async (showLoader = false) => {
    if (!resolvedTournamentId) {
      setScheduleData(null);
      setScheduleError('');
      setScheduleLoading(false);
      return true;
    }

    if (showLoader) {
      setScheduleLoading(true);
    }
    try {
      const data = await fetchTournamentSchedule(resolvedTournamentId);
      setScheduleData(data ?? null);
      setScheduleError('');
      return true;
    } catch (err) {
      console.error(err);
      setScheduleData(null);
      setScheduleError(formatApiError(err, t, 'feedback.scheduleLoadFailed'));
      return false;
    } finally {
      if (showLoader) {
        setScheduleLoading(false);
      }
    }
  }, [resolvedTournamentId, t]);

  useEffect(() => {
    refreshSchedule(true);
  }, [refreshSchedule, ...refreshScheduleDependencies]);

  useEffect(() => {
    if (scoreboard?.scheduleCode) {
      setSchedulePickerCode(scoreboard.scheduleCode);
    }
  }, [scoreboard?.scheduleCode]);

  useEffect(() => {
    if (!scheduleData?.raw || !Array.isArray(scheduleData.raw)) {
      setScheduleDrafts({});
      return;
    }

    const nextDrafts = {};
    scheduleData.raw.forEach((entry) => {
      const key = String(entry.id);
      nextDrafts[key] = entry.scheduled_at ? formatDateTimeLocalInput(entry.scheduled_at) : '';
    });
    setScheduleDrafts(nextDrafts);
  }, [scheduleData?.raw]);

  const scheduleOptionData = useMemo(() => {
    const options = [];
    const matchMap = new Map();
    if (!scheduleData?.raw || !Array.isArray(scheduleData.raw)) {
      return { options, matchMap };
    }

    const phaseRank = {
      group: 1,
      knockout: 2,
      placement: 3
    };

    scheduleData.raw.forEach((entry) => {
      if (!entry || !entry.code) {
        return;
      }
      matchMap.set(entry.code, entry);
      const phase = entry.phase ?? 'group';
      const roundNumber = entry.round_number ?? entry.metadata?.round ?? null;
      const hasResult = Boolean(entry.result?.hasResult);
      const scoreText = hasResult ? `${entry.result.scoreA ?? 0}:${entry.result.scoreB ?? 0}` : null;
      const stageLabel = formatStageLabelI18n(
        entry.stage_label_i18n,
        t,
        entry.stage_label || (phase === 'group' ? t('phases.groupFallback') : t('phases.fallback'))
      );
      const descriptor =
        phase === 'group'
          ? `${stageLabel}${roundNumber ? ` · ${t('phases.round', { round: roundNumber })}` : ''}`
          : stageLabel;

      const scheduledTimestamp = entry.scheduled_at ? Date.parse(entry.scheduled_at) : null;
      const scheduledLabel = Number.isFinite(scheduledTimestamp) ? formatDateTime(entry.scheduled_at, dateLocale) : null;
      const detailParts = [];
      if (scheduledLabel) {
        detailParts.push(t('schedule.optionStart', { time: scheduledLabel }));
      }
      if (scoreText) {
        detailParts.push(t('schedule.optionResult', { score: scoreText }));
      }
      const detailSuffix = detailParts.length > 0 ? ` · ${detailParts.join(' · ')}` : '';
      const label = `${descriptor} – ${entry.home_label} vs ${entry.away_label}${detailSuffix}`;

      options.push({
        code: entry.code,
        label,
        phase,
        stageOrder: entry.stage_order ?? 0,
        matchOrder: entry.match_order ?? 0,
        round: roundNumber ?? null,
        hasResult,
        scheduledTimestamp: Number.isFinite(scheduledTimestamp) ? scheduledTimestamp : null
      });
    });

    options.sort((a, b) => {
      const hasTimeA = Number.isFinite(a.scheduledTimestamp);
      const hasTimeB = Number.isFinite(b.scheduledTimestamp);
      if (hasTimeA && hasTimeB && a.scheduledTimestamp !== b.scheduledTimestamp) {
        return a.scheduledTimestamp - b.scheduledTimestamp;
      }
      if (hasTimeA && !hasTimeB) {
        return -1;
      }
      if (!hasTimeA && hasTimeB) {
        return 1;
      }

      const rankDiff = (phaseRank[a.phase] ?? 99) - (phaseRank[b.phase] ?? 99);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      if ((a.stageOrder ?? 0) !== (b.stageOrder ?? 0)) {
        return (a.stageOrder ?? 0) - (b.stageOrder ?? 0);
      }
      if ((a.round ?? 0) !== (b.round ?? 0)) {
        return (a.round ?? 0) - (b.round ?? 0);
      }
      return (a.matchOrder ?? 0) - (b.matchOrder ?? 0);
    });

    return { options, matchMap };
  }, [scheduleData, t, dateLocale]);

  const scheduleChronological = useMemo(() => {
    if (!scheduleData?.raw || !Array.isArray(scheduleData.raw)) {
      return [];
    }

    return scheduleData.raw.slice().sort((a, b) => {
      const timeA = a?.scheduled_at ? Date.parse(a.scheduled_at) : null;
      const timeB = b?.scheduled_at ? Date.parse(b.scheduled_at) : null;
      const validA = Number.isFinite(timeA);
      const validB = Number.isFinite(timeB);
      if (validA && validB && timeA !== timeB) {
        return timeA - timeB;
      }
      if (validA && !validB) {
        return -1;
      }
      if (!validA && validB) {
        return 1;
      }
      if ((a.stage_order ?? 0) !== (b.stage_order ?? 0)) {
        return (a.stage_order ?? 0) - (b.stage_order ?? 0);
      }
      if ((a.round_number ?? 0) !== (b.round_number ?? 0)) {
        return (a.round_number ?? 0) - (b.round_number ?? 0);
      }
      if ((a.match_order ?? 0) !== (b.match_order ?? 0)) {
        return (a.match_order ?? 0) - (b.match_order ?? 0);
      }
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [scheduleData?.raw]);

  const getDraftValue = useCallback(
    (entry, draftsOverride = scheduleDrafts) => {
      if (!entry) {
        return '';
      }
      const key = String(entry.id);
      if (draftsOverride && Object.prototype.hasOwnProperty.call(draftsOverride, key)) {
        return draftsOverride[key] ?? '';
      }
      return entry.scheduled_at ? formatDateTimeLocalInput(entry.scheduled_at) : '';
    },
    [scheduleDrafts]
  );

  const handleScheduleDraftChange = useCallback((entryId, value) => {
    const key = String(entryId);
    setScheduleDrafts((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleScheduleDraftSubmit = useCallback(
    async (entryId, overrideValue = undefined, options = {}) => {
      const { silent = false, skipRefresh = false } = options;
      if (!resolvedTournamentId) {
        updateMessage('error', t('feedback.tournamentRequired'));
        return false;
      }

      const key = String(entryId);
      const rawValue =
        overrideValue !== undefined ? overrideValue : scheduleDrafts[key] ?? '';
      const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';

      let normalized = null;
      if (trimmed) {
        normalized = normalizeLocalDateTimeToISO(trimmed);
        if (!normalized) {
          updateMessage('error', t('feedback.invalidDateTime'));
          return false;
        }
      }

      setScheduleSaving((prev) => ({
        ...prev,
        [key]: true
      }));

      try {
        await updateTournamentScheduleEntry(resolvedTournamentId, entryId, {
          scheduledAt: normalized
        });
        setScheduleDrafts((prev) => ({
          ...prev,
          [key]: trimmed
        }));
        if (!silent) {
          updateMessage('info', normalized ? t('feedback.scheduleEntrySaved') : t('feedback.scheduleEntryRemoved'));
        }
        if (!skipRefresh) {
          await refreshSchedule();
        }
        return true;
      } catch (err) {
        console.error(err);
        if (!silent) {
          const detail = typeof err?.detail === 'string' ? err.detail : '';
          if (detail.includes('Ungültiger Zeitpunkt')) {
            updateMessage('error', t('feedback.invalidDateTime'));
          } else {
            updateMessage('error', formatApiError(err, t, 'feedback.scheduleEntrySaveFailed'));
          }
        }
        return false;
      } finally {
        setScheduleSaving((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [resolvedTournamentId, scheduleDrafts, refreshSchedule, updateMessage, t]
  );

  const handleScheduleDraftClear = useCallback(
    async (entryId) => {
      const key = String(entryId);
      setScheduleDrafts((prev) => ({
        ...prev,
        [key]: ''
      }));
      await handleScheduleDraftSubmit(entryId, '', {});
    },
    [handleScheduleDraftSubmit]
  );

  const handleScheduleApplyDate = useCallback(
    ({ date, phase = 'all' }) => {
      const normalizedDate = typeof date === 'string' ? date.trim() : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        updateMessage('error', t('feedback.invalidDate'));
        return false;
      }
      const normalizedPhase = normalizePhaseFilter(phase);
      const targets = (scheduleData?.raw ?? []).filter(
        (entry) => normalizedPhase === 'all' || entry.phase === normalizedPhase
      );
      if (targets.length === 0) {
        updateMessage('error', t('feedback.noGamesInScope'));
        return false;
      }
      setScheduleDrafts((prev) => {
        const next = { ...prev };
        targets.forEach((entry) => {
          const key = String(entry.id);
          const reference = prev && Object.prototype.hasOwnProperty.call(prev, key)
            ? prev[key]
            : entry.scheduled_at
              ? formatDateTimeLocalInput(entry.scheduled_at)
              : '';
          const timePart = extractTimePart(reference) ?? '00:00';
          next[key] = `${normalizedDate}T${timePart}`;
        });
        return next;
      });
      updateMessage('info', t('feedback.dateApplied', { count: targets.length }));
      return true;
    },
    [scheduleData?.raw, updateMessage, t]
  );

  const handleScheduleAutoPlan = useCallback(
    ({
      start,
      intervalMinutes,
      breakAfter,
      breakMinutes,
      phase = 'all',
      skipCompleted = true,
      onlyEmpty = false
    }) => {
      const normalizedStart = typeof start === 'string' ? start.trim() : '';
      if (!normalizedStart) {
        updateMessage('error', t('feedback.startRequired'));
        return false;
      }
      const startDate = new Date(normalizedStart);
      if (Number.isNaN(startDate.getTime())) {
        updateMessage('error', t('feedback.startInvalid'));
        return false;
      }
      const interval = Number(intervalMinutes);
      if (!Number.isFinite(interval) || interval <= 0) {
        updateMessage('error', t('feedback.intervalInvalid'));
        return false;
      }

      const normalizedPhase = normalizePhaseFilter(phase);
      const entries = (scheduleChronological ?? []).filter((entry) => {
        if (normalizedPhase !== 'all' && entry.phase !== normalizedPhase) {
          return false;
        }
        if (skipCompleted && entry.result?.hasResult) {
          return false;
        }
        const currentValue = getDraftValue(entry);
        if (onlyEmpty && currentValue) {
          return false;
        }
        return true;
      });

      if (entries.length === 0) {
        updateMessage('error', t('feedback.noGamesForAutoPlan'));
        return false;
      }

      const parsedBreakAfter = Number(breakAfter);
      const breakEvery = Number.isFinite(parsedBreakAfter) && parsedBreakAfter > 0 ? Math.trunc(parsedBreakAfter) : null;
      const parsedBreakDuration = Number(breakMinutes);
      const breakDurationMinutes =
        breakEvery && Number.isFinite(parsedBreakDuration) && parsedBreakDuration > 0
          ? Math.trunc(parsedBreakDuration)
          : null;

      let cursor = new Date(startDate);
      const msPerInterval = Math.trunc(interval) * 60 * 1000;
      const assignments = entries.map((entry, index) => {
        const value = formatDateTimeLocalInput(cursor.toISOString());
        const payload = { id: entry.id, value };
        cursor = new Date(cursor.getTime() + msPerInterval);
        if (breakEvery && breakDurationMinutes && (index + 1) % breakEvery === 0) {
          cursor = new Date(cursor.getTime() + breakDurationMinutes * 60 * 1000);
        }
        return payload;
      });

      setScheduleDrafts((prev) => {
        const next = { ...prev };
        assignments.forEach(({ id, value }) => {
          next[String(id)] = value;
        });
        return next;
      });

      updateMessage('info', t('feedback.autoPlanned', { count: assignments.length }));
      return true;
    },
    [scheduleChronological, getDraftValue, updateMessage, t]
  );

  const handleScheduleBulkPersist = useCallback(
    async ({ phase = 'all' } = {}) => {
      if (!resolvedTournamentId) {
        updateMessage('error', t('feedback.tournamentRequired'));
        return false;
      }
      const normalizedPhase = normalizePhaseFilter(phase);
      const targets = (scheduleChronological ?? []).filter(
        (entry) => normalizedPhase === 'all' || entry.phase === normalizedPhase
      );
      if (targets.length === 0) {
        updateMessage('error', t('feedback.noGamesInScope'));
        return false;
      }

      const pending = targets.filter((entry) => {
        const desired = getDraftValue(entry);
        const current = entry.scheduled_at ? formatDateTimeLocalInput(entry.scheduled_at) : '';
        return (desired || '') !== (current || '');
      });

      if (pending.length === 0) {
        updateMessage('info', t('feedback.noChangesToSave'));
        return true;
      }

      setBulkSaving(true);
      let success = 0;
      let failure = 0;

      for (const entry of pending) {
        const desired = getDraftValue(entry);
        const result = await handleScheduleDraftSubmit(entry.id, desired, { silent: true, skipRefresh: true });
        if (result) {
          success += 1;
        } else {
          failure += 1;
        }
      }

      setBulkSaving(false);
      await refreshSchedule();

      if (failure === 0) {
        updateMessage('info', t('feedback.scheduleSaved', { count: success }));
        return true;
      }

      if (success > 0) {
        updateMessage('warning', t('feedback.schedulePartiallySaved', { success, failure }));
      } else {
        updateMessage('error', t('feedback.schedulePersistFailed'));
      }

      return false;
    },
    [
      resolvedTournamentId,
      scheduleChronological,
      getDraftValue,
      handleScheduleDraftSubmit,
      refreshSchedule,
      updateMessage,
      t
    ]
  );

  const handleScheduleMatchApply = useCallback(
    async (code) => {
      const selectedCode = String(code ?? '').trim();
      if (!selectedCode) {
        updateMessage('error', t('feedback.selectMatchRequired'));
        return false;
      }
      if (!resolvedTournamentId) {
        updateMessage('error', t('feedback.tournamentRequired'));
        return false;
      }

      const match = scheduleOptionData.matchMap.get(selectedCode);
      if (!match) {
        updateMessage('error', t('feedback.scheduleMatchNotFound'));
        return false;
      }

      if (match.result?.hasResult) {
        const confirmReuse = window.confirm(t('feedback.confirmReuseResult'));
        if (!confirmReuse) {
          return false;
        }
      }

      setScheduleSelection(selectedCode);

      try {
        const response = await selectScheduleMatch(resolvedTournamentId, selectedCode);
        const nextState = response?.scoreboard ?? null;
        if (!nextState) {
          updateMessage('error', t('feedback.scoreboardStateUnavailable'));
          return false;
        }

        initializeStateFromScoreboard(nextState);
        setTeamDirty(false);
        setPenaltyForms(createPenaltyForms());
        setManualDirty({ a: false, b: false });
        setContextForm({
          tournamentId: nextState.tournamentId ? String(nextState.tournamentId) : '',
          stageType: nextState.stageType ?? '',
          stageLabel: nextState.stageType === 'group' ? nextState.stageLabel : nextState.stageLabel ?? ''
        });
        setContextFormDirty(false);
        setSchedulePickerCode(nextState.scheduleCode ?? selectedCode);
        updateMessage('info', t('feedback.scheduleMatchApplied'));
        return true;
      } catch (error) {
        console.error(error);
        updateMessage('error', formatApiError(error, t, 'feedback.scheduleMatchApplyFailed'));
        return false;
      } finally {
        setScheduleSelection('');
      }
    },
    [
      resolvedTournamentId,
      scheduleOptionData.matchMap,
      initializeStateFromScoreboard,
      setTeamDirty,
      setPenaltyForms,
      setManualDirty,
      setContextForm,
      setContextFormDirty,
      updateMessage,
      t
    ]
  );

  const describeScheduleMatch = useCallback((entry) => {
    if (!entry) {
      return '';
    }

    const stageName = formatStageLabelI18n(
      entry.stage_label_i18n,
      t,
      entry.stage_label || t('phases.fallback')
    );
    const roundPart = entry.phase === 'group' && entry.round_number
      ? ` · ${t('phases.round', { round: entry.round_number })}`
      : '';

    return `${stageName}${roundPart} – ${entry.home_label} vs ${entry.away_label}`;
  }, [t]);

  const selectedScheduleMatch = scheduleOptionData.matchMap.get(schedulePickerCode ?? '');
  const activeScheduleMatch = scoreboard?.scheduleCode
    ? scheduleOptionData.matchMap.get(scoreboard.scheduleCode)
    : null;

  return {
    scheduleData,
    scheduleLoading,
    scheduleError,
    schedulePickerCode,
    scheduleSelection,
    scheduleDrafts,
    scheduleSaving,
    scheduleOptionData,
    scheduleChronological,
    selectedScheduleMatch,
    activeScheduleMatch,
    refreshSchedule,
    setSchedulePickerCode,
    handleScheduleDraftChange,
    handleScheduleDraftSubmit,
    handleScheduleDraftClear,
    handleScheduleMatchApply,
    handleScheduleApplyDate,
    handleScheduleAutoPlan,
    handleScheduleBulkPersist,
    describeScheduleMatch,
    bulkSaving
  };
}
