import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [schedulePickerCode, setSchedulePickerCode] = useState('');
  const [scheduleSelection, setScheduleSelection] = useState('');
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const refreshSchedule = useCallback(async () => {
    if (!resolvedTournamentId) {
      setScheduleData(null);
      setScheduleError('');
      setScheduleLoading(false);
      return true;
    }

    setScheduleLoading(true);
    try {
      const data = await fetchTournamentSchedule(resolvedTournamentId);
      setScheduleData(data ?? null);
      setScheduleError('');
      return true;
    } catch (err) {
      console.error(err);
      setScheduleData(null);
      setScheduleError('Spielplan konnte nicht geladen werden.');
      return false;
    } finally {
      setScheduleLoading(false);
    }
  }, [resolvedTournamentId]);

  useEffect(() => {
    refreshSchedule();
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
      const stageLabel = entry.stage_label || (phase === 'group' ? 'Gruppe' : 'Phase');
      const descriptor =
        phase === 'group'
          ? `${stageLabel}${roundNumber ? ` · Runde ${roundNumber}` : ''}`
          : stageLabel;

      const scheduledTimestamp = entry.scheduled_at ? Date.parse(entry.scheduled_at) : null;
      const scheduledLabel = Number.isFinite(scheduledTimestamp) ? formatDateTime(entry.scheduled_at) : null;
      const detailParts = [];
      if (scheduledLabel) {
        detailParts.push(`Start ${scheduledLabel}`);
      }
      if (scoreText) {
        detailParts.push(`Ergebnis ${scoreText}`);
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
  }, [scheduleData]);

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
        updateMessage('error', 'Bitte zuerst ein Turnier im Match-Kontext auswählen.');
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
          updateMessage('error', 'Bitte ein gültiges Datum/Uhrzeit auswählen.');
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
          updateMessage('info', normalized ? 'Spieltermin gespeichert.' : 'Spieltermin entfernt.');
        }
        if (!skipRefresh) {
          await refreshSchedule();
        }
        return true;
      } catch (err) {
        console.error(err);
        let detail = '';
        if (typeof err?.message === 'string') {
          try {
            const parsed = JSON.parse(err.message);
            detail = parsed?.detail ?? parsed?.message ?? '';
          } catch {
            detail = err.message;
          }
        }
        if (!silent) {
          if (detail.includes('Ungültiger Zeitpunkt')) {
            updateMessage('error', 'Bitte ein gültiges Datum/Uhrzeit auswählen.');
          } else {
            updateMessage('error', 'Spieltermin konnte nicht gespeichert werden.');
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
    [resolvedTournamentId, scheduleDrafts, refreshSchedule, updateMessage]
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
        updateMessage('error', 'Bitte ein gültiges Datum wählen (JJJJ-MM-TT).');
        return false;
      }
      const normalizedPhase = normalizePhaseFilter(phase);
      const targets = (scheduleData?.raw ?? []).filter(
        (entry) => normalizedPhase === 'all' || entry.phase === normalizedPhase
      );
      if (targets.length === 0) {
        updateMessage('error', 'Keine Spiele für den ausgewählten Bereich gefunden.');
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
      updateMessage('info', `Datum für ${targets.length} Spiele aktualisiert.`);
      return true;
    },
    [scheduleData?.raw, updateMessage]
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
        updateMessage('error', 'Bitte einen Startzeitpunkt auswählen.');
        return false;
      }
      const startDate = new Date(normalizedStart);
      if (Number.isNaN(startDate.getTime())) {
        updateMessage('error', 'Startzeitpunkt ist ungültig.');
        return false;
      }
      const interval = Number(intervalMinutes);
      if (!Number.isFinite(interval) || interval <= 0) {
        updateMessage('error', 'Intervall muss größer als 0 sein.');
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
        updateMessage('error', 'Keine passenden Spiele für die automatische Planung gefunden.');
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

      updateMessage('info', `${assignments.length} Spiele automatisch geplant.`);
      return true;
    },
    [scheduleChronological, getDraftValue, updateMessage]
  );

  const handleScheduleBulkPersist = useCallback(
    async ({ phase = 'all' } = {}) => {
      if (!resolvedTournamentId) {
        updateMessage('error', 'Bitte zuerst ein Turnier im Match-Kontext auswählen.');
        return false;
      }
      const normalizedPhase = normalizePhaseFilter(phase);
      const targets = (scheduleChronological ?? []).filter(
        (entry) => normalizedPhase === 'all' || entry.phase === normalizedPhase
      );
      if (targets.length === 0) {
        updateMessage('error', 'Keine Spiele für den ausgewählten Bereich gefunden.');
        return false;
      }

      const pending = targets.filter((entry) => {
        const desired = getDraftValue(entry);
        const current = entry.scheduled_at ? formatDateTimeLocalInput(entry.scheduled_at) : '';
        return (desired || '') !== (current || '');
      });

      if (pending.length === 0) {
        updateMessage('info', 'Keine Änderungen zum Speichern vorhanden.');
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
        updateMessage('info', `${success} Spieltermine gespeichert.`);
        return true;
      }

      if (success > 0) {
        updateMessage('warning', `${success} gespeichert, ${failure} fehlgeschlagen.`);
      } else {
        updateMessage('error', 'Speichern der Spieltermine fehlgeschlagen.');
      }

      return false;
    },
    [
      resolvedTournamentId,
      scheduleChronological,
      getDraftValue,
      handleScheduleDraftSubmit,
      refreshSchedule,
      updateMessage
    ]
  );

  const handleScheduleMatchApply = useCallback(
    async (code) => {
      const selectedCode = String(code ?? '').trim();
      if (!selectedCode) {
        updateMessage('error', 'Bitte ein Match aus dem Spielplan auswählen.');
        return false;
      }
      if (!resolvedTournamentId) {
        updateMessage('error', 'Bitte zuerst ein Turnier im Match-Kontext auswählen.');
        return false;
      }

      const match = scheduleOptionData.matchMap.get(selectedCode);
      if (!match) {
        updateMessage('error', 'Das ausgewählte Match konnte im Spielplan nicht gefunden werden.');
        return false;
      }

      if (match.result?.hasResult) {
        const confirmReuse = window.confirm(
          'Für dieses Match wurde bereits ein Ergebnis gespeichert. Soll es trotzdem übernommen werden?'
        );
        if (!confirmReuse) {
          return false;
        }
      }

      setScheduleSelection(selectedCode);

      try {
        const response = await selectScheduleMatch(resolvedTournamentId, selectedCode);
        const nextState = response?.scoreboard ?? null;
        if (!nextState) {
          updateMessage('error', 'Aktualisierter Scoreboard-Status nicht verfügbar.');
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
        updateMessage('info', 'Match aus Spielplan übernommen.');
        return true;
      } catch (error) {
        console.error(error);
        updateMessage('error', 'Spielplan-Match konnte nicht übernommen werden.');
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
      updateMessage
    ]
  );

  const describeScheduleMatch = useCallback((entry) => {
    if (!entry) {
      return '';
    }

    const roundPart = entry.phase === 'group' && entry.round_number
      ? ` · Runde ${entry.round_number}`
      : '';

    return `${entry.stage_label || 'Phase'}${roundPart} – ${entry.home_label} vs ${entry.away_label}`;
  }, []);

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
