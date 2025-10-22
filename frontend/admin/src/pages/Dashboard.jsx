import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import socket from '../socket.js';
import {
  addPenalty,
  deleteHistoryGame,
  fetchHistory,
  fetchScoreboard,
  finishGame,
  saveCurrentGame,
  mutateScore,
  pauseScoreboardTimer,
  removePenalty,
  resetScoreboard,
  setExtraTime,
  setHalftime,
  setHalftimePause,
  setScoreAbsolute,
  setScoreboardTimer,
  setDisplayView,
  startNewGame,
  startScoreboardTimer,
  updateHistoryGame,
  updateMatchContext,
  updateTeams,
  fetchTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  fetchPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  fetchTournamentStages,
  fetchTournamentSchedule,
  fetchTournamentStructure,
  selectScheduleMatch,
  updateTournamentTeams,
  updateTournamentScheduleEntry,
  fetchAudioTriggers,
  updateAudioTrigger,
  uploadAudioTriggerFile,
  playAudioTriggerPreview,
  assignAudioTriggerFile,
  fetchAudioLibrary,
  uploadAudioLibraryFile,
  deleteAudioLibraryFile,
  playAudioLibraryFile
} from '../utils/api.js';

const POINT_OPTIONS = [1, 2, 3];
const createPenaltyForms = () => ({
  a: { name: '', preset: '60', custom: '', playerId: '' },
  b: { name: '', preset: '60', custom: '', playerId: '' }
});
const DISPLAY_VIEW_OPTIONS = [
  { id: 'scoreboard', label: 'Live-Spielstand' },
  { id: 'bracket', label: 'Turnierbaum' }
];

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function formatDateTimeLocalInput(isoString) {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeLocalDateTimeToISO(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function parseTimerInput(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.includes(':')) {
    const [minPart, secPart = '0'] = trimmed.split(':');
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) {
      return null;
    }
    return Math.max(0, Math.trunc(minutes) * 60 + Math.trunc(seconds));
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.trunc(numeric));
}

function canonicalizeGroupLabel(label) {
  const raw = (label ?? '').toString().trim();
  if (!raw) {
    return '';
  }

  const upper = raw.toUpperCase();
  const match = upper.match(/^(GRUPPE|GROUP)\s+/);
  if (match) {
    return upper.slice(match[0].length).trim();
  }

  return upper.trim();
}

export default function Dashboard() {
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [teamForm, setTeamForm] = useState({ teamAName: '', teamBName: '', teamAId: '', teamBId: '' });
  const [teamDirty, setTeamDirty] = useState(false);
  const [manualScores, setManualScores] = useState({ a: '', b: '' });
  const [manualDirty, setManualDirty] = useState({ a: false, b: false });
  const [timerInput, setTimerInput] = useState('');
  const [submittingTimer, setSubmittingTimer] = useState(false);
  const [penaltyForms, setPenaltyForms] = useState(() => createPenaltyForms());
  const [selectedScorer, setSelectedScorer] = useState({ a: '', b: '' });
  const [halftimeInput, setHalftimeInput] = useState('');
  const [extraTimeInput, setExtraTimeInput] = useState('');
  const [halftimeDirty, setHalftimeDirty] = useState(false);
  const [extraDirty, setExtraDirty] = useState(false);
  const [halftimePauseInput, setHalftimePauseInput] = useState('');
  const [halftimePauseDirty, setHalftimePauseDirty] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [activeTab, setActiveTab] = useState('control');
  const [editingGameId, setEditingGameId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [contextForm, setContextForm] = useState({ tournamentId: '', stageType: '', stageLabel: '' });
  const [contextFormDirty, setContextFormDirty] = useState(false);
  const [displayViewPending, setDisplayViewPending] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [tournamentsError, setTournamentsError] = useState('');
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    group_count: '',
    knockout_rounds: '',
    team_count: '',
    classification_mode: 'top4',
    is_public: false
  });
  const [tournamentEdits, setTournamentEdits] = useState({});
  const [stageOptions, setStageOptions] = useState({ group: [], knockout: [], placement: [] });
  const [stageOptionsLoading, setStageOptionsLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [schedulePickerCode, setSchedulePickerCode] = useState('');
  const [scheduleSelection, setScheduleSelection] = useState('');
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState({});
  const [audioTriggers, setAudioTriggers] = useState([]);
  const [audioLibrary, setAudioLibrary] = useState([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [audioTriggerBusy, setAudioTriggerBusy] = useState({});
  const [audioUploadBusy, setAudioUploadBusy] = useState({});
  const [audioManualBusy, setAudioManualBusy] = useState({});
  const [audioTriggerLabels, setAudioTriggerLabels] = useState({});
  const [audioLibraryUploadLabel, setAudioLibraryUploadLabel] = useState('');
  const resolvedTournamentId = useMemo(() => {
    const scoreboardId = scoreboard?.tournamentId ? Number(scoreboard.tournamentId) : null;
    if (scoreboardId && Number.isInteger(scoreboardId) && scoreboardId > 0) {
      return scoreboardId;
    }
    const contextId = contextForm.tournamentId ? Number(contextForm.tournamentId) : null;
    if (contextId && Number.isInteger(contextId) && contextId > 0) {
      return contextId;
    }
    return null;
  }, [scoreboard?.tournamentId, contextForm.tournamentId]);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState('');
  const [teamCreateName, setTeamCreateName] = useState('');
  const [teamEdits, setTeamEdits] = useState({});
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState('');
  const [playerCreate, setPlayerCreate] = useState({ teamId: '', name: '', jerseyNumber: '', position: '' });
  const [playerEdits, setPlayerEdits] = useState({});
  const [expandedTournamentId, setExpandedTournamentId] = useState(null);
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
        const name = slot.displayName || `Team ${slot.slotNumber}`;
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
  }, []);

  const loadTournamentStructure = useCallback(
    async (id) => {
      if (!id) {
        return;
      }

      setStructureLoading(true);
      setStructureError('');
      setTournamentStructure(null);
      setStructureTournamentId(null);
      setSlotAssignments({});
      setSlotInitialAssignments({});

      try {
        const data = await fetchTournamentStructure(id);
        setTournamentStructure(data);
        setStructureTournamentId(id);
        initializeSlotAssignments(data);
      } catch (error) {
        console.error(error);
        setStructureError('Turnierstruktur konnte nicht geladen werden.');
        setTournamentStructure(null);
        setStructureTournamentId(null);
        setSlotAssignments({});
        setSlotInitialAssignments({});
      } finally {
        setStructureLoading(false);
      }
    },
    [initializeSlotAssignments]
  );

  const stageLabelMapRef = useRef(new Map());
  const stageLabelData = useMemo(() => {
    const labelMap = new Map();
    const hintsByPhase = {
      group: [],
      knockout: [],
      placement: []
    };

    Object.entries(stageOptions).forEach(([phase, labels = []]) => {
      labels.forEach((label) => {
        const trimmed = (label ?? '').toString().trim();
        if (!trimmed) {
          return;
        }

        if (Array.isArray(hintsByPhase[phase]) && !hintsByPhase[phase].includes(trimmed)) {
          hintsByPhase[phase].push(trimmed);
        }

        const normalized = trimmed.toLowerCase();
        const existing = labelMap.get(normalized);
        if (existing) {
          if (!existing.phases.includes(phase)) {
            existing.phases.push(phase);
          }
        } else {
          labelMap.set(normalized, {
            label: trimmed,
            phases: [phase]
          });
        }
      });
    });

    Object.keys(hintsByPhase).forEach((phase) => {
      hintsByPhase[phase].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
    });

    const suggestions = Array.from(labelMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'de', { sensitivity: 'base' })
    );

    return {
      labelMap,
      hintsByPhase,
      suggestions
    };
  }, [stageOptions]);

  stageLabelMapRef.current = stageLabelData.labelMap;
  const stageHintsByPhase = stageLabelData.hintsByPhase;
  const stageSuggestionEntries = stageLabelData.suggestions;
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

  const playersByTeam = useMemo(() => {
    const map = new Map();
    players.forEach((player) => {
      const key = player.team_id != null ? String(player.team_id) : 'unassigned';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(player);
    });

    map.forEach((list) => {
      list.sort((a, b) => {
        const aNum = a.jersey_number ?? Number.MAX_SAFE_INTEGER;
        const bNum = b.jersey_number ?? Number.MAX_SAFE_INTEGER;
        if (aNum !== bNum) {
          return aNum - bNum;
        }
        return (a.name ?? '').localeCompare(b.name ?? '', 'de', { sensitivity: 'base' });
      });
    });

    return map;
  }, [players]);

  const unassignedPlayers = playersByTeam.get('unassigned') ?? [];

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    fetchHistory()
      .then((data) => {
        setHistory(data);
        setHistoryError('');
      })
      .catch(() => {
        setHistoryError('Historie konnte nicht geladen werden.');
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, []);

  const loadTournaments = useCallback(() => {
    setTournamentsLoading(true);
    fetchTournaments()
      .then((data) => {
        setTournaments(data);
        setTournamentsError('');
      })
      .catch(() => {
        setTournamentsError('Turniere konnten nicht geladen werden.');
      })
      .finally(() => {
        setTournamentsLoading(false);
      });
  }, []);

  const loadTeams = useCallback(() => {
    setTeamsLoading(true);
    fetchTeams()
      .then((data) => {
        setTeams(data);
        setTeamsError('');
      })
      .catch(() => {
        setTeamsError('Teams konnten nicht geladen werden.');
      })
      .finally(() => {
        setTeamsLoading(false);
      });
  }, []);

  const loadPlayers = useCallback(() => {
    setPlayersLoading(true);
    fetchPlayers()
      .then((data) => {
        setPlayers(data);
        setPlayersError('');
      })
      .catch(() => {
        setPlayersError('Spieler konnten nicht geladen werden.');
      })
      .finally(() => {
        setPlayersLoading(false);
      });
  }, []);

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

  const loadAudioData = useCallback(async () => {
    setAudioLoading(true);
    setAudioError('');
    try {
      const [triggersResponse, libraryResponse] = await Promise.all([
        fetchAudioTriggers(),
        fetchAudioLibrary()
      ]);
      setAudioTriggers(triggersResponse?.triggers ?? []);
      setAudioLibrary(libraryResponse?.files ?? []);
    } catch (err) {
      console.error('Audiodaten konnten nicht geladen werden.', err);
      setAudioError('Audiodaten konnten nicht geladen werden.');
    } finally {
      setAudioLoading(false);
    }
  }, []);

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
  }, [scoreboard?.teamAId, scoreboard?.teamAName, scoreboard?.teamBId, scoreboard?.teamBName]);

  useEffect(() => {
    let active = true;

    fetchScoreboard()
      .then((data) => {
        if (!active) return;
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
        setHalftimePauseDirty(false);
        setExtraTimeInput(formatTime(data.extraSeconds ?? 0));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Scoreboard konnte nicht geladen werden.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    loadAudioData();
  }, [loadAudioData]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  useEffect(() => {
    if (!expandedTournamentId) {
      setTournamentStructure(null);
      setStructureTournamentId(null);
      setStructureError('');
      setSlotAssignments({});
      setSlotInitialAssignments({});
      return;
    }
    loadTournamentStructure(expandedTournamentId);
  }, [expandedTournamentId, loadTournamentStructure]);

  useEffect(() => {
    if (!resolvedTournamentId) {
      setStageOptions({ group: [], knockout: [], placement: [] });
      setStageOptionsLoading(false);
      return;
    }

    let active = true;
    setStageOptionsLoading(true);

    fetchTournamentStages(resolvedTournamentId)
      .then((data) => {
        if (!active) return;
        setStageOptions({
          group: Array.isArray(data?.group) ? data.group : [],
          knockout: Array.isArray(data?.knockout) ? data.knockout : [],
          placement: Array.isArray(data?.placement) ? data.placement : []
        });
      })
      .catch(() => {
        if (!active) return;
        setStageOptions({ group: [], knockout: [], placement: [] });
      })
      .finally(() => {
        if (!active) return;
        setStageOptionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resolvedTournamentId]);

  useEffect(() => {
    if (scoreboard?.scheduleCode) {
      setSchedulePickerCode(scoreboard.scheduleCode);
    }
  }, [scoreboard?.scheduleCode]);

  useEffect(() => {
    refreshSchedule();
  }, [refreshSchedule]);

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

    return () => {
      socket.off('scoreboard:update', handleUpdate);
    };
  }, [teamDirty, halftimeDirty, halftimePauseDirty, extraDirty, manualDirty]);

  useEffect(() => {
    if (!scoreboard) return;
    if (contextFormDirty) return;
    setContextForm({
      tournamentId: scoreboard.tournamentId ? String(scoreboard.tournamentId) : '',
      stageType: scoreboard.stageType ?? '',
      stageLabel: scoreboard.stageLabel ?? ''
    });
  }, [contextFormDirty, scoreboard?.tournamentId, scoreboard?.stageType, scoreboard?.stageLabel]);

  useEffect(() => {
    if (!contextForm.stageType || contextForm.stageLabel) {
      return;
    }
    const options = stageOptions[contextForm.stageType] ?? [];
    if (options.length > 0 && !contextFormDirty) {
      setContextForm((prev) => {
        if (prev.stageType !== contextForm.stageType || prev.stageLabel) {
          return prev;
        }
        return { ...prev, stageLabel: options[0] };
      });
    }
  }, [stageOptions, contextForm.stageType, contextForm.stageLabel, contextFormDirty]);

  const stageListId = stageSuggestionEntries.length > 0 ? 'stage-options-all' : undefined;
  const stageHintLines = useMemo(() => {
    const labels = {
      group: 'Gruppen',
      knockout: 'KO',
      placement: 'Platzierung'
    };
    return Object.entries(stageHintsByPhase)
      .filter(([, entries]) => Array.isArray(entries) && entries.length > 0)
      .map(([phase, entries]) => `${labels[phase] ?? phase}: ${entries.join(', ')}`);
  }, [stageHintsByPhase]);
  const stageLabelPlaceholder =
    contextForm.stageType === 'group'
      ? 'z.B. Gruppe A'
      : contextForm.stageType === 'knockout'
        ? 'z.B. Viertelfinale'
        : contextForm.stageType === 'placement'
          ? 'z.B. Spiel um Platz 3 / 4'
          : 'z.B. Viertelfinale oder Spiel um Platz 3 / 4';

  const displayView = scoreboard?.displayView ?? 'scoreboard';
  const formattedRemaining = useMemo(() => formatTime(scoreboard?.remainingSeconds ?? 0), [scoreboard?.remainingSeconds]);
  const statusLabel = useMemo(() => {
    if (scoreboard?.isHalftimeBreak) return 'Halbzeitpause';
    if (scoreboard?.isExtraTime) return scoreboard?.isRunning ? 'Nachspielzeit' : 'Nachspielzeit (Pause)';
    return scoreboard?.isRunning ? 'läuft' : 'pausiert';
  }, [scoreboard?.isHalftimeBreak, scoreboard?.isExtraTime, scoreboard?.isRunning]);
  const liveStateLabel = scoreboard?.isHalftimeBreak
    ? 'Halbzeitpause'
    : scoreboard?.isRunning
      ? 'läuft'
      : 'pausiert';
  const activeStructure = useMemo(
    () => (expandedTournamentId && structureTournamentId === expandedTournamentId ? tournamentStructure : null),
    [expandedTournamentId, structureTournamentId, tournamentStructure]
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

  const scoreboardSummaryCard = scoreboard ? (
    <section
      style={{
        border: '1px solid #0b1a2b',
        borderRadius: '16px',
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(11,26,43,0.9), rgba(7,54,94,0.9))',
        color: '#f3f7ff',
        display: 'grid',
        gap: '0.9rem'
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.78 }}>
            Spielübersicht
          </span>
          <strong style={{ fontSize: '1.4rem' }}>
            {scoreboard.teamAName} {scoreboard.scoreA ?? 0} : {scoreboard.scoreB ?? 0} {scoreboard.teamBName}
          </strong>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(255,255,255,0.18)', fontSize: '0.85rem' }}>
            {formattedRemaining} · {liveStateLabel}
          </span>
          {scoreboard.stageType && scoreboard.stageLabel ? (
            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'rgba(255,255,255,0.12)', fontSize: '0.85rem' }}>
              {scoreboard.stageType === 'group' ? `Gruppe ${scoreboard.stageLabel}` : scoreboard.stageLabel}
            </span>
          ) : null}
        </div>
      </header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
        {scoreboard.tournamentName ? (
          <span>
            Turnier: <strong>{scoreboard.tournamentName}</strong>
          </span>
        ) : (
          <span>Kein Turnier hinterlegt</span>
        )}
        {scoreboard.scheduleCode ? (
          <span>Matchcode: <strong>{scoreboard.scheduleCode}</strong></span>
        ) : null}
        <span>Anzeige: {displayView === 'bracket' ? 'Turnierbaum' : 'Live-Spielstand'}</span>
      </div>
    </section>
  ) : null;

  function updateMessage(type, message) {
    if (type === 'error') {
      setError(message);
      setInfo('');
    } else {
      setInfo(message);
      setError('');
    }
  }

  const handleAudioTriggerLabelChange = useCallback((key, value) => {
    setAudioTriggerLabels((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleAudioTriggerToggle = useCallback(
    async (key, nextState) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await updateAudioTrigger(key, { isActive: nextState });
        await loadAudioData();
        updateMessage('info', nextState ? 'Sound aktiviert.' : 'Sound deaktiviert.');
      } catch (err) {
        console.error('Audio-Trigger konnte nicht aktualisiert werden.', err);
        updateMessage('error', 'Audio-Trigger konnte nicht aktualisiert werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData]
  );

  const handleAudioTriggerUpload = useCallback(
    async (key, file) => {
      if (!file) {
        return;
      }
      setAudioUploadBusy((prev) => ({ ...prev, [key]: true }));
      try {
        const label = (audioTriggerLabels[key] ?? '').trim();
        await uploadAudioTriggerFile(key, file, label || undefined);
        setAudioTriggerLabels((prev) => ({ ...prev, [key]: '' }));
        await loadAudioData();
        updateMessage('info', 'Audiodatei gespeichert.');
      } catch (err) {
        console.error('Audiodatei konnte nicht gespeichert werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht gespeichert werden.');
      } finally {
        setAudioUploadBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [audioTriggerLabels, loadAudioData]
  );

  const handleAudioTriggerAssign = useCallback(
    async (key, fileId) => {
      if (!fileId) {
        return;
      }
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      const numeric = Number(fileId);
      try {
        await assignAudioTriggerFile(key, Number.isFinite(numeric) ? numeric : null);
        await loadAudioData();
        updateMessage('info', 'Audiodatei verknüpft.');
      } catch (err) {
        console.error('Audiodatei konnte nicht verknüpft werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht verknüpft werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData]
  );

  const handleAudioTriggerClear = useCallback(
    async (key) => {
      setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
      try {
        await assignAudioTriggerFile(key, null);
        await loadAudioData();
        updateMessage('info', 'Soundzuordnung entfernt.');
      } catch (err) {
        console.error('Soundzuordnung konnte nicht entfernt werden.', err);
        updateMessage('error', 'Soundzuordnung konnte nicht entfernt werden.');
      } finally {
        setAudioTriggerBusy((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadAudioData]
  );

  const handleAudioTriggerPreview = useCallback(async (key) => {
    setAudioTriggerBusy((prev) => ({ ...prev, [key]: true }));
    try {
      await playAudioTriggerPreview(key);
      updateMessage('info', 'Sound ausgelöst.');
    } catch (err) {
      console.error('Sound konnte nicht abgespielt werden.', err);
      updateMessage('error', 'Sound konnte nicht abgespielt werden.');
    } finally {
      setAudioTriggerBusy((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  const handleAudioLibraryUpload = useCallback(
    async (file) => {
      if (!file) {
        return;
      }
      setAudioLoading(true);
      try {
        const label = audioLibraryUploadLabel.trim();
        await uploadAudioLibraryFile(file, label || undefined);
        setAudioLibraryUploadLabel('');
        await loadAudioData();
        updateMessage('info', 'Audiodatei hinzugefügt.');
      } catch (err) {
        console.error('Audiodatei konnte nicht hochgeladen werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht hochgeladen werden.');
      } finally {
        setAudioLoading(false);
      }
    },
    [audioLibraryUploadLabel, loadAudioData]
  );

  const handleAudioLibraryDelete = useCallback(
    async (fileId) => {
      setAudioManualBusy((prev) => ({ ...prev, [fileId]: true }));
      try {
        await deleteAudioLibraryFile(fileId);
        await loadAudioData();
        updateMessage('info', 'Audiodatei gelöscht.');
      } catch (err) {
        console.error('Audiodatei konnte nicht gelöscht werden.', err);
        updateMessage('error', 'Audiodatei konnte nicht gelöscht werden.');
      } finally {
        setAudioManualBusy((prev) => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    },
    [loadAudioData]
  );

  const handleAudioLibraryPlay = useCallback(async (fileId) => {
    setAudioManualBusy((prev) => ({ ...prev, [fileId]: true }));
    try {
      await playAudioLibraryFile(fileId);
      updateMessage('info', 'Sound ausgelöst.');
    } catch (err) {
      console.error('Sound konnte nicht ausgelöst werden.', err);
      updateMessage('error', 'Sound konnte nicht ausgelöst werden.');
    } finally {
      setAudioManualBusy((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
  }, []);

  async function handleDisplayViewChange(targetView) {
    const normalized = typeof targetView === 'string' ? targetView : '';
    if (!normalized || scoreboard?.displayView === normalized) {
      return;
    }

    setDisplayViewPending(true);
    try {
      await setDisplayView(normalized);
      const successMessage =
        normalized === 'scoreboard'
          ? 'Beamer zeigt jetzt den Live-Spielstand.'
          : 'Beamer zeigt jetzt den Turnierbaum.';
      updateMessage('info', successMessage);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Anzeige-Modus konnte nicht aktualisiert werden.');
    } finally {
      setDisplayViewPending(false);
    }
  }

  function handleTeamInputChange(field, value) {
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
  }

  function handleTeamSelectChange(field, value) {
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
  }

  function handlePlayerCreateChange(field, value) {
    setPlayerCreate((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePlayerCreateSubmit(event) {
    event.preventDefault();

    if (!playerCreate.teamId) {
      updateMessage('error', 'Bitte ein Team auswählen.');
      return;
    }
    if (!playerCreate.name.trim()) {
      updateMessage('error', 'Bitte einen Spielernamen eingeben.');
      return;
    }

    let jerseyNumber;
    const jerseyValue = (playerCreate.jerseyNumber ?? '').toString().trim();
    if (jerseyValue) {
      const parsed = Number(jerseyValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        updateMessage('error', 'Bitte eine gültige Rückennummer angeben.');
        return;
      }
      jerseyNumber = parsed;
    }

    const payload = {
      teamId: Number(playerCreate.teamId),
      name: playerCreate.name.trim(),
      jerseyNumber,
      position: playerCreate.position.trim()
    };

    try {
      await createPlayer(payload);
      setPlayerCreate((prev) => ({ teamId: prev.teamId, name: '', jerseyNumber: '', position: '' }));
      updateMessage('info', 'Spieler angelegt.');
      loadPlayers();
      refreshActiveTeams();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spieler konnte nicht angelegt werden.');
    }
  }

  function startPlayerEdit(player) {
    setPlayerEdits((prev) => ({
      ...prev,
      [player.id]: {
        name: player.name ?? '',
        jerseyNumber: player.jersey_number ?? '',
        position: player.position ?? '',
        teamId: player.team_id ? String(player.team_id) : '',
        editing: true
      }
    }));
  }

  function cancelPlayerEdit(id) {
    setPlayerEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handlePlayerEditChange(id, field, value) {
    setPlayerEdits((prev) => {
      const current = prev[id];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [id]: { ...current, [field]: value }
      };
    });
  }

  async function handlePlayerUpdateSubmit(id) {
    const edit = playerEdits[id];
    if (!edit) {
      return;
    }

    if (!edit.name.trim()) {
      updateMessage('error', 'Bitte einen Spielernamen eingeben.');
      return;
    }

    let jerseyNumber;
    const jerseyValue = (edit.jerseyNumber ?? '').toString().trim();
    if (jerseyValue) {
      const parsed = Number(jerseyValue);
      if (!Number.isFinite(parsed) || parsed < 0) {
        updateMessage('error', 'Bitte eine gültige Rückennummer angeben.');
        return;
      }
      jerseyNumber = parsed;
    }

    const original = players.find((player) => player.id === id);
    const payload = {
      name: edit.name.trim(),
      jerseyNumber,
      position: edit.position.trim(),
      teamId: edit.teamId ? Number(edit.teamId) : original?.team_id
    };

    if (payload.teamId == null) {
      updateMessage('error', 'Bitte ein Team auswählen.');
      return;
    }

    try {
      await updatePlayer(id, payload);
      updateMessage('info', 'Spieler aktualisiert.');
      cancelPlayerEdit(id);
      loadPlayers();
      refreshActiveTeams();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spieler konnte nicht aktualisiert werden.');
    }
  }

  async function handlePlayerDelete(id) {
    if (!window.confirm('Spieler wirklich löschen?')) {
      return;
    }

    try {
      await deletePlayer(id);
      updateMessage('info', 'Spieler gelöscht.');
      setPlayerEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      loadPlayers();
      refreshActiveTeams();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spieler konnte nicht gelöscht werden.');
    }
  }

  async function handleTeamSubmit(event) {
    event.preventDefault();

    const payload = {};

    if (teamForm.teamAId) {
      const numeric = Number(teamForm.teamAId);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        updateMessage('error', 'Ungültige Auswahl für Team A.');
        return;
      }
      payload.teamAId = numeric;
    } else if (teamForm.teamAName.trim()) {
      payload.teamAName = teamForm.teamAName;
    }

    if (teamForm.teamBId) {
      const numeric = Number(teamForm.teamBId);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        updateMessage('error', 'Ungültige Auswahl für Team B.');
        return;
      }
      payload.teamBId = numeric;
    } else if (teamForm.teamBName.trim()) {
      payload.teamBName = teamForm.teamBName;
    }

    if (Object.keys(payload).length === 0) {
      updateMessage('error', 'Bitte mindestens ein Team setzen oder benennen.');
      return;
    }

    try {
      await updateTeams(payload);
      setTeamDirty(false);
      updateMessage('info', 'Teamnamen aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Teamnamen konnten nicht gespeichert werden.');
    }
  }

  async function handleScore(team, points) {
    const teamKey = team === 'b' ? 'b' : 'a';
    const selected = selectedScorer[teamKey];
    const payload = {};

    if (selected) {
      payload.playerId = Number(selected);
    }

    if (points > 0) {
      payload.shotType = points === 3 ? 'three' : points === 2 ? 'field' : 'free';
    } else {
      payload.affectStats = false;
    }

    try {
      await mutateScore(team, points, payload);
      const roster = scoreboard?.players?.[teamKey] ?? [];
      const playerName = selected
        ? roster.find((player) => String(player.playerId) === String(selected))?.name ?? null
        : null;
      const baseMessage = `${points > 0 ? '+' : ''}${points} Punkte für Team ${team.toUpperCase()}`;
      updateMessage('info', playerName ? `${baseMessage} (${playerName}).` : `${baseMessage}.`);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Punkte konnten nicht aktualisiert werden.');
    }
  }

  function handleManualScoreChange(team, value) {
    setManualScores((prev) => ({ ...prev, [team]: value }));
    setManualDirty((prev) => ({ ...prev, [team]: true }));
  }

  async function handleManualScoreSubmit(event, team) {
    event.preventDefault();
    const rawValue = manualScores[team];
    const numeric = Number(rawValue);

    if (!Number.isFinite(numeric) || numeric < 0) {
      updateMessage('error', 'Bitte einen gültigen Wert (>= 0) eingeben.');
      return;
    }

    try {
      await setScoreAbsolute(team, Math.trunc(numeric));
      setManualDirty((prev) => ({ ...prev, [team]: false }));
      updateMessage('info', `Punktestand für Team ${team.toUpperCase()} gesetzt.`);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Punktestand konnte nicht gesetzt werden.');
    }
  }

  async function handleResetScores() {
    try {
      await resetScoreboard();
      setManualDirty({ a: false, b: false });
      updateMessage('info', 'Punktestand zurückgesetzt.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Punktestand konnte nicht zurückgesetzt werden.');
    }
  }

  function handlePenaltyFormChange(teamKey, field, value) {
    setPenaltyForms((prev) => ({
      ...prev,
      [teamKey]: { ...prev[teamKey], [field]: value }
    }));
  }

  function resolvePenaltyDuration(form) {
    if (form.preset === 'custom') {
      const seconds = parseTimerInput(form.custom);
      return seconds;
    }
    const presetSeconds = Number(form.preset);
    if (!Number.isFinite(presetSeconds) || presetSeconds <= 0) {
      return null;
    }
    return presetSeconds;
  }

  async function handlePenaltySubmit(event, teamKey) {
    event.preventDefault();
    const form = penaltyForms[teamKey];
    const seconds = resolvePenaltyDuration(form);

    if (seconds === null || seconds <= 0) {
      updateMessage('error', 'Bitte eine gültige Zeit für die Zeitstrafe angeben.');
      return;
    }

    try {
      await addPenalty(teamKey, form.name, seconds, {
        playerId: form.playerId ? Number(form.playerId) : undefined
      });
      setPenaltyForms((prev) => ({
        ...prev,
        [teamKey]: { name: '', preset: '60', custom: '', playerId: '' }
      }));
      updateMessage('info', `Zeitstrafe für Team ${teamKey.toUpperCase()} hinzugefügt.`);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Zeitstrafe konnte nicht hinzugefügt werden.');
    }
  }

  async function handlePenaltyRemove(id) {
    try {
      await removePenalty(id);
      updateMessage('info', 'Zeitstrafe entfernt.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Zeitstrafe konnte nicht entfernt werden.');
    }
  }

  async function handleHalftimeSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(halftimeInput);
    if (seconds === null || seconds < 0) {
      updateMessage('error', 'Bitte eine gültige Halbzeitzeit eingeben (z.B. 10:00 oder 600).');
      return;
    }

    try {
      await setHalftime(seconds);
      setHalftimeDirty(false);
      updateMessage('info', 'Halbzeit aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Halbzeit konnte nicht gespeichert werden.');
    }
  }

  async function handleHalftimePauseSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(halftimePauseInput);
    if (seconds === null || seconds < 0) {
      updateMessage('error', 'Bitte eine gültige Halbzeitpausen-Dauer eingeben (z.B. 05:00 oder 300).');
      return;
    }

    try {
      await setHalftimePause(seconds);
      setHalftimePauseDirty(false);
      updateMessage('info', 'Halbzeitpause aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Halbzeitpause konnte nicht gespeichert werden.');
    }
  }

  async function handleExtraTimeSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(extraTimeInput);
    if (seconds === null || seconds < 0) {
      updateMessage('error', 'Bitte eine gültige Nachspielzeit eingeben (z.B. 02:00 oder 120).');
      return;
    }

    try {
      await setExtraTime(seconds);
      setExtraDirty(false);
      updateMessage('info', 'Nachspielzeit aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Nachspielzeit konnte nicht gespeichert werden.');
    }
  }

  async function handleTimerSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(timerInput);
    if (seconds === null) {
      updateMessage('error', 'Bitte eine gültige Zeit eingeben (z.B. 10:00 oder 600).');
      return;
    }

    try {
      setSubmittingTimer(true);
      await setScoreboardTimer(seconds);
      setTimerInput('');
      updateMessage('info', 'Spielzeit aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spielzeit konnte nicht gespeichert werden.');
    } finally {
      setSubmittingTimer(false);
    }
  }

  async function handleStart() {
    try {
      await startScoreboardTimer();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spielzeit konnte nicht gestartet werden.');
    }
  }

  async function handlePause() {
    try {
      await pauseScoreboardTimer();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spielzeit konnte nicht pausiert werden.');
    }
  }

  async function handleFinishGame() {
    try {
      const nextState = await finishGame();
      if (nextState && typeof nextState === 'object') {
        setScoreboard(nextState);
      }
      setManualDirty({ a: false, b: false });
      updateMessage('info', 'Spiel beendet. Bitte bei Bedarf den Spielstand speichern.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht beendet werden.');
    }
  }

  async function handleSaveGame() {
    if (scoreboard?.isRunning) {
      updateMessage('error', 'Spiel läuft noch. Bitte zuerst beenden.');
      return;
    }

    if (!window.confirm('Aktuellen Spielstand speichern?')) {
      return;
    }

    try {
      await saveCurrentGame();
      updateMessage('info', 'Spiel gespeichert.');
      loadHistory();
      setActiveTab('history');
      cancelHistoryEdit();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht gespeichert werden.');
    }
  }

  async function handleNewGame() {
    try {
      const newState = await startNewGame();
      setScoreboard(newState);
      setTeamDirty(false);
      setManualDirty({ a: false, b: false });
      setPenaltyForms(createPenaltyForms());
      setHalftimeDirty(false);
      setHalftimePauseDirty(false);
      setExtraDirty(false);
      setTimerInput('');
      updateMessage('info', 'Neues Spiel vorbereitet.');
      loadHistory();
      setActiveTab('control');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Neues Spiel konnte nicht gestartet werden.');
    }
  }

  function handleContextFormChange(field, value) {
    setContextFormDirty(true);
    setContextForm((prev) => {
      if (field === 'stageType') {
        return {
          ...prev,
          stageType: value,
          stageLabel: ''
        };
      }

      if (field === 'stageLabel') {
        const raw = typeof value === 'string' ? value : String(value ?? '');
        const trimmed = raw.trim();
        const normalized = trimmed.toLowerCase();
        const match = stageLabelMapRef.current.get(normalized);

        let nextStageType = prev.stageType || '';
        if (match) {
          if (!nextStageType || !match.phases.includes(nextStageType)) {
            [nextStageType] = match.phases;
          }
        }

        const canonical = nextStageType === 'group' ? canonicalizeGroupLabel(raw) : trimmed;

        return {
          ...prev,
          stageType: nextStageType,
          stageLabel: nextStageType ? canonical : trimmed
        };
      }

      return { ...prev, [field]: value };
    });
  }

  async function handleContextSubmit(event) {
    event.preventDefault();
    const trimmedLabel = (contextForm.stageLabel ?? '').trim();
    const payload = {
      tournamentId: contextForm.tournamentId ? Number(contextForm.tournamentId) : null,
      stageType: contextForm.stageType || null,
      stageLabel: contextForm.stageType ? trimmedLabel : ''
    };

    if (payload.stageType && !payload.stageLabel) {
      updateMessage('error', 'Bitte eine Phasenbezeichnung angeben.');
      return;
    }

    try {
      const updated = await updateMatchContext(payload);
      setScoreboard(updated);
      updateMessage('info', 'Match-Kontext aktualisiert.');
      setContextFormDirty(false);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Match-Kontext konnte nicht gesetzt werden.');
    }
  }

  function handleScheduleDraftChange(entryId, value) {
    const key = String(entryId);
    setScheduleDrafts((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function handleScheduleDraftSubmit(entryId, overrideValue = undefined) {
    if (!resolvedTournamentId) {
      updateMessage('error', 'Bitte zuerst ein Turnier im Match-Kontext auswählen.');
      return;
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
        return;
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
    } finally {
      setScheduleSaving((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function handleScheduleDraftClear(entryId) {
    const key = String(entryId);
    setScheduleDrafts((prev) => ({
      ...prev,
      [key]: ''
    }));
    await handleScheduleDraftSubmit(entryId, '');
  }

  async function handleScheduleMatchApply(code) {
    const selectedCode = String(code ?? '').trim();
    if (!selectedCode) {
      updateMessage('error', 'Bitte ein Match aus dem Spielplan auswählen.');
      return;
    }
    if (!resolvedTournamentId) {
      updateMessage('error', 'Bitte zuerst ein Turnier im Match-Kontext auswählen.');
      return;
    }

    const match = scheduleOptionData.matchMap.get(selectedCode);
    if (!match) {
      updateMessage('error', 'Das ausgewählte Match konnte im Spielplan nicht gefunden werden.');
      return;
    }

    if (match.result?.hasResult) {
      const confirmReuse = window.confirm(
        'Für dieses Match wurde bereits ein Ergebnis gespeichert. Soll es trotzdem übernommen werden?'
      );
      if (!confirmReuse) {
        return;
      }
    }

    setScheduleSelection(selectedCode);

    try {
      const response = await selectScheduleMatch(resolvedTournamentId, selectedCode);
      const nextState = response?.scoreboard ?? null;
      if (!nextState) {
        updateMessage('error', 'Aktualisierter Scoreboard-Status nicht verfügbar.');
        return;
      }

      setScoreboard(nextState);
      setTeamDirty(false);
      setTeamForm({
        teamAName: nextState.teamAName ?? '',
        teamBName: nextState.teamBName ?? '',
        teamAId: nextState.teamAId ? String(nextState.teamAId) : '',
        teamBId: nextState.teamBId ? String(nextState.teamBId) : ''
      });
      setManualScores({
        a: String(nextState.scoreA ?? 0),
        b: String(nextState.scoreB ?? 0)
      });
      setManualDirty({ a: false, b: false });
      setContextForm({
        tournamentId: nextState.tournamentId ? String(nextState.tournamentId) : '',
        stageType: nextState.stageType ?? '',
        stageLabel: nextState.stageType === 'group' ? nextState.stageLabel : nextState.stageLabel ?? ''
      });
      setContextFormDirty(false);
      setPenaltyForms(createPenaltyForms());
      setHalftimeInput(formatTime(nextState.halftimeSeconds ?? 0));
      setHalftimePauseInput(formatTime(nextState.halftimePauseSeconds ?? 0));
      setExtraTimeInput(formatTime(nextState.extraSeconds ?? 0));
      setHalftimeDirty(false);
      setHalftimePauseDirty(false);
      setExtraDirty(false);
      setSchedulePickerCode(nextState.scheduleCode ?? selectedCode);
      updateMessage('info', 'Match aus Spielplan übernommen.');
    } catch (error) {
      console.error(error);
      updateMessage('error', 'Spielplan-Match konnte nicht übernommen werden.');
    } finally {
      setScheduleSelection('');
    }
  }

  function handleTournamentDetailsToggle(id) {
    setExpandedTournamentId((prev) => (prev === id ? null : id));
  }

  function handleSlotNameChange(slotNumber, value) {
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
        placeholder: trimmed || previous.placeholder || `Team ${slotNumber}`,
        teamId
      };
      return next;
    });
  }

  function handleSlotTeamSelect(slotNumber, value) {
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
          placeholder: selectedName || `Team ${slotNumber}`
        };
      } else {
        next[key] = {
          ...previous,
          teamId: '',
          name: previous.name,
          placeholder: (previous.name ?? '').trim() || `Team ${slotNumber}`
        };
      }
      return next;
    });
  }

  function handleSlotReset(slotNumber) {
    const key = String(slotNumber);
    setSlotAssignments((prev) => {
      const next = { ...prev };
      if (slotInitialAssignments[key]) {
        next[key] = { ...slotInitialAssignments[key] };
      } else {
        next[key] = {
          name: `Team ${slotNumber}`,
          placeholder: `Team ${slotNumber}`,
          teamId: ''
        };
      }
      return next;
    });
  }

  function handleResetAllSlots() {
    setSlotAssignments(() => {
      const next = {};
      Object.entries(slotInitialAssignments).forEach(([key, value]) => {
        next[key] = { ...value };
      });
      return next;
    });
  }

  function handleTournamentStructureRefresh() {
    if (expandedTournamentId) {
      loadTournamentStructure(expandedTournamentId);
    }
  }

  async function handleTournamentAssignmentsSave() {
    if (!expandedTournamentId) {
      return;
    }

    const assignments = Object.entries(slotAssignments).map(([slotKey, entry]) => {
      const slotNumber = Number(slotKey);
      const trimmedName = (entry?.name ?? '').trim();
      const teamIdValue = entry?.teamId ? Number(entry.teamId) : null;
      const fallback =
        (entry?.teamId ? teamNameById.get(entry.teamId) : null) ||
        slotInitialAssignments[slotKey]?.name ||
        `Team ${slotNumber}`;
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
      updateMessage('info', 'Teamzuweisungen gespeichert.');
    } catch (error) {
      console.error(error);
      setStructureError('Teamzuweisungen konnten nicht gespeichert werden.');
      updateMessage('error', 'Teamzuweisungen konnten nicht gespeichert werden.');
    } finally {
      setStructureSaving(false);
    }
  }

  function handleTournamentFormChange(field, value) {
    setTournamentForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleTournamentFormSubmit(event) {
    event.preventDefault();
    if (!tournamentForm.name.trim()) {
      updateMessage('error', 'Turniername darf nicht leer sein.');
      return;
    }

    try {
      await createTournament({
        name: tournamentForm.name,
        group_count: Number(tournamentForm.group_count || 0),
        knockout_rounds: Number(tournamentForm.knockout_rounds || 0),
        team_count: Number(tournamentForm.team_count || 0),
        classification_mode: tournamentForm.classification_mode,
        is_public: Boolean(tournamentForm.is_public)
      });
      setTournamentForm({
        name: '',
        group_count: '',
        knockout_rounds: '',
        team_count: '',
        classification_mode: 'top4',
        is_public: false
      });
      loadTournaments();
      updateMessage('info', 'Turnier erstellt.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Turnier konnte nicht erstellt werden.');
    }
  }

  function startTournamentEdit(tournament) {
    setTournamentEdits((prev) => ({
      ...prev,
      [tournament.id]: {
        name: tournament.name,
        group_count: String(tournament.group_count ?? 0),
        knockout_rounds: String(tournament.knockout_rounds ?? 0),
        team_count: String(tournament.team_count ?? 0),
        classification_mode: tournament.classification_mode ?? 'top4',
        is_public: Boolean(tournament.is_public)
      }
    }));
  }

  function handleTournamentEditChange(id, field, value) {
    setTournamentEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  }

  function cancelTournamentEdit(id) {
    setTournamentEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleTournamentSave(id) {
    const draft = tournamentEdits[id];
    if (!draft || !draft.name.trim()) {
      updateMessage('error', 'Turniername darf nicht leer sein.');
      return;
    }

    try {
      await updateTournament(id, {
        name: draft.name,
        group_count: Number(draft.group_count || 0),
        knockout_rounds: Number(draft.knockout_rounds || 0),
        team_count: Number(draft.team_count || 0),
        classification_mode: draft.classification_mode,
        is_public: Boolean(draft.is_public)
      });
      cancelTournamentEdit(id);
      loadTournaments();
      updateMessage('info', 'Turnier aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Turnier konnte nicht aktualisiert werden.');
    }
  }

  async function handleTournamentDelete(id) {
    if (!window.confirm('Turnier wirklich löschen?')) {
      return;
    }

    try {
      await deleteTournament(id);
      cancelTournamentEdit(id);
      if (scoreboard?.tournamentId === id) {
        const updated = await updateMatchContext({ tournamentId: null, stageType: null, stageLabel: '' });
        setScoreboard(updated);
      }
      loadTournaments();
      updateMessage('info', 'Turnier gelöscht.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Turnier konnte nicht gelöscht werden.');
    }
  }

  async function handleTeamCreateSubmit(event) {
    event.preventDefault();
    const trimmed = teamCreateName.trim();
    if (!trimmed) {
      updateMessage('error', 'Teamname darf nicht leer sein.');
      return;
    }

    try {
      await createTeam({ name: trimmed });
      setTeamCreateName('');
      loadTeams();
      updateMessage('info', 'Team angelegt.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Team konnte nicht angelegt werden.');
    }
  }

  function startTeamEdit(team) {
    setTeamEdits((prev) => ({
      ...prev,
      [team.id]: { name: team.name }
    }));
  }

  function handleTeamEditChange(id, value) {
    setTeamEdits((prev) => ({
      ...prev,
      [id]: { name: value }
    }));
  }

  function cancelTeamEdit(id) {
    setTeamEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleTeamSave(id) {
    const draft = teamEdits[id];
    if (!draft || !draft.name.trim()) {
      updateMessage('error', 'Teamname darf nicht leer sein.');
      return;
    }

    try {
      await updateTeam(id, { name: draft.name });
      cancelTeamEdit(id);
      loadTeams();
      updateMessage('info', 'Team aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Team konnte nicht aktualisiert werden.');
    }
  }

  async function handleTeamDelete(id) {
    if (!window.confirm('Team wirklich löschen?')) {
      return;
    }

    try {
      await deleteTeam(id);
      cancelTeamEdit(id);
      loadTeams();
      updateMessage('info', 'Team gelöscht.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Team konnte nicht gelöscht werden.');
    }
  }

  function startHistoryEdit(game) {
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
  }

  function handleHistoryEditChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function cancelHistoryEdit() {
    setEditingGameId(null);
    setEditForm(null);
  }

  async function handleHistoryEditSubmit(event) {
    event.preventDefault();
    if (!editingGameId || !editForm) return;

    const payload = {};

    const teamA = editForm.team_a?.trim();
    if (!teamA) {
      updateMessage('error', 'Team A darf nicht leer sein.');
      return;
    }
    payload.team_a = teamA;

    const teamB = editForm.team_b?.trim();
    if (!teamB) {
      updateMessage('error', 'Team B darf nicht leer sein.');
      return;
    }
    payload.team_b = teamB;

    const scoreA = Number(editForm.score_a);
    if (!Number.isFinite(scoreA) || scoreA < 0) {
      updateMessage('error', 'Score Team A muss >= 0 sein.');
      return;
    }
    payload.score_a = Math.trunc(scoreA);

    const scoreB = Number(editForm.score_b);
    if (!Number.isFinite(scoreB) || scoreB < 0) {
      updateMessage('error', 'Score Team B muss >= 0 sein.');
      return;
    }
    payload.score_b = Math.trunc(scoreB);

    const extraSecondsInput = editForm.extra_seconds?.trim();
    if (extraSecondsInput) {
      const parsed = parseTimerInput(extraSecondsInput);
      if (parsed === null) {
        updateMessage('error', 'Nachspielzeit (geplant) ist ungültig.');
        return;
      }
      payload.extra_seconds = parsed;
    }

    const extraElapsedInput = editForm.extra_elapsed_seconds?.trim();
    if (extraElapsedInput) {
      const parsed = parseTimerInput(extraElapsedInput);
      if (parsed === null) {
        updateMessage('error', 'Nachspielzeit (gelaufen) ist ungültig.');
        return;
      }
      payload.extra_elapsed_seconds = parsed;
    }

    const penaltyCountA = Number(editForm.penalty_count_a);
    const penaltyCountB = Number(editForm.penalty_count_b);
    if (!Number.isFinite(penaltyCountA) || penaltyCountA < 0) {
      updateMessage('error', 'Strafen Team A muss >= 0 sein.');
      return;
    }
    if (!Number.isFinite(penaltyCountB) || penaltyCountB < 0) {
      updateMessage('error', 'Strafen Team B muss >= 0 sein.');
      return;
    }

    payload.penalties = {
      a: Array.from({ length: Math.trunc(penaltyCountA) }, (_, idx) => ({
        id: `a-${editingGameId}-${idx}`,
        team: 'a',
        name: `Strafe ${idx + 1}`,
        remainingSeconds: 0,
        totalSeconds: 0,
        isExpired: true
      })),
      b: Array.from({ length: Math.trunc(penaltyCountB) }, (_, idx) => ({
        id: `b-${editingGameId}-${idx}`,
        team: 'b',
        name: `Strafe ${idx + 1}`,
        remainingSeconds: 0,
        totalSeconds: 0,
        isExpired: true
      }))
    };

    try {
      await updateHistoryGame(editingGameId, payload);
      updateMessage('info', 'Spiel aktualisiert.');
      cancelHistoryEdit();
      loadHistory();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht gespeichert werden.');
    }
  }

  async function handleHistoryDelete(id) {
    if (!window.confirm('Gespeichertes Spiel wirklich löschen?')) {
      return;
    }

    try {
      await deleteHistoryGame(id);
      if (editingGameId === id) {
        cancelHistoryEdit();
      }
      updateMessage('info', 'Spiel gelöscht.');
      loadHistory();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht gelöscht werden.');
    }
  }

  if (loading) {
    return <p>Lade Scoreboard...</p>;
  }

  if (!scoreboard) {
    return <p>Scoreboard-Daten nicht verfügbar.</p>;
  }

  const describeAudioFile = (file) => {
    if (!file) {
      return '';
    }
    if (file.label && file.label.trim()) {
      return file.label.trim();
    }
    if (file.original_name) {
      return file.original_name;
    }
    return `Sound #${file.id}`;
  };

  const describeScheduleMatch = (entry) => {
    if (!entry) {
      return '';
    }

    const roundPart = entry.phase === 'group' && entry.round_number
      ? ` · Runde ${entry.round_number}`
      : '';

    return `${entry.stage_label || 'Phase'}${roundPart} – ${entry.home_label} vs ${entry.away_label}`;
  };

  const selectedScheduleMatch = scheduleOptionData.matchMap.get(schedulePickerCode ?? '');
  const activeScheduleMatch = scoreboard?.scheduleCode
    ? scheduleOptionData.matchMap.get(scoreboard.scheduleCode)
    : null;

  const controlContent = (
    <>
      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Beameranzeige</h3>
        <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#555' }}>
          Wähle, was auf der Beameranzeige gezeigt wird.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {DISPLAY_VIEW_OPTIONS.map((option) => {
            const isActive = displayView === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleDisplayViewChange(option.id)}
                disabled={isActive || displayViewPending}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid #0b1a2b',
                  background: isActive ? '#0b1a2b' : 'transparent',
                  color: isActive ? '#fff' : '#0b1a2b',
                  fontWeight: 600,
                  cursor: isActive ? 'default' : 'pointer',
                  opacity: displayViewPending && !isActive ? 0.7 : 1
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {displayView === 'bracket' && !scoreboard?.tournamentId ? (
          <p style={{ marginTop: '0.75rem', color: '#b26a00' }}>
            Hinweis: Für den Turnierbaum muss ein Turnier im Match-Kontext gesetzt werden.
          </p>
        ) : null}
        {displayViewPending ? (
          <p style={{ marginTop: '0.75rem', color: '#555' }}>Aktualisiere Anzeige...</p>
        ) : null}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Match-Kontext</h3>
        <form onSubmit={handleContextSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Turnier
            <select
              value={contextForm.tournamentId}
              onChange={(event) => handleContextFormChange('tournamentId', event.target.value)}
              disabled={tournamentsLoading}
            >
              <option value="">Kein Turnier</option>
              {tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Phase
            <select
              value={contextForm.stageType}
              onChange={(event) => handleContextFormChange('stageType', event.target.value)}
            >
              <option value="">Keine Phase</option>
              <option value="group">Gruppenphase</option>
              <option value="knockout">KO-Runde</option>
              <option value="placement">Platzierung</option>
            </select>
          </label>

          {contextForm.stageType && (
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              {contextForm.stageType === 'group'
                ? 'Gruppenbezeichnung'
                : contextForm.stageType === 'knockout'
                  ? 'Rundenbezeichnung'
                  : 'Platzierungsbezeichnung'}
              <input
                value={contextForm.stageLabel}
                onChange={(event) => handleContextFormChange('stageLabel', event.target.value)}
                placeholder={stageLabelPlaceholder}
                list={stageListId}
              />
              {stageListId ? (
                <datalist id={stageListId}>
                  {stageSuggestionEntries.map((entry) => (
                    <option key={`${stageListId}-${entry.label}`} value={entry.label} />
                  ))}
                </datalist>
              ) : null}
              {stageOptionsLoading ? (
                <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>Lade verfügbare Phasen ...</span>
              ) : stageHintLines.length > 0 ? (
                <>
                  <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                    Vorschläge: {stageHintLines.join(' · ')}
                  </span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                    Tipp: Auswahl eines bekannten Labels setzt die passende Phase automatisch.
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>
                  Noch keine Vorschläge verfügbar.
                </span>
              )}
            </label>
          )}

          <button type="submit">Match-Kontext aktualisieren</button>
        </form>
        {tournamentsError && <p style={{ marginTop: '0.75rem', color: 'crimson' }}>{tournamentsError}</p>}
        {scoreboard?.tournamentName && (
          <p style={{ marginTop: '0.75rem' }}>
            Aktuelles Turnier: <strong>{scoreboard.tournamentName}</strong>
            {scoreboard.stageType && scoreboard.stageLabel ? (
              <>
                {' · '}
                {scoreboard.stageType === 'group' ? `Gruppe ${scoreboard.stageLabel}` : scoreboard.stageLabel}
              </>
            ) : null}
            {scoreboard.scheduleCode ? (
              <>
                {' · '}Matchcode {scoreboard.scheduleCode}
              </>
            ) : null}
          </p>
        )}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Spielplan-Matches</h3>
        <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#555' }}>
          Übernehme geplante Paarungen direkt aus dem Spielplan, damit Teams, Phase und Spielcode automatisch gesetzt werden.
        </p>
        {!resolvedTournamentId ? (
          <p>Bitte zuerst ein Turnier im Match-Kontext auswählen.</p>
        ) : scheduleLoading ? (
          <p>Lade Spielplan...</p>
        ) : scheduleError ? (
          <p style={{ color: 'crimson' }}>{scheduleError}</p>
        ) : scheduleOptionData.options.length === 0 ? (
          <p>Noch keine Partien im Spielplan vorhanden.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Match auswählen
              <select
                value={schedulePickerCode}
                onChange={(event) => setSchedulePickerCode(event.target.value)}
              >
                <option value="">Bitte wählen</option>
                {scheduleOptionData.options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                    {option.hasResult ? ' (bereits gespielt)' : ''}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleScheduleMatchApply(schedulePickerCode)}
                disabled={!schedulePickerCode || Boolean(scheduleSelection)}
              >
                Match übernehmen
              </button>
              {scheduleSelection ? (
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Übernehme Match...</span>
              ) : null}
              {activeScheduleMatch ? (
                <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>
                  Aktuelles Scoreboard-Match: {describeScheduleMatch(activeScheduleMatch)}
                </span>
              ) : null}
            </div>

            {selectedScheduleMatch ? (
              <p style={{ fontSize: '0.85rem', opacity: 0.75, margin: 0 }}>
                Auswahl: {describeScheduleMatch(selectedScheduleMatch)}
              </p>
            ) : null}

            {selectedScheduleMatch?.result?.hasResult ? (
              <p style={{ fontSize: '0.85rem', color: '#b26a00', margin: 0 }}>
                Hinweis: Für dieses Match existiert bereits ein Ergebnis ({selectedScheduleMatch.result.scoreA ?? 0}
                :
                {selectedScheduleMatch.result.scoreB ?? 0}).
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Spieltermine planen</h3>
        <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#555' }}>
          Lege Datum und Uhrzeit für jede Partie fest, um den Ablauf des Spieltages zeitlich zu strukturieren.
        </p>
        {!resolvedTournamentId ? (
          <p>Bitte zuerst ein Turnier im Match-Kontext auswählen.</p>
        ) : scheduleLoading ? (
          <p>Lade Spielplan...</p>
        ) : scheduleError ? (
          <p style={{ color: 'crimson' }}>{scheduleError}</p>
        ) : scheduleChronological.length === 0 ? (
          <p>Noch keine Partien im Spielplan vorhanden.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {scheduleChronological.map((entry) => {
              const key = String(entry.id);
              const baseValue = entry.scheduled_at ? formatDateTimeLocalInput(entry.scheduled_at) : '';
              const currentValue = Object.prototype.hasOwnProperty.call(scheduleDrafts, key)
                ? scheduleDrafts[key]
                : baseValue;
              const saving = Boolean(scheduleSaving[key]);
              const isDirty = (currentValue ?? '') !== baseValue;
              const hasScheduled = Boolean(entry.scheduled_at);
              const summary = `${entry.home_label} vs ${entry.away_label}`;
              const stageInfo = entry.phase === 'group' && entry.round_number
                ? `${entry.stage_label} · Runde ${entry.round_number}`
                : entry.stage_label || 'Phase';
              const statusLabel = hasScheduled
                ? `Geplant: ${formatDateTime(entry.scheduled_at)}`
                : 'Noch kein Zeitpunkt gesetzt';

              return (
                <article
                  key={entry.id}
                  style={{
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'grid',
                    gap: '0.6rem',
                    background: 'rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{stageInfo}</strong>
                    <span style={{ opacity: 0.75 }}>{summary}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="datetime-local"
                      value={currentValue}
                      onChange={(event) => handleScheduleDraftChange(entry.id, event.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => handleScheduleDraftSubmit(entry.id)}
                      disabled={saving || !isDirty}
                    >
                      {saving ? 'Speichere...' : 'Speichern'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScheduleDraftClear(entry.id)}
                      disabled={saving || (!hasScheduled && (currentValue ?? '') === '')}
                    >
                      Löschen
                    </button>
                    <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{statusLabel}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Teams</h3>
        <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#555' }}>
          Wähle Teams aus der Liste oder trage freie Namen ein. Verwaltung der Teams im Tab &quot;Teams&quot;.
        </p>
        <form onSubmit={handleTeamSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {[
              { idField: 'teamAId', nameField: 'teamAName', label: 'Team A' },
              { idField: 'teamBId', nameField: 'teamBName', label: 'Team B' }
            ].map(({ idField, nameField, label }) => {
              const currentId = teamForm[idField];
              const hasCurrentSelection = Boolean(currentId) && teams.some((team) => String(team.id) === currentId);
              return (
                <div key={idField} style={{ display: 'grid', gap: '0.5rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  {label} auswählen
                  <select
                    value={teamForm[idField]}
                    onChange={(event) => handleTeamSelectChange(idField, event.target.value)}
                    disabled={teamsLoading}
                  >
                    <option value="">Freier Name</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                    {!hasCurrentSelection && currentId && (
                      <option value={currentId}>
                        {teamForm[nameField] ? `${teamForm[nameField]} (nicht mehr verfügbar)` : 'Ehemaliges Team'}
                      </option>
                    )}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.35rem' }}>
                  {label} Name
                  <input
                    value={teamForm[nameField]}
                    onChange={(event) => handleTeamInputChange(nameField, event.target.value)}
                    placeholder={`${label} Name`}
                  />
                </label>
              </div>
              );
            })}
          </div>
          <div>
            <button type="submit">Teams übernehmen</button>
          </div>
        </form>
        {teamsLoading && <p style={{ marginTop: '0.75rem' }}>Teams werden geladen...</p>}
        {teamsError && <p style={{ marginTop: '0.75rem', color: 'crimson' }}>{teamsError}</p>}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Punkte</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {['a', 'b'].map((teamKey) => {
            const isA = teamKey === 'a';
            const teamName = isA ? scoreboard.teamAName : scoreboard.teamBName;
            const score = isA ? scoreboard.scoreA : scoreboard.scoreB;
            return (
              <div key={teamKey}>
                <p style={{ marginBottom: '0.5rem' }}>{teamName}: {score}</p>
                <label style={{ display: 'grid', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  Wer hat getroffen?
                  <select
                    value={selectedScorer[teamKey]}
                    onChange={(event) =>
                      setSelectedScorer((prev) => ({ ...prev, [teamKey]: event.target.value }))
                    }
                  >
                    <option value="">Team gesamt</option>
                    {(scoreboard.players?.[teamKey] ?? []).map((player) => (
                      <option
                        key={player.id ?? player.playerId ?? player.name}
                        value={player.playerId ?? ''}
                      >
                        {player.displayName ?? player.name}
                      </option>
                    ))}
                  </select>
                </label>
                {POINT_OPTIONS.map((value) => (
                  <button key={`${teamKey}-${value}`} onClick={() => handleScore(teamKey, value)} style={{ marginRight: '0.5rem' }}>
                    +{value}
                  </button>
                ))}
                <div style={{ marginTop: '0.5rem' }}>
                  {POINT_OPTIONS.map((value) => (
                    <button key={`${teamKey}-minus-${value}`} onClick={() => handleScore(teamKey, -value)} style={{ marginRight: '0.5rem' }}>
                      -{value}
                    </button>
                  ))}
                </div>
                <form onSubmit={(event) => handleManualScoreSubmit(event, teamKey)} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={manualScores[teamKey]}
                    onChange={(event) => handleManualScoreChange(teamKey, event.target.value)}
                    style={{ width: '5rem' }}
                  />
                  <button type="submit">Setzen</button>
                </form>
              </div>
            );
          })}
        </div>
        <button onClick={handleResetScores} style={{ marginTop: '1rem' }}>Punkte zurücksetzen</button>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Spielzeit</h3>
        <p style={{ marginBottom: '0.5rem' }}>Restzeit: {formattedRemaining} ({statusLabel})</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleStart} disabled={scoreboard.isRunning}>Start</button>
          <button onClick={handlePause} disabled={!scoreboard.isRunning}>Pause</button>
        </div>
        <p style={{ marginTop: '0.5rem' }}>Aktuelle Halbzeit: {scoreboard.currentHalf ?? 1}</p>
        {scoreboard.isHalftimeBreak && (
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#b00020' }}>
            Halbzeitpause aktiv – {formatTime(scoreboard.halftimePauseRemaining ?? 0)}
          </p>
        )}
        {(scoreboard.extraSeconds ?? 0) > 0 || (scoreboard.extraElapsedSeconds ?? 0) > 0 ? (
          <div style={{ marginTop: '0.25rem' }}>
            <p>Nachspielzeit (geplant): {formatTime(scoreboard.extraSeconds ?? 0)}</p>
            <p>Nachspielzeit (Stopwatch): {formatTime(scoreboard.extraElapsedSeconds ?? 0)}</p>
          </div>
        ) : null}
        <form onSubmit={handleTimerSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            value={timerInput}
            onChange={(event) => setTimerInput(event.target.value)}
            placeholder="z.B. 10:00 oder 600"
          />
          <button type="submit" disabled={submittingTimer}>Zeit setzen</button>
        </form>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleFinishGame} style={{ background: '#d32f2f', color: '#fff' }}>
            Spiel beenden
          </button>
          <button
            onClick={handleSaveGame}
            disabled={scoreboard.isRunning}
            style={{ background: '#0b1a2b', color: '#fff' }}
          >
            Spiel speichern
          </button>
          <button onClick={handleNewGame}>Neues Spiel vorbereiten</button>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleHalftimeSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>
              Halbzeit bei
              <input
                style={{ marginLeft: '0.5rem' }}
                value={halftimeInput}
                onChange={(event) => {
                  setHalftimeInput(event.target.value);
                  setHalftimeDirty(true);
                }}
                placeholder="z.B. 05:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>

          <form onSubmit={handleHalftimePauseSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>
              Halbzeitpause
              <input
                style={{ marginLeft: '0.5rem' }}
                value={halftimePauseInput}
                onChange={(event) => {
                  setHalftimePauseInput(event.target.value);
                  setHalftimePauseDirty(true);
                }}
                placeholder="z.B. 01:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>

          <form onSubmit={handleExtraTimeSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>
              Nachspielzeit
              <input
                style={{ marginLeft: '0.5rem' }}
                value={extraTimeInput}
                onChange={(event) => {
                  setExtraTimeInput(event.target.value);
                  setExtraDirty(true);
                }}
                placeholder="z.B. 02:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>
        </div>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Zeitstrafen</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {['a', 'b'].map((teamKey) => {
            const penalties = scoreboard?.penalties?.[teamKey] ?? [];
            const form = penaltyForms[teamKey];
            const teamName = teamKey === 'a' ? scoreboard.teamAName : scoreboard.teamBName;

            return (
              <div key={teamKey} style={{ minWidth: '260px', flex: '1 1 260px' }}>
                <h4>{teamName}</h4>
                <form onSubmit={(event) => handlePenaltySubmit(event, teamKey)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    Spieler
                    <select
                      value={form.playerId}
                      onChange={(event) => handlePenaltyFormChange(teamKey, 'playerId', event.target.value)}
                    >
                      <option value="">Team gesamt</option>
                      {(scoreboard.players?.[teamKey] ?? []).map((player) => (
                        <option key={player.id ?? player.playerId ?? player.name} value={player.playerId ?? ''}>
                          {player.displayName ?? player.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    value={form.name}
                    onChange={(event) => handlePenaltyFormChange(teamKey, 'name', event.target.value)}
                    placeholder="Name (z.B. Jonas)"
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label>
                      Dauer
                      <select
                        style={{ marginLeft: '0.5rem' }}
                        value={form.preset}
                        onChange={(event) => handlePenaltyFormChange(teamKey, 'preset', event.target.value)}
                      >
                        <option value="60">1 Minute</option>
                        <option value="120">2 Minuten</option>
                        <option value="custom">Individuell</option>
                      </select>
                    </label>
                    {form.preset === 'custom' && (
                      <input
                        style={{ flex: '1 1 auto' }}
                        value={form.custom}
                        onChange={(event) => handlePenaltyFormChange(teamKey, 'custom', event.target.value)}
                        placeholder="MM:SS oder Sekunden"
                      />
                    )}
                  </div>
                  <button type="submit">Zeitstrafe hinzufügen</button>
                </form>

                <ul style={{ marginTop: '1rem', padding: 0, listStyle: 'none' }}>
                  {penalties.length === 0 && <li style={{ color: '#666' }}>Keine aktiven Zeitstrafen</li>}
                  {penalties.map((penalty) => (
                    <li
                      key={penalty.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.25rem 0',
                        opacity: penalty.isExpired ? 0.6 : 1
                      }}
                    >
                      <span>
                        {penalty.playerName ? `${penalty.playerName} · ` : ''}
                        {penalty.name} – {penalty.isExpired ? 'abgelaufen' : formatTime(penalty.remainingSeconds)}
                      </span>
                      <button type="button" onClick={() => handlePenaltyRemove(penalty.id)}>
                        Entfernen
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );

  const historyContent = (
    <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Historie</h3>
        <button type="button" onClick={loadHistory}>Aktualisieren</button>
      </div>
      {historyLoading ? (
        <p>Lade gespeicherte Spiele...</p>
      ) : historyError ? (
        <p style={{ color: 'crimson' }}>{historyError}</p>
      ) : history.length === 0 ? (
        <p>Noch keine Spiele gespeichert.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {history.map((game) => {
            const penalties = game.penalties ?? { a: [], b: [] };
            const plannedExtra = game.extra_seconds > 0 ? `+${formatTime(game.extra_seconds)}` : '—';
            const playedExtra = game.extra_elapsed_seconds > 0 ? formatTime(game.extra_elapsed_seconds) : '—';
            const isEditing = editingGameId === game.id;
            return (
              <article
                key={game.id}
                style={{
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.02)'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>#{game.id}</strong>
                  <span>{formatDateTime(game.created_at)}</span>
                </header>

                {isEditing && editForm ? (
                  <form onSubmit={handleHistoryEditSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Team A</label>
                      <input value={editForm.team_a} onChange={(event) => handleHistoryEditChange('team_a', event.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Team B</label>
                      <input value={editForm.team_b} onChange={(event) => handleHistoryEditChange('team_b', event.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Score Team A</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.score_a}
                        onChange={(event) => handleHistoryEditChange('score_a', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Score Team B</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.score_b}
                        onChange={(event) => handleHistoryEditChange('score_b', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Nachspielzeit (geplant)</label>
                      <input
                        value={editForm.extra_seconds}
                        onChange={(event) => handleHistoryEditChange('extra_seconds', event.target.value)}
                        placeholder="MM:SS oder Sekunden"
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Nachspielzeit (gelaufen)</label>
                      <input
                        value={editForm.extra_elapsed_seconds}
                        onChange={(event) => handleHistoryEditChange('extra_elapsed_seconds', event.target.value)}
                        placeholder="MM:SS oder Sekunden"
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Strafen Team A (Anzahl)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.penalty_count_a}
                        onChange={(event) => handleHistoryEditChange('penalty_count_a', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Strafen Team B (Anzahl)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.penalty_count_b}
                        onChange={(event) => handleHistoryEditChange('penalty_count_b', event.target.value)}
                      />
                    </div>
                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                      Turnier: {game.tournament_name ?? '—'}
                      {game.stage_type === 'group' && game.stage_label ? ` · Gruppe ${game.stage_label}` : game.stage_type === 'knockout' && game.stage_label ? ` · ${game.stage_label}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit">Speichern</button>
                      <button type="button" onClick={cancelHistoryEdit}>Abbrechen</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {game.team_a} {game.score_a} : {game.score_b} {game.team_b}
                    </p>
                    <p style={{ margin: 0, fontStyle: 'italic' }}>
                      Turnier: {game.tournament_name ?? '—'}
                      {game.stage_type === 'group' && game.stage_label ? ` · Gruppe ${game.stage_label}` : game.stage_type === 'knockout' && game.stage_label ? ` · ${game.stage_label}` : ''}
                    </p>
                    <p style={{ margin: 0 }}>
                      Spielzeit: {formatTime(game.duration_seconds)} · Halbzeit bei {formatTime(game.halftime_seconds)} · Pause {formatTime(game.halftime_pause_seconds)}
                    </p>
                    <p style={{ margin: 0 }}>
                      Nachspielzeit geplant: {plannedExtra} · Gelaufen: {playedExtra}
                    </p>
                    <p style={{ margin: 0 }}>
                      Strafen – {game.team_a}: {penalties.a?.length ?? 0} · {game.team_b}: {penalties.b?.length ?? 0}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => startHistoryEdit(game)}>Bearbeiten</button>
                      <button type="button" onClick={() => handleHistoryDelete(game.id)} style={{ background: '#d32f2f', color: '#fff' }}>
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const playersContent = (
    <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <h3>Spieler verwalten</h3>
      <p style={{ marginTop: 0, marginBottom: '0.75rem', color: '#555' }}>
        Lege für jedes Team 4–5 Spieler an und verknüpfe sie mit dem Scoreboard. Punkte- und Straf-Aktionen können
        anschließend einem Spieler zugeordnet werden.
      </p>
      <form onSubmit={handlePlayerCreateSubmit} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Team
            <select
              value={playerCreate.teamId}
              onChange={(event) => handlePlayerCreateChange('teamId', event.target.value)}
              required
            >
              <option value="">Team wählen</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Spielername
            <input
              value={playerCreate.name}
              onChange={(event) => handlePlayerCreateChange('name', event.target.value)}
              placeholder="Name"
              required
            />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Rückennummer
            <input
              value={playerCreate.jerseyNumber}
              onChange={(event) => handlePlayerCreateChange('jerseyNumber', event.target.value)}
              placeholder="z.B. 12"
            />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Position (optional)
            <input
              value={playerCreate.position}
              onChange={(event) => handlePlayerCreateChange('position', event.target.value)}
              placeholder="z.B. Center"
            />
          </label>
        </div>
        <div>
          <button type="submit">Spieler anlegen</button>
        </div>
      </form>

      {playersLoading ? (
        <p>Spieler werden geladen...</p>
      ) : playersError ? (
        <p style={{ color: 'crimson' }}>{playersError}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {teams.map((team) => {
            const teamPlayers = playersByTeam.get(String(team.id)) ?? [];
            return (
              <article
                key={team.id}
                style={{
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.02)',
                  display: 'grid',
                  gap: '0.5rem'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{team.name}</strong>
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    {teamPlayers.length} Spieler
                  </span>
                </header>
                {teamPlayers.length === 0 ? (
                  <p style={{ margin: 0, color: '#666' }}>Noch keine Spieler erfasst.</p>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                    {teamPlayers.map((player) => {
                      const edit = playerEdits[player.id];
                      const isEditing = Boolean(edit?.editing);
                      return (
                        <li
                          key={player.id}
                          style={{
                            border: '1px solid rgba(0,0,0,0.08)',
                            borderRadius: '6px',
                            padding: '0.6rem 0.75rem',
                            background: 'rgba(255,255,255,0.7)'
                          }}
                        >
                          {isEditing ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                handlePlayerUpdateSubmit(player.id);
                              }}
                              style={{ display: 'grid', gap: '0.5rem' }}
                            >
                              <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
                                <input
                                  value={edit.name}
                                  onChange={(event) => handlePlayerEditChange(player.id, 'name', event.target.value)}
                                  placeholder="Name"
                                  required
                                />
                                <input
                                  value={edit.jerseyNumber}
                                  onChange={(event) => handlePlayerEditChange(player.id, 'jerseyNumber', event.target.value)}
                                  placeholder="Nr."
                                />
                                <input
                                  value={edit.position}
                                  onChange={(event) => handlePlayerEditChange(player.id, 'position', event.target.value)}
                                  placeholder="Position"
                                />
                                <select
                                  value={edit.teamId}
                                  onChange={(event) => handlePlayerEditChange(player.id, 'teamId', event.target.value)}
                                >
                                  <option value="">Team wählen</option>
                                  {teams.map((otherTeam) => (
                                    <option key={otherTeam.id} value={otherTeam.id}>
                                      {otherTeam.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="submit">Speichern</button>
                                <button type="button" onClick={() => cancelPlayerEdit(player.id)}>Abbrechen</button>
                              </div>
                            </form>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <div style={{ display: 'grid', gap: '0.2rem' }}>
                                <div style={{ fontWeight: 600 }}>
                                  {player.name}
                                  {player.jersey_number != null ? ` · #${player.jersey_number}` : ''}
                                </div>
                                {player.position ? (
                                  <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>{player.position}</span>
                                ) : null}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => startPlayerEdit(player)}>Bearbeiten</button>
                                <button
                                  type="button"
                                  onClick={() => handlePlayerDelete(player.id)}
                                  style={{ background: '#d32f2f', color: '#fff' }}
                                >
                                  Löschen
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}

          {unassignedPlayers.length > 0 ? (
            <article
              style={{
                border: '1px dashed rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.5)',
                display: 'grid',
                gap: '0.5rem'
              }}
            >
              <strong>Unzugeordnete Spieler</strong>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
                {unassignedPlayers.map((player) => (
                  <li key={player.id}>{player.name}</li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );

const audioContent = (
  <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', display: 'grid', gap: '1rem' }}>
    <div style={{ display: 'grid', gap: '0.35rem' }}>
      <h3>Audio-Steuerung</h3>
      <p style={{ margin: 0, color: '#555' }}>
        Verwalte automatische Spielereignis-Sounds und löse hochgeladene Clips manuell für die Audio-Ausgabe aus.
      </p>
    </div>
    {audioError ? <p style={{ color: 'crimson', margin: 0 }}>{audioError}</p> : null}
    {audioLoading ? (
      <p style={{ margin: 0 }}>Lade Audiodaten...</p>
    ) : (
      <div style={{ display: 'grid', gap: '1.15rem' }}>
        <article style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '1rem', display: 'grid', gap: '0.9rem' }}>
          <div>
            <strong>Spielereignisse</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
              Weise jedem Ereignis einen Sound zu, schalte ihn bei Bedarf stumm oder teste ihn direkt hier.
            </p>
          </div>
          {audioTriggers.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>Noch keine Audio-Trigger konfiguriert.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {audioTriggers.map((trigger) => {
                const busy = Boolean(audioTriggerBusy[trigger.key] || audioUploadBusy[trigger.key]);
                const currentFile = trigger.file;
                return (
                  <div
                    key={trigger.key}
                    style={{
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '8px',
                      padding: '0.9rem',
                      display: 'grid',
                      gap: '0.65rem',
                      background: 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ display: 'grid', gap: '0.25rem' }}>
                        <strong>{trigger.label}</strong>
                        {trigger.description ? (
                          <span style={{ fontSize: '0.85rem', color: '#555' }}>{trigger.description}</span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAudioTriggerToggle(trigger.key, !trigger.is_active)}
                        disabled={busy}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '999px',
                          border: '1px solid #0b1a2b',
                          background: trigger.is_active ? '#0b1a2b' : 'transparent',
                          color: trigger.is_active ? '#fff' : '#0b1a2b',
                          fontWeight: 600,
                          cursor: busy ? 'default' : 'pointer',
                          opacity: busy ? 0.6 : 1
                        }}
                      >
                        {trigger.is_active ? 'Aktiv' : 'Inaktiv'}
                      </button>
                    </div>

                    {currentFile ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem' }}>
                          Aktueller Sound:{' '}
                          <strong>{describeAudioFile(currentFile)}</strong>
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleAudioTriggerPreview(trigger.key)}
                            disabled={busy}
                          >
                            Abspielen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAudioTriggerClear(trigger.key)}
                            disabled={busy}
                          >
                            Zuordnung entfernen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Keine Audiodatei zugewiesen.</p>
                    )}

                    <div style={{ display: 'grid', gap: '0.65rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        <label style={{ display: 'grid', gap: '0.25rem' }}>
                          Label (optional)
                          <input
                            value={audioTriggerLabels[trigger.key] ?? ''}
                            onChange={(event) => handleAudioTriggerLabelChange(trigger.key, event.target.value)}
                            placeholder="z. B. Fanfare"
                            disabled={audioUploadBusy[trigger.key]}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.25rem' }}>
                          MP3 hochladen
                          <input
                            type="file"
                            accept="audio/mpeg"
                            onChange={(event) => {
                              const nextFile = event.target.files?.[0];
                              handleAudioTriggerUpload(trigger.key, nextFile);
                              event.target.value = '';
                            }}
                            disabled={audioUploadBusy[trigger.key]}
                          />
                        </label>
                      </div>
                      <div style={{ display: 'grid', gap: '0.25rem' }}>
                        <label style={{ display: 'grid', gap: '0.25rem' }}>
                          Aus Bibliothek verwenden
                          <select
                            defaultValue=""
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              if (nextValue) {
                                handleAudioTriggerAssign(trigger.key, nextValue);
                                event.target.value = '';
                              }
                            }}
                            disabled={audioLibrary.length === 0 || busy}
                          >
                            <option value="">Auswählen...</option>
                            {audioLibrary.map((file) => (
                              <option key={file.id} value={file.id}>
                                {describeAudioFile(file)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>Unterstützt werden MP3-Dateien bis 25&nbsp;MB.</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', padding: '1rem', display: 'grid', gap: '0.85rem' }}>
          <div>
            <strong>Sound-Bibliothek &amp; manuelle Auslösung</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
              Lade zusätzliche Sounds hoch und löse sie bei Bedarf manuell aus – die Audio-Ausgabe erfolgt auf der Audio-Subdomain.
            </p>
          </div>
          <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              Label (optional)
              <input
                value={audioLibraryUploadLabel}
                onChange={(event) => setAudioLibraryUploadLabel(event.target.value)}
                placeholder="z. B. Sirene"
              />
            </label>
            <label style={{ display: 'grid', gap: '0.25rem' }}>
              MP3 hochladen
              <input
                type="file"
                accept="audio/mpeg"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0];
                  handleAudioLibraryUpload(nextFile);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
          {audioLibrary.length === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>Noch keine Sounds in der Bibliothek.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {audioLibrary.map((file) => {
                const busy = Boolean(audioManualBusy[file.id]);
                const sizeBytes = Number(file.size_bytes ?? 0);
                const sizeLabel = sizeBytes >= 1024
                  ? `${Math.round(sizeBytes / 1024)} KB`
                  : `${sizeBytes} B`;
                return (
                  <div
                    key={file.id}
                    style={{
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      <strong>{describeAudioFile(file)}</strong>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Hochgeladen am {formatDateTime(file.created_at)} · {sizeLabel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleAudioLibraryPlay(file.id)}
                        disabled={busy}
                      >
                        Abspielen
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAudioLibraryDelete(file.id)}
                        disabled={busy}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    )}
  </section>
);

const teamsContent = (
    <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <h3>Teams verwalten</h3>
      <form onSubmit={handleTeamCreateSubmit} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          Neues Team
          <input
            value={teamCreateName}
            onChange={(event) => setTeamCreateName(event.target.value)}
            placeholder="Teamname"
            required
          />
        </label>
        <div>
          <button type="submit" disabled={teamsLoading}>Team anlegen</button>
        </div>
      </form>

      {teamsLoading ? (
        <p>Lade Teams...</p>
      ) : teamsError ? (
        <p style={{ color: 'crimson' }}>{teamsError}</p>
      ) : teams.length === 0 ? (
        <p>Noch keine Teams vorhanden.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {teams.map((team) => {
            const edit = teamEdits[team.id];
            const formValue = edit ? edit.name : team.name;
            const isEditing = Boolean(edit);
            return (
              <article
                key={team.id}
                style={{
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.02)'
                }}
              >
                {isEditing ? (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ display: 'grid', gap: '0.35rem' }}>
                      Name
                      <input value={formValue} onChange={(event) => handleTeamEditChange(team.id, event.target.value)} />
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" onClick={() => handleTeamSave(team.id)}>Speichern</button>
                      <button type="button" onClick={() => cancelTeamEdit(team.id)}>Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <strong>{team.name}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => startTeamEdit(team)}>Bearbeiten</button>
                      <button type="button" onClick={() => handleTeamDelete(team.id)} style={{ background: '#d32f2f', color: '#fff' }}>
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const tabs = [
    { id: 'control', label: 'Live-Steuerung' },
    { id: 'audio', label: 'Audio' },
    { id: 'history', label: 'Historie' },
    { id: 'players', label: 'Spieler' },
    { id: 'teams', label: 'Teams' },
    { id: 'tournaments', label: 'Turniere' }
  ];

  const tournamentContent = (
    <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <h3>Turniere verwalten</h3>
      <form onSubmit={handleTournamentFormSubmit} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          <label>Neues Turnier</label>
          <input
            value={tournamentForm.name}
            onChange={(event) => handleTournamentFormChange('name', event.target.value)}
            placeholder="Turniername"
            required
          />
        </div>
        <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <label>
            Gruppen
            <input
              type="number"
              min="0"
              value={tournamentForm.group_count}
              onChange={(event) => handleTournamentFormChange('group_count', event.target.value)}
              placeholder="z.B. 4"
            />
          </label>
          <label>
            KO-Runden
            <input
              type="number"
              min="0"
              value={tournamentForm.knockout_rounds}
              onChange={(event) => handleTournamentFormChange('knockout_rounds', event.target.value)}
              placeholder="z.B. 2"
            />
          </label>
        </div>
        <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <label>
            Mannschaften
            <input
              type="number"
              min="0"
              value={tournamentForm.team_count}
              onChange={(event) => handleTournamentFormChange('team_count', event.target.value)}
              placeholder="z.B. 16"
              required
            />
          </label>
          <label>
            Platzierungsmodus
            <select
              value={tournamentForm.classification_mode}
              onChange={(event) => handleTournamentFormChange('classification_mode', event.target.value)}
            >
              <option value="top4">nur Plätze 1–4</option>
              <option value="all">alle Plätze (vollständiger Spielplan)</option>
            </select>
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={Boolean(tournamentForm.is_public)}
            onChange={(event) => handleTournamentFormChange('is_public', event.target.checked)}
          />
          Öffentlich im Public-Dashboard anzeigen
        </label>
        <div>
          <button type="submit" disabled={tournamentsLoading}>Turnier anlegen</button>
        </div>
      </form>

      {tournamentsLoading ? (
        <p>Lade Turniere...</p>
      ) : tournamentsError ? (
        <p style={{ color: 'crimson' }}>{tournamentsError}</p>
      ) : tournaments.length === 0 ? (
        <p>Noch keine Turniere vorhanden.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {tournaments.map((tournament) => {
            const edit = tournamentEdits[tournament.id];
            const formValues = edit || {
              name: tournament.name,
              group_count: String(tournament.group_count ?? 0),
              knockout_rounds: String(tournament.knockout_rounds ?? 0),
              team_count: String(tournament.team_count ?? 0),
              classification_mode: tournament.classification_mode ?? 'top4',
              is_public: Boolean(tournament.is_public)
            };
            const isEditing = Boolean(edit);
            return (
              <Fragment key={tournament.id}>
                <article
                  style={{
                    border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.02)'
                  }}
                >
                {isEditing ? (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Name</label>
                      <input value={formValues.name} onChange={(event) => handleTournamentEditChange(tournament.id, 'name', event.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                      <label>
                        Gruppen
                        <input
                          type="number"
                          min="0"
                          value={formValues.group_count}
                          onChange={(event) => handleTournamentEditChange(tournament.id, 'group_count', event.target.value)}
                        />
                      </label>
                      <label>
                        KO-Runden
                        <input
                          type="number"
                          min="0"
                          value={formValues.knockout_rounds}
                          onChange={(event) => handleTournamentEditChange(tournament.id, 'knockout_rounds', event.target.value)}
                        />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                      <label>
                        Mannschaften
                        <input
                          type="number"
                          min="0"
                          value={formValues.team_count}
                          onChange={(event) => handleTournamentEditChange(tournament.id, 'team_count', event.target.value)}
                        />
                      </label>
                      <label>
                        Platzierungsmodus
                        <select
                          value={formValues.classification_mode}
                          onChange={(event) => handleTournamentEditChange(tournament.id, 'classification_mode', event.target.value)}
                        >
                          <option value="top4">nur Plätze 1–4</option>
                          <option value="all">alle Plätze (vollständig)</option>
                        </select>
                      </label>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(formValues.is_public)}
                        onChange={(event) => handleTournamentEditChange(tournament.id, 'is_public', event.target.checked)}
                      />
                      Öffentlich im Public-Dashboard anzeigen
                    </label>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <strong>{tournament.name}</strong>
                    <span>Gruppen: {tournament.group_count ?? 0} · KO-Runden: {tournament.knockout_rounds ?? 0}</span>
                    <span>Teams: {tournament.team_count ?? 0} · Platzierungen: {tournament.classification_mode === 'all' ? 'alle Plätze' : 'nur 1–4'}</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
                      Status: {tournament.is_public ? 'öffentlich' : 'privat'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => handleTournamentDetailsToggle(tournament.id)}>
                    {expandedTournamentId === tournament.id ? 'Details verbergen' : 'Details anzeigen'}
                  </button>
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => handleTournamentSave(tournament.id)}>Speichern</button>
                      <button type="button" onClick={() => cancelTournamentEdit(tournament.id)}>Abbrechen</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startTournamentEdit(tournament)}>Bearbeiten</button>
                      <button
                        type="button"
                        onClick={() => handleTournamentDelete(tournament.id)}
                        style={{ background: '#d32f2f', color: '#fff' }}
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
                </article>
                {expandedTournamentId === tournament.id ? (
                  <TournamentDetailsPanel
                    tournament={tournament}
                    structure={expandedTournamentId === tournament.id ? activeStructure : null}
                    teams={teams}
                    assignments={slotAssignments}
                    loading={structureLoading}
                    error={structureError}
                    hasChanges={hasTournamentChanges}
                    saving={structureSaving}
                    onNameChange={handleSlotNameChange}
                    onTeamSelect={handleSlotTeamSelect}
                    onResetSlot={handleSlotReset}
                    onResetAll={handleResetAllSlots}
                    onSave={handleTournamentAssignmentsSave}
                    onRefresh={handleTournamentStructureRefresh}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>
      )}
    </section>
  );

  const tabButtonStyle = (active) => ({
    padding: '0.6rem 1.2rem',
    borderRadius: '999px',
    border: '1px solid #0b1a2b',
    background: active ? '#0b1a2b' : 'transparent',
    color: active ? '#fff' : '#0b1a2b',
    fontWeight: 600,
    cursor: 'pointer'
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h2 style={{ margin: 0, fontSize: '2rem' }}>Scoreboard</h2>
        {error && <p style={{ color: 'crimson', marginTop: '0.5rem' }}>{error}</p>}
        {info && <p style={{ color: 'green', marginTop: '0.5rem' }}>{info}</p>}
      </header>

      <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={tabButtonStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {scoreboardSummaryCard}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeTab === 'control'
          ? controlContent
          : activeTab === 'audio'
            ? audioContent
            : activeTab === 'history'
              ? historyContent
              : activeTab === 'players'
                ? playersContent
                : activeTab === 'teams'
                  ? teamsContent
                  : tournamentContent}
      </div>
    </div>
  );
}

function TournamentDetailsPanel({
  tournament,
  structure,
  teams,
  assignments,
  loading,
  error,
  hasChanges,
  saving,
  onNameChange,
  onTeamSelect,
  onResetSlot,
  onResetAll,
  onSave,
  onRefresh
}) {
  const containerStyle = {
    marginTop: '0.75rem',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    background: 'rgba(0,0,0,0.015)',
    display: 'grid',
    gap: '0.9rem'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ margin: 0 }}>Lade Turnierstruktur…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <p style={{ margin: 0, color: 'crimson' }}>{error}</p>
        <div>
          <button type="button" onClick={onRefresh}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  if (!structure) {
    return (
      <div style={containerStyle}>
        <p style={{ margin: 0 }}>Noch keine Turnierstruktur verfügbar. Bitte neu laden.</p>
        <div>
          <button type="button" onClick={onRefresh}>Aktualisieren</button>
        </div>
      </div>
    );
  }

  const groups = Array.isArray(structure.groups) ? structure.groups : [];
  const qualifierSummary = structure.knockout?.entrants
    ? `${structure.knockout.entrants} mögliche KO-Teilnehmer`
    : 'Keine KO-Runde konfiguriert';

  const statusLabel = (status) => {
    if (status === 'qualified') return 'qualifiziert';
    if (status === 'in_position') return 'auf Kurs';
    if (status === 'contender') return 'verfolgt';
    return '—';
  };

  const statusColor = (status) => {
    if (status === 'qualified') return '#1b5e20';
    if (status === 'in_position') return '#1565c0';
    if (status === 'contender') return '#6d4c41';
    return '#546e7a';
  };

  return (
    <div style={containerStyle}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <strong style={{ fontSize: '1.05rem' }}>Turnierdetails – {tournament.name}</strong>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{qualifierSummary}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={onSave} disabled={!hasChanges || saving}>
            {saving ? 'Speichern…' : 'Änderungen speichern'}
          </button>
          <button type="button" onClick={onResetAll} disabled={!hasChanges || saving}>
            Änderungen verwerfen
          </button>
          <button type="button" onClick={onRefresh} disabled={saving}>
            Neu laden
          </button>
        </div>
      </header>

      {groups.length === 0 ? (
        <p style={{ margin: 0 }}>Keine Gruppen vorhanden.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {groups.map((group) => {
            const qualifiesCount = group.qualifiers?.count ?? 0;
            const recorded = group.standings?.recordedGamesCount ?? 0;
            const totalMatches = group.standings?.totalMatches ?? 0;
            const qualifierLabel =
              qualifiesCount > 0
                ? `${qualifiesCount} ${qualifiesCount === 1 ? 'Platz' : 'Plätze'} für KO`
                : 'Keine direkte Qualifikation';
            const progressLabel =
              totalMatches > 0 ? `${recorded}/${totalMatches} Spiele erfasst` : 'Noch keine Spiele angesetzt';
            return (
              <section
                key={`group-${group.label}`}
                style={{
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.9rem',
                  display: 'grid',
                  gap: '0.75rem',
                  background: 'rgba(255,255,255,0.6)'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <strong>Gruppe {group.label}</strong>
                    <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{qualifierLabel}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>{progressLabel}</span>
                </header>

                <div
                  style={{
                    display: 'grid',
                    gap: '0.75rem',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
                  }}
                >
                  {group.slots.map((slot) => {
                    const key = String(slot.slotNumber);
                    const assignment = assignments[key] ?? { name: '', teamId: '' };
                    return (
                      <div
                        key={`slot-${group.label}-${slot.slotNumber}`}
                        style={{
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: '6px',
                          padding: '0.6rem 0.65rem',
                          display: 'grid',
                          gap: '0.5rem',
                          background: 'rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Slot {slot.slotNumber}</div>
                        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                          Teamname
                          <input
                            value={assignment.name ?? ''}
                            onChange={(event) => onNameChange(slot.slotNumber, event.target.value)}
                            placeholder={`Team ${slot.slotNumber}`}
                          />
                        </label>
                        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.85rem' }}>
                          Verknüpftes Team
                          <select
                            value={assignment.teamId ?? ''}
                            onChange={(event) => onTeamSelect(slot.slotNumber, event.target.value)}
                          >
                            <option value="">Eigenen Namen verwenden</option>
                            {teams.map((team) => (
                              <option key={`slot-team-${team.id}`} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button type="button" onClick={() => onResetSlot(slot.slotNumber)}>
                          Slot zurücksetzen
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Aktuelle Tabelle</strong>
                  {Array.isArray(group.standings?.entries) && group.standings.entries.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          {['Platz', 'Team', 'Sp', 'Tore', 'Diff', 'Pkt', 'Status'].map((label) => (
                            <th
                              key={`${group.label}-${label}`}
                              style={{
                                textAlign: label === 'Team' ? 'left' : 'center',
                                padding: '0.4rem',
                                borderBottom: '1px solid rgba(0,0,0,0.1)'
                              }}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {group.standings.entries.map((entry) => (
                          <tr key={`${group.label}-pos-${entry.position}`}>
                            <td style={{ padding: '0.35rem', textAlign: 'center' }}>{entry.position}</td>
                            <td style={{ padding: '0.35rem' }}>{entry.team}</td>
                            <td style={{ padding: '0.35rem', textAlign: 'center' }}>{entry.played}</td>
                            <td style={{ padding: '0.35rem', textAlign: 'center' }}>
                              {entry.goalsFor}:{entry.goalsAgainst}
                            </td>
                            <td style={{ padding: '0.35rem', textAlign: 'center' }}>{entry.goalDiff}</td>
                            <td style={{ padding: '0.35rem', textAlign: 'center' }}>{entry.points}</td>
                            <td style={{ padding: '0.35rem', textAlign: 'center', color: statusColor(entry.status) }}>
                              {statusLabel(entry.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Noch keine Ergebnisse gespeichert.</p>
                  )}
                  {group.qualifiers?.qualifiedTeams?.length > 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#1b5e20' }}>
                      Qualifiziert: {group.qualifiers.qualifiedTeams.join(', ')}
                    </span>
                  ) : group.qualifiers?.provisionalTeams?.length > 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#1565c0' }}>
                      Aktuell auf den Qualifikationsplätzen: {group.qualifiers.provisionalTeams.join(', ')}
                    </span>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.65 }}>
        Hinweis: Wird ein Team aus der Liste gewählt, nutzt der Spielplan automatisch dessen offiziellen Namen. Freitext
        ohne Auswahl gilt als individueller Name für diesen Slot.
      </p>
    </div>
  );
}
