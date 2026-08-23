import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchTournamentStructure,
  updateTournamentTeams
} from '../utils/api.js';
import { formatApiError } from '../utils/apiError.js';

export default function useTournamentStructure({
  expandedTournamentId,
  teams,
  updateMessage
}) {
  const { t } = useTranslation();
  const [tournamentStructure, setTournamentStructure] = useState(null);
  const [structureTournamentId, setStructureTournamentId] = useState(null);
  const [structureLoading, setStructureLoading] = useState(false);
  const [structureError, setStructureError] = useState('');
  const [slotAssignments, setSlotAssignments] = useState({});
  const [slotInitialAssignments, setSlotInitialAssignments] = useState({});
  const [structureSaving, setStructureSaving] = useState(false);

  const teamNameById = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      map.set(String(team.id), team.name);
    });
    return map;
  }, [teams]);

  const initializeSlotAssignments = useCallback((structureData) => {
    if (!structureData?.groups) {
      setSlotAssignments({});
      setSlotInitialAssignments({});
      return;
    }

    const current = {};
    const initial = {};

    structureData.groups.forEach((group) => {
      group.slots.forEach((slot) => {
        const key = String(slot.slotNumber);
        const name = slot.displayName || t('tournaments.details.teamFallback', { number: slot.slotNumber });
        const placeholder = slot.placeholder || name;
        const teamId = slot.teamId ? String(slot.teamId) : '';

        current[key] = {
          name,
          placeholder,
          teamId
        };

        initial[key] = {
          name,
          placeholder,
          teamId
        };
      });
    });

    setSlotAssignments(current);
    setSlotInitialAssignments(initial);
  }, [t]);

  const loadTournamentStructure = useCallback(
    async (id, options = {}) => {
      if (!id) {
        setTournamentStructure(null);
        setStructureTournamentId(null);
        setStructureError('');
        setSlotAssignments({});
        setSlotInitialAssignments({});
        return;
      }

      const showLoader = Boolean(options.showLoader);
      const resetState = Boolean(options.reset);

      if (showLoader) {
        setStructureLoading(true);
      }
      setStructureError('');
      if (resetState) {
        setTournamentStructure(null);
        setStructureTournamentId(null);
        setSlotAssignments({});
        setSlotInitialAssignments({});
      }

      try {
        const data = await fetchTournamentStructure(id);
        setTournamentStructure(data);
        setStructureTournamentId(id);
        initializeSlotAssignments(data);
      } catch (error) {
        console.error(error);
        setStructureError(formatApiError(error, t, 'feedback.structureLoadFailed'));
        if (resetState) {
          setTournamentStructure(null);
          setStructureTournamentId(null);
          setSlotAssignments({});
          setSlotInitialAssignments({});
        }
      } finally {
        if (showLoader) {
          setStructureLoading(false);
        }
      }
    },
    [initializeSlotAssignments, t]
  );

  useEffect(() => {
    if (!expandedTournamentId) {
      setTournamentStructure(null);
      setStructureTournamentId(null);
      setStructureError('');
      setSlotAssignments({});
      setSlotInitialAssignments({});
      return;
    }
    loadTournamentStructure(expandedTournamentId, { showLoader: true, reset: true });
  }, [expandedTournamentId, loadTournamentStructure]);

  const handleSlotNameChange = useCallback((slotNumber, value) => {
    const key = String(slotNumber);
    setSlotAssignments((prev) => {
      const next = { ...prev };
      const previous = prev[key] ?? { name: '', placeholder: '', teamId: '' };
      const nameValue = value;
      let teamId = previous.teamId ?? '';
      if (teamId) {
        const linkedName = teamNameById.get(teamId);
        if (linkedName && linkedName !== nameValue) {
          teamId = '';
        }
      }
      const trimmed = nameValue.trim();
      next[key] = {
        ...previous,
        name: nameValue,
        placeholder: trimmed || previous.placeholder || t('tournaments.details.teamFallback', { number: slotNumber }),
        teamId
      };
      return next;
    });
  }, [teamNameById, t]);

  const handleSlotTeamSelect = useCallback((slotNumber, value) => {
    const key = String(slotNumber);
    const normalized = value || '';
    setSlotAssignments((prev) => {
      const next = { ...prev };
      const previous = prev[key] ?? { name: '', placeholder: '', teamId: '' };
      if (normalized) {
        const selectedName = teamNameById.get(normalized) ?? '';
        next[key] = {
          ...previous,
          teamId: normalized,
          name: selectedName,
          placeholder: selectedName || t('tournaments.details.teamFallback', { number: slotNumber })
        };
      } else {
        next[key] = {
          ...previous,
          teamId: '',
          name: previous.name,
          placeholder: (previous.name ?? '').trim() || t('tournaments.details.teamFallback', { number: slotNumber })
        };
      }
      return next;
    });
  }, [teamNameById, t]);

  const handleSlotReset = useCallback((slotNumber) => {
    const key = String(slotNumber);
    setSlotAssignments((prev) => {
      const next = { ...prev };
      if (slotInitialAssignments[key]) {
        next[key] = { ...slotInitialAssignments[key] };
      } else {
        next[key] = {
          name: t('tournaments.details.teamFallback', { number: slotNumber }),
          placeholder: t('tournaments.details.teamFallback', { number: slotNumber }),
          teamId: ''
        };
      }
      return next;
    });
  }, [slotInitialAssignments, t]);

  const handleResetAllSlots = useCallback(() => {
    setSlotAssignments(() => {
      const next = {};
      Object.entries(slotInitialAssignments).forEach(([key, value]) => {
        next[key] = { ...value };
      });
      return next;
    });
  }, [slotInitialAssignments]);

  const handleTournamentStructureRefresh = useCallback(() => {
    if (expandedTournamentId) {
      loadTournamentStructure(expandedTournamentId);
    }
  }, [expandedTournamentId, loadTournamentStructure]);

  const handleTournamentAssignmentsSave = useCallback(
    async () => {
      if (!expandedTournamentId) {
        return false;
      }

      const assignments = Object.entries(slotAssignments).map(([slotKey, entry]) => {
        const slotNumber = Number(slotKey);
        const trimmedName = (entry?.name ?? '').trim();
        const teamIdValue = entry?.teamId ? Number(entry.teamId) : null;
        const fallback =
          (entry?.teamId ? teamNameById.get(entry.teamId) : null) ||
          slotInitialAssignments[slotKey]?.name ||
          t('tournaments.details.teamFallback', { number: slotNumber });
        return {
          slot_number: slotNumber,
          team_id: teamIdValue,
          placeholder: trimmedName || fallback
        };
      });

      setStructureSaving(true);
      setStructureError('');

      try {
        const data = await updateTournamentTeams(expandedTournamentId, assignments);
        setTournamentStructure(data);
        setStructureTournamentId(expandedTournamentId);
        initializeSlotAssignments(data);
        updateMessage('info', t('feedback.assignmentsSaved'));
        return true;
      } catch (error) {
        console.error(error);
        const message = formatApiError(error, t, 'feedback.assignmentsSaveFailed');
        setStructureError(message);
        updateMessage('error', message);
        return false;
      } finally {
        setStructureSaving(false);
      }
    },
    [
      expandedTournamentId,
      slotAssignments,
      slotInitialAssignments,
      teamNameById,
      initializeSlotAssignments,
      updateMessage,
      t
    ]
  );

  const hasTournamentChanges = useMemo(() => {
    if (!expandedTournamentId) {
      return false;
    }

    return Object.entries(slotAssignments).some(([slotKey, entry]) => {
      const initial = slotInitialAssignments[slotKey] ?? { name: '', teamId: '' };
      const currentTeamId = entry?.teamId ?? '';
      const initialTeamId = initial.teamId ?? '';
      const currentName = (entry?.name ?? '').trim();
      const initialName = (initial.name ?? '').trim();
      return currentTeamId !== initialTeamId || currentName !== initialName;
    });
  }, [expandedTournamentId, slotAssignments, slotInitialAssignments]);

  const activeStructure = useMemo(
    () => (expandedTournamentId && structureTournamentId === expandedTournamentId ? tournamentStructure : null),
    [expandedTournamentId, structureTournamentId, tournamentStructure]
  );

  return {
    tournamentStructure,
    activeStructure,
    structureLoading,
    structureError,
    slotAssignments,
    slotInitialAssignments,
    structureSaving,
    teamNameById,
    hasTournamentChanges,
    initializeSlotAssignments,
    loadTournamentStructure,
    handleSlotNameChange,
    handleSlotTeamSelect,
    handleSlotReset,
    handleResetAllSlots,
    handleTournamentStructureRefresh,
    handleTournamentAssignmentsSave
  };
}
