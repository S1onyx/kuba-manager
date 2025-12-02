const DEFAULT_DURATION_SECONDS = 10 * 60;
const DISPLAY_VIEWS = ['scoreboard', 'bracket'];
const DEFAULT_DISPLAY_VIEW = DISPLAY_VIEWS[0];

const TEAM_KEYS = ['a', 'b'];
const TEAM_TOTAL_KEY = '__team_total__';
const UNKNOWN_PLAYER_KEY = '__unknown__';
const MAX_EVENT_LOG_ENTRIES = 200;

function normalizeGroupStageLabel(input) {
  const raw = String(input ?? '').trim();
  if (!raw) {
    return '';
  }

  const upper = raw.toUpperCase();
  const groupPrefixMatch = upper.match(/^(GRUPPE|GROUP)\s+/);
  if (groupPrefixMatch) {
    return upper.slice(groupPrefixMatch[0].length).trim();
  }

  return upper.trim();
}

function normalizePlayer(raw) {
  if (!raw) {
    return null;
  }

  const idCandidate = raw.playerId ?? raw.player_id ?? raw.id ?? null;
  const numericId = Number(idCandidate);
  const playerId = Number.isInteger(numericId) && numericId > 0 ? numericId : null;
  const name = String(raw.name ?? '').trim() || 'Unbekannter Spieler';
  const jerseyNumberRaw = raw.jerseyNumber ?? raw.jersey_number;
  const jerseyNumber =
    jerseyNumberRaw === null || jerseyNumberRaw === undefined || jerseyNumberRaw === ''
      ? null
      : Number(jerseyNumberRaw);
  const position = String(raw.position ?? '').trim();
  const displayName =
    jerseyNumber !== null && Number.isFinite(jerseyNumber)
      ? `#${jerseyNumber} ${name}`
      : name;

  return {
    id: playerId !== null ? String(playerId) : null,
    playerId,
    name,
    displayName,
    jerseyNumber: Number.isFinite(jerseyNumber) ? jerseyNumber : null,
    position
  };
}

function normalizeRoster(players = []) {
  return players
    .map((entry) => normalizePlayer(entry))
    .filter((player) => player !== null);
}

function createEmptyStat(descriptor = {}, teamKey) {
  return {
    id: descriptor.playerId != null ? String(descriptor.playerId) : descriptor.id ?? null,
    playerId: descriptor.playerId ?? null,
    teamKey,
    name: descriptor.name ?? '',
    displayName: descriptor.displayName ?? descriptor.name ?? '',
    jerseyNumber:
      descriptor.jerseyNumber === null || descriptor.jerseyNumber === undefined
        ? null
        : descriptor.jerseyNumber,
    position: descriptor.position ?? '',
    points: 0,
    scores: 0,
    breakdown: {
      '1': 0,
      '2': 0,
      '3': 0
    },
    penalties: 0,
    penaltySeconds: 0,
    lastScoreAt: null,
    isTeamTotal: Boolean(descriptor.isTeamTotal),
    isUnknown: Boolean(descriptor.isUnknown)
  };
}

function buildStatsContainer(teamKey, roster, teamName) {
  const container = {};

  const teamDisplayName = teamName ? `${teamName} Gesamt` : 'Team Gesamt';
  container[TEAM_TOTAL_KEY] = createEmptyStat(
    {
      id: TEAM_TOTAL_KEY,
      name: teamDisplayName,
      displayName: teamDisplayName,
      isTeamTotal: true
    },
    teamKey
  );

  roster.forEach((player) => {
    const key = player.id ?? `virtual-${player.name}`;
    container[key] = createEmptyStat(
      {
        id: key,
        playerId: player.playerId,
        name: player.name,
        displayName: player.displayName,
        jerseyNumber: player.jerseyNumber,
        position: player.position
      },
      teamKey
    );
  });

  return container;
}

function createDefaultState(overrides = {}) {
  const rawPlayers = overrides.players ?? {};
  const teamAPlayersRaw = Array.isArray(rawPlayers.a) ? rawPlayers.a : [];
  const teamBPlayersRaw = Array.isArray(rawPlayers.b) ? rawPlayers.b : [];

  const base = {
    teamAName: 'Team A',
    teamBName: 'Team B',
    teamAId: null,
    teamBId: null,
    scoreA: 0,
    scoreB: 0,
    durationSeconds: DEFAULT_DURATION_SECONDS,
    remainingSeconds: DEFAULT_DURATION_SECONDS,
    isRunning: false,
    penalties: {
      a: [],
      b: []
    },
    halftimeSeconds: DEFAULT_DURATION_SECONDS / 2,
    halftimePauseSeconds: 45,
    halftimePauseRemaining: 45,
    extraSeconds: 0,
    extraElapsedSeconds: 0,
    halftimeTriggered: false,
    isHalftimeBreak: false,
    isExtraTime: false,
    currentHalf: 1,
    tournamentId: null,
    tournamentName: '',
    stageType: null,
    stageLabel: '',
    scheduleCode: null,
    tournamentCompleted: Boolean(overrides.tournamentCompleted ?? false),
    scheduleVersion:
      overrides.scheduleVersion !== undefined && overrides.scheduleVersion !== null
        ? Math.max(0, Math.trunc(Number(overrides.scheduleVersion) || 0))
        : 0,
    displayView: DEFAULT_DISPLAY_VIEW,
    lastUpdated: new Date().toISOString(),
    players: {
      a: [],
      b: []
    },
    playerStats: {
      a: {},
      b: {}
    },
    scoringLog: [],
    penaltyLog: [],
    ...overrides
  };

  if (base.stageType === 'group') {
    base.stageLabel = normalizeGroupStageLabel(base.stageLabel);
  }

  const normalizedDisplayView =
    typeof base.displayView === 'string'
      ? base.displayView.toLowerCase().trim()
      : DEFAULT_DISPLAY_VIEW;
  base.displayView = DISPLAY_VIEWS.includes(normalizedDisplayView)
    ? normalizedDisplayView
    : DEFAULT_DISPLAY_VIEW;

  base.players = {
    a: normalizeRoster(teamAPlayersRaw),
    b: normalizeRoster(teamBPlayersRaw)
  };

  base.playerStats = {
    a: buildStatsContainer('a', base.players.a, base.teamAName),
    b: buildStatsContainer('b', base.players.b, base.teamBName)
  };

  return base;
}

const state = createDefaultState();

let nextPenaltyId = 1;
let nextScoreEventId = 1;
const subscribers = new Set();

function copyPenalties() {
  return {
    a: state.penalties.a.map((penalty) => ({
      ...penalty
    })),
    b: state.penalties.b.map((penalty) => ({
      ...penalty
    }))
  };
}

function cloneRoster(roster = []) {
  return roster.map((player) => ({ ...player }));
}

function cloneStats(stats = {}) {
  return Object.values(stats).map((entry) => ({
    ...entry,
    breakdown: { ...entry.breakdown }
  }));
}

function updateTimestamp() {
  state.lastUpdated = new Date().toISOString();
}

function ensureStatsContainer(teamKey) {
  if (!TEAM_KEYS.includes(teamKey)) {
    throw new Error(`Unknown team key: ${teamKey}`);
  }
  if (!state.playerStats[teamKey]) {
    state.playerStats[teamKey] = buildStatsContainer(teamKey, state.players[teamKey] ?? [], getTeamName(teamKey));
  }
  return state.playerStats[teamKey];
}

function getTeamName(teamKey) {
  return teamKey === 'b' ? state.teamBName : state.teamAName;
}

function ensureUnknownStatsEntry(teamKey) {
  const stats = ensureStatsContainer(teamKey);
  if (!stats[UNKNOWN_PLAYER_KEY]) {
    stats[UNKNOWN_PLAYER_KEY] = createEmptyStat(
      {
        id: UNKNOWN_PLAYER_KEY,
        name: 'Unbekannt',
        displayName: 'Unbekannt',
        isUnknown: true
      },
      teamKey
    );
  }
  return stats[UNKNOWN_PLAYER_KEY];
}

function ensureTeamTotalsEntry(teamKey) {
  const stats = ensureStatsContainer(teamKey);
  if (!stats[TEAM_TOTAL_KEY]) {
    const displayName = `${getTeamName(teamKey)} Gesamt`.trim() || 'Team Gesamt';
    stats[TEAM_TOTAL_KEY] = createEmptyStat(
      {
        id: TEAM_TOTAL_KEY,
        name: displayName,
        displayName,
        isTeamTotal: true
      },
      teamKey
    );
  } else {
    const displayName = `${getTeamName(teamKey)} Gesamt`.trim() || 'Team Gesamt';
    stats[TEAM_TOTAL_KEY].name = displayName;
    stats[TEAM_TOTAL_KEY].displayName = displayName;
  }
  return stats[TEAM_TOTAL_KEY];
}

function getOrCreatePlayerStats(teamKey, playerId) {
  const stats = ensureStatsContainer(teamKey);
  if (playerId == null) {
    return ensureUnknownStatsEntry(teamKey);
  }
  const key = String(playerId);
  if (!stats[key]) {
    const rosterEntry = state.players[teamKey].find((player) => player.playerId === Number(playerId));
    stats[key] = createEmptyStat(
      {
        id: key,
        playerId,
        name: rosterEntry?.name ?? `Spieler ${playerId}`,
        displayName: rosterEntry?.displayName ?? `Spieler ${playerId}`,
        jerseyNumber: rosterEntry?.jerseyNumber ?? null,
        position: rosterEntry?.position ?? ''
      },
      teamKey
    );
  }
  return stats[key];
}

function clampNonNegative(value) {
  return value < 0 ? 0 : value;
}

function applyScoreToStats(teamKey, playerId, deltaPoints, timestamp, options = {}) {
  if (deltaPoints === 0) {
    return;
  }

  const absPoints = Math.abs(deltaPoints);
  const stats = ensureStatsContainer(teamKey);
  const totals = ensureTeamTotalsEntry(teamKey);

  const applyDelta = (entry) => {
    entry.points = clampNonNegative(entry.points + deltaPoints);
    if (deltaPoints > 0) {
      entry.scores += 1;
      if (entry.breakdown[String(absPoints)] !== undefined) {
        entry.breakdown[String(absPoints)] += 1;
      }
    } else if (deltaPoints < 0) {
      entry.scores = clampNonNegative(entry.scores - 1);
      if (entry.breakdown[String(absPoints)] !== undefined) {
        entry.breakdown[String(absPoints)] = clampNonNegative(entry.breakdown[String(absPoints)] - 1);
      }
    }
    entry.lastScoreAt = timestamp;
  };

  applyDelta(totals);

  if (options.affectStats === false) {
    return;
  }

  const playerEntry = getOrCreatePlayerStats(teamKey, playerId);
  applyDelta(playerEntry);
}

function applyPenaltyToStats(teamKey, playerId, durationSeconds) {
  const timestamp = new Date().toISOString();
  const totals = ensureTeamTotalsEntry(teamKey);
  totals.penalties += 1;
  totals.penaltySeconds += durationSeconds;
  totals.lastScoreAt = totals.lastScoreAt ?? timestamp;

  if (playerId == null) {
    const unknownEntry = ensureUnknownStatsEntry(teamKey);
    unknownEntry.penalties += 1;
    unknownEntry.penaltySeconds += durationSeconds;
    return;
  }

  const playerEntry = getOrCreatePlayerStats(teamKey, playerId);
  playerEntry.penalties += 1;
  playerEntry.penaltySeconds += durationSeconds;
}

function findPlayerName(teamKey, playerId) {
  if (playerId == null) return null;
  const roster = state.players[teamKey] ?? [];
  const entry = roster.find((player) => player.playerId === Number(playerId));
  return entry ? entry.name : null;
}

function inferShotType(points) {
  const abs = Math.abs(points);
  if (abs === 3) return 'three';
  if (abs === 2) return 'field';
  if (abs === 1) return 'free';
  return 'custom';
}

function appendScoreEvent(event) {
  state.scoringLog.push(event);
  if (state.scoringLog.length > MAX_EVENT_LOG_ENTRIES) {
    state.scoringLog.splice(0, state.scoringLog.length - MAX_EVENT_LOG_ENTRIES);
  }
}

function appendPenaltyEvent(entry) {
  state.penaltyLog = state.penaltyLog.filter((logEntry) => logEntry.id !== entry.id);
  state.penaltyLog.push(entry);
  if (state.penaltyLog.length > MAX_EVENT_LOG_ENTRIES) {
    state.penaltyLog.splice(0, state.penaltyLog.length - MAX_EVENT_LOG_ENTRIES);
  }
}

export function setTeamPlayers(teamKey, roster = [], { teamName, resetStats = true } = {}) {
  const normalizedTeamKey = TEAM_KEYS.includes(teamKey) ? teamKey : 'a';
  const normalizedRoster = normalizeRoster(roster);
  state.players[normalizedTeamKey] = normalizedRoster;

  const targetTeamName = teamName ?? getTeamName(normalizedTeamKey);

  if (resetStats) {
    state.playerStats[normalizedTeamKey] = buildStatsContainer(normalizedTeamKey, normalizedRoster, targetTeamName);
    return;
  }

  const existing = ensureStatsContainer(normalizedTeamKey);
  const nextStats = buildStatsContainer(normalizedTeamKey, normalizedRoster, targetTeamName);

  Object.keys(nextStats).forEach((key) => {
    const previous = existing[key];
    if (previous) {
      nextStats[key] = {
        ...nextStats[key],
        points: previous.points ?? 0,
        scores: previous.scores ?? 0,
        breakdown: {
          '1': previous.breakdown?.['1'] ?? 0,
          '2': previous.breakdown?.['2'] ?? 0,
          '3': previous.breakdown?.['3'] ?? 0
        },
        penalties: previous.penalties ?? 0,
        penaltySeconds: previous.penaltySeconds ?? 0,
        games: previous.games ?? 0,
        lastScoreAt: previous.lastScoreAt ?? null
      };
    }
  });

  state.playerStats[normalizedTeamKey] = nextStats;
}

export function registerScoreEvent(teamKey, deltaPoints, metadata = {}) {
  const normalizedTeamKey = TEAM_KEYS.includes(teamKey) ? teamKey : 'a';
  const timestamp = metadata.timestamp ?? new Date().toISOString();
  const playerId =
    metadata.playerId === null || metadata.playerId === undefined || metadata.playerId === ''
      ? null
      : Number(metadata.playerId);

  applyScoreToStats(normalizedTeamKey, playerId, deltaPoints, timestamp, {
    affectStats: metadata.affectStats !== false
  });

  const event = {
    id: String(nextScoreEventId++),
    team: normalizedTeamKey,
    teamName: getTeamName(normalizedTeamKey),
    playerId: playerId ?? null,
    playerName: findPlayerName(normalizedTeamKey, playerId),
    points: deltaPoints,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    timestamp,
    type: metadata.type ?? (deltaPoints >= 0 ? 'score' : 'adjustment'),
    shotType: metadata.shotType ?? inferShotType(deltaPoints),
    description: metadata.description ?? null
  };

  appendScoreEvent(event);
}

export function registerPenaltyEvent(teamKey, penalty, metadata = {}) {
  const normalizedTeamKey = TEAM_KEYS.includes(teamKey) ? teamKey : 'a';
  const playerId =
    metadata.playerId === null || metadata.playerId === undefined || metadata.playerId === ''
      ? null
      : Number(metadata.playerId);

  if (metadata.affectStats !== false) {
    applyPenaltyToStats(normalizedTeamKey, playerId, penalty.totalSeconds ?? penalty.remainingSeconds ?? 0);
  }

  const entry = {
    id: penalty.id,
    team: normalizedTeamKey,
    teamName: getTeamName(normalizedTeamKey),
    playerId,
    playerName: findPlayerName(normalizedTeamKey, playerId),
    durationSeconds: penalty.totalSeconds ?? penalty.remainingSeconds ?? 0,
    remainingSeconds: penalty.remainingSeconds ?? penalty.totalSeconds ?? 0,
    issuedAt: penalty.issuedAt ?? metadata.issuedAt ?? new Date().toISOString(),
    expiredAt: penalty.expiredAt ?? null,
    isExpired: penalty.isExpired ?? false,
    description: metadata.description ?? penalty.name ?? null
  };

  appendPenaltyEvent(entry);
}

export function updatePenaltyEvent(id, updater) {
  let changed = false;
  state.penaltyLog = state.penaltyLog.map((entry) => {
    if (entry.id !== id) {
      return entry;
    }
    const nextEntry = { ...entry };
    const result = updater(nextEntry) ?? nextEntry;
    changed = true;
    return result;
  });
  return changed;
}

export function markPenaltyExpiration(penalty, timestamp = new Date().toISOString()) {
  updatePenaltyEvent(penalty.id, (entry) => {
    entry.expiredAt = timestamp;
    entry.isExpired = true;
    entry.remainingSeconds = 0;
    return entry;
  });
}

export function markPenaltyRemoval(penaltyId, timestamp = new Date().toISOString()) {
  updatePenaltyEvent(penaltyId, (entry) => {
    entry.removedAt = timestamp;
    entry.remainingSeconds = entry.remainingSeconds ?? 0;
    return entry;
  });
}

export function snapshotState() {
  return {
    ...state,
    penalties: copyPenalties(),
    players: {
      a: cloneRoster(state.players.a),
      b: cloneRoster(state.players.b)
    },
    playerStats: {
      a: cloneStats(state.playerStats.a),
      b: cloneStats(state.playerStats.b)
    },
    scoringLog: state.scoringLog.map((event) => ({ ...event })),
    penaltyLog: state.penaltyLog.map((event) => ({ ...event }))
  };
}

export function notifySubscribers() {
  updateTimestamp();
  const currentState = snapshotState();

  for (const emit of subscribers) {
    try {
      emit(currentState);
    } catch (error) {
      console.error('Scoreboard subscriber error:', error);
    }
  }
}

export function addSubscriber(callback) {
  subscribers.add(callback);
}

export function removeSubscriber(callback) {
  subscribers.delete(callback);
}

export function getState() {
  return state;
}

export function generatePenaltyId() {
  return String(nextPenaltyId++);
}

export function resetPenaltyIds() {
  nextPenaltyId = 1;
}

export function resetScoreEventIds() {
  nextScoreEventId = 1;
}

export function setTournamentCompleted(flag) {
  const state = getState();
  const normalized = Boolean(flag);
  if (state.tournamentCompleted === normalized) {
    return snapshotState();
  }
  state.tournamentCompleted = normalized;
  notifySubscribers();
  return snapshotState();
}

export function bumpScheduleVersion() {
  const current = Number(state.scheduleVersion) || 0;
  state.scheduleVersion = current + 1;
  notifySubscribers();
  return state.scheduleVersion;
}

export function resetState(overrides = {}) {
  const nextState = createDefaultState(overrides);
  Object.keys(state).forEach((key) => {
    delete state[key];
  });
  Object.assign(state, nextState);
  notifySubscribers();
  return snapshotState();
}

export function refreshTeamTotals(teamKey) {
  const normalized = TEAM_KEYS.includes(teamKey) ? teamKey : 'a';
  ensureTeamTotalsEntry(normalized);
}

export function resetTeamStats(teamKey) {
  const normalized = TEAM_KEYS.includes(teamKey) ? teamKey : 'a';
  const roster = state.players?.[normalized] ?? [];
  state.playerStats[normalized] = buildStatsContainer(normalized, roster, getTeamName(normalized));
}

export {
  DEFAULT_DURATION_SECONDS,
  normalizeGroupStageLabel,
  createDefaultState,
  DISPLAY_VIEWS,
  DEFAULT_DISPLAY_VIEW
};
