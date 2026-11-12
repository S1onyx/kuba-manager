import { getState, notifySubscribers, snapshotState, applyFreeThrowToStats } from './stateStore.js';
import { addPoints } from './scoring.js';
import { pauseTimer, startTimer } from './timer.js';

export class FreeThrowError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const DEFAULT_FREE_THROWS = 2;
const ALLOWED_TOTALS = [1, 2];
const FREE_THROW_DESCRIPTION = 'Freiwurf';

const normalizeTeam = (team) => (String(team).toLowerCase() === 'b' ? 'b' : 'a');
const isDone = (series) => series.attempts.length >= series.total;

function resolveShooter(state, teamKey, playerId) {
  if (playerId === null || playerId === undefined || playerId === '') {
    return { playerId: null, playerName: null };
  }
  const numericPlayerId = Number(playerId);
  const player = (state.players?.[teamKey] ?? []).find((entry) => entry.playerId === numericPlayerId);
  if (!player) {
    throw new FreeThrowError('PLAYER_NOT_IN_TEAM', 'Spieler gehört nicht zum ausgewählten Team.');
  }
  return { playerId: numericPlayerId, playerName: player.name };
}

function requireSeries(state) {
  if (!state.freeThrows) {
    throw new FreeThrowError('FREE_THROWS_NOT_ACTIVE', 'Es laufen keine Freiwürfe.');
  }
  return state.freeThrows;
}

function hasPlayTimeLeft(state) {
  const extraLeft = (state.extraSeconds ?? 0) - (state.extraElapsedSeconds ?? 0);
  const gameStarted = (state.remainingSeconds ?? 0) < (state.durationSeconds ?? 0) || (state.extraElapsedSeconds ?? 0) > 0;
  return gameStarted && ((state.remainingSeconds ?? 0) > 0 || extraLeft > 0);
}

export function startFreeThrows({ team = 'a', playerId = null, total = DEFAULT_FREE_THROWS, source = 'manual' } = {}) {
  const state = getState();
  if (state.freeThrows && !isDone(state.freeThrows)) {
    throw new FreeThrowError('FREE_THROWS_OPEN', 'Es laufen bereits Freiwürfe.');
  }
  const numericTotal = Number(total);
  if (!ALLOWED_TOTALS.includes(numericTotal)) {
    throw new FreeThrowError('FREE_THROWS_INVALID_TOTAL', 'Es sind nur 1 oder 2 Freiwürfe möglich.');
  }
  if (!['a', 'b'].includes(String(team).toLowerCase())) {
    throw new FreeThrowError('INVALID_TEAM_SIDE', 'Ungültiges Team. Erlaubt sind "A" oder "B".');
  }
  const teamKey = normalizeTeam(team);
  state.freeThrows = {
    team: teamKey,
    ...resolveShooter(state, teamKey, playerId),
    total: numericTotal,
    source: source === 'penalty' ? 'penalty' : 'manual',
    attempts: [],
    startedAt: new Date().toISOString(),
    completedAt: null
  };
  if (state.isRunning) {
    return pauseTimer();
  }
  notifySubscribers();
  return snapshotState();
}

export function setFreeThrowShooter({ playerId = null } = {}) {
  const state = getState();
  const series = requireSeries(state);
  if (series.attempts.length > 0) {
    throw new FreeThrowError('FREE_THROWS_SHOOTER_LOCKED', 'Der Werfer kann nach dem ersten Wurf nicht mehr geändert werden.');
  }
  Object.assign(series, resolveShooter(state, series.team, playerId));
  notifySubscribers();
  return snapshotState();
}

export function recordFreeThrow({ hit } = {}) {
  const state = getState();
  const series = requireSeries(state);
  if (isDone(series)) {
    throw new FreeThrowError('FREE_THROWS_DONE', 'Alle Freiwürfe wurden bereits geworfen.');
  }
  const attemptHit = Boolean(hit);
  series.attempts.push({ id: `${Date.now()}-${series.attempts.length + 1}`, hit: attemptHit, at: new Date().toISOString() });
  applyFreeThrowToStats(series.team, series.playerId, attemptHit);
  if (isDone(series)) {
    series.completedAt = new Date().toISOString();
  }
  if (attemptHit) {
    addPoints(series.team, 1, { playerId: series.playerId, shotType: 'free', type: 'freethrow', description: FREE_THROW_DESCRIPTION });
  } else {
    notifySubscribers();
  }
  if (series.completedAt && !state.isRunning && !state.isHalftimeBreak && hasPlayTimeLeft(state)) {
    return startTimer();
  }
  return snapshotState();
}

export function undoFreeThrow() {
  const state = getState();
  const series = requireSeries(state);
  const last = series.attempts.pop();
  if (!last) {
    throw new FreeThrowError('FREE_THROWS_NO_ATTEMPTS', 'Es gibt keinen Freiwurf zum Zurücknehmen.');
  }
  series.completedAt = null;
  applyFreeThrowToStats(series.team, series.playerId, last.hit, -1);
  if (last.hit) {
    return addPoints(series.team, -1, { playerId: series.playerId, shotType: 'free', type: 'freethrow', description: FREE_THROW_DESCRIPTION });
  }
  notifySubscribers();
  return snapshotState();
}

export function closeFreeThrows() {
  const state = getState();
  const series = requireSeries(state);
  if (!isDone(series) && series.attempts.length > 0) {
    throw new FreeThrowError('FREE_THROWS_HAS_ATTEMPTS', 'Bitte zuerst alle Freiwürfe werfen oder zurücknehmen.');
  }
  state.freeThrows = null;
  notifySubscribers();
  return snapshotState();
}

// Freiwürfe gehen an den Gegner des bestraften Teams; Werfer wird danach in der Freiwurf-Karte gewählt.
export function awardFreeThrowsForPenalty(penalizedTeam, total) {
  const state = getState();
  if (state.freeThrows && !isDone(state.freeThrows)) {
    return { skipped: true, state: snapshotState() };
  }
  const opponent = normalizeTeam(penalizedTeam) === 'a' ? 'b' : 'a';
  return { skipped: false, state: startFreeThrows({ team: opponent, total, source: 'penalty' }) };
}
