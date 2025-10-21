import {
  getState,
  notifySubscribers,
  snapshotState,
  normalizeGroupStageLabel,
  resetPenaltyIds
} from './stateStore.js';

export function setTeams({ teamAName, teamBName, teamAId, teamBId }) {
  const state = getState();
  let changed = false;

  if (teamAId !== undefined) {
    const normalized = teamAId === null || teamAId === '' ? null : Number(teamAId);
    const sanitized = normalized !== null && Number.isInteger(normalized) && normalized > 0 ? normalized : null;
    if (state.teamAId !== sanitized) {
      state.teamAId = sanitized;
      changed = true;
    }
  }

  if (typeof teamAName === 'string') {
    const trimmed = teamAName.trim();
    if (trimmed.length > 0 && trimmed !== state.teamAName) {
      state.teamAName = trimmed;
      changed = true;
    }
  }

  if (teamBId !== undefined) {
    const normalized = teamBId === null || teamBId === '' ? null : Number(teamBId);
    const sanitized = normalized !== null && Number.isInteger(normalized) && normalized > 0 ? normalized : null;
    if (state.teamBId !== sanitized) {
      state.teamBId = sanitized;
      changed = true;
    }
  }

  if (typeof teamBName === 'string') {
    const trimmed = teamBName.trim();
    if (trimmed.length > 0 && trimmed !== state.teamBName) {
      state.teamBName = trimmed;
      changed = true;
    }
  }

  if (changed) {
    if (state.scheduleCode) {
      state.scheduleCode = null;
    }
    notifySubscribers();
  }

  return snapshotState();
}

export function setMatchContext({ tournamentId, tournamentName, stageType, stageLabel }, options = {}) {
  const state = getState();
  const normalizedId = tournamentId != null && tournamentId !== '' ? Number(tournamentId) : null;
  if (normalizedId !== null && (!Number.isInteger(normalizedId) || normalizedId <= 0)) {
    throw new Error('Invalid tournamentId');
  }

  const normalizedStageType = stageType ? String(stageType) : null;
  if (normalizedStageType && !['group', 'knockout', 'placement'].includes(normalizedStageType)) {
    throw new Error('Invalid stageType');
  }

  const normalizedLabel = stageLabel ? String(stageLabel).trim() : '';
  let finalLabel = normalizedLabel;
  if (normalizedStageType === 'group') {
    finalLabel = normalizeGroupStageLabel(normalizedLabel);
  } else if (normalizedStageType) {
    finalLabel = normalizedLabel;
  } else {
    finalLabel = '';
  }

  if (normalizedStageType === 'group' && !finalLabel) {
    throw new Error('Invalid group label');
  }

  state.tournamentId = normalizedId;
  state.tournamentName = normalizedId ? (tournamentName ?? '') : '';
  state.stageType = normalizedStageType;
  state.stageLabel = normalizedStageType ? finalLabel : '';

  if (!options.preserveScheduleCode && state.scheduleCode) {
    state.scheduleCode = null;
  }

  notifySubscribers();
  return snapshotState();
}

function resolveDisplayName(entry, fallbackLabel, defaultName) {
  if (!entry) {
    return fallbackLabel || defaultName;
  }

  if (entry.teamName) {
    return entry.teamName;
  }

  if (entry.placeholder) {
    return entry.placeholder;
  }

  if (entry.label) {
    return entry.label;
  }

  if (fallbackLabel) {
    return fallbackLabel;
  }

  return defaultName;
}

export function applyScheduleMatchSelection({
  tournamentId,
  tournamentName,
  phase,
  stageLabel,
  scheduleCode,
  home,
  away
}) {
  const state = getState();
  const normalizedTournamentId =
    tournamentId != null && tournamentId !== '' ? Number(tournamentId) : null;

  state.tournamentId =
    normalizedTournamentId !== null && Number.isInteger(normalizedTournamentId) && normalizedTournamentId > 0
      ? normalizedTournamentId
      : null;
  state.tournamentName = state.tournamentId ? tournamentName ?? '' : '';

  const normalizedPhase = phase && ['group', 'knockout', 'placement'].includes(phase) ? phase : null;
  state.stageType = normalizedPhase;

  if (normalizedPhase === 'group') {
    const labelSource = stageLabel ?? home?.metadata?.group ?? away?.metadata?.group ?? '';
    state.stageLabel = normalizeGroupStageLabel(labelSource);
  } else if (normalizedPhase) {
    state.stageLabel = stageLabel ? String(stageLabel).trim() : '';
  } else {
    state.stageLabel = '';
  }

  state.teamAId = home?.teamId ?? null;
  state.teamAName = resolveDisplayName(home, home?.label, 'Team A');

  state.teamBId = away?.teamId ?? null;
  state.teamBName = resolveDisplayName(away, away?.label, 'Team B');

  state.scheduleCode = scheduleCode ?? null;

  state.scoreA = 0;
  state.scoreB = 0;
  state.remainingSeconds = state.durationSeconds;
  state.isRunning = false;
  state.currentHalf = 1;
  state.halftimeTriggered = false;
  state.isHalftimeBreak = false;
  state.halftimePauseRemaining = state.halftimePauseSeconds;
  state.extraElapsedSeconds = 0;
  state.isExtraTime = false;
  state.penalties = {
    a: [],
    b: []
  };
  resetPenaltyIds();

  notifySubscribers();
  return snapshotState();
}
