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

  const handleScheduleDraftChange = useCallback((entryId, value) => {
    const key = String(entryId);
    setScheduleDrafts((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleScheduleDraftSubmit = useCallback(
    async (entryId, overrideValue = undefined) => {
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
        updateMessage('info', normalized ? 'Spieltermin gespeichert.' : 'Spieltermin entfernt.');
        await refreshSchedule();
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
        if (detail.includes('Ungültiger Zeitpunkt')) {
          updateMessage('error', 'Bitte ein gültiges Datum/Uhrzeit auswählen.');
        } else {
          updateMessage('error', 'Spieltermin konnte nicht gespeichert werden.');
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
      await handleScheduleDraftSubmit(entryId, '');
    },
    [handleScheduleDraftSubmit]
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
    describeScheduleMatch
  };
}
