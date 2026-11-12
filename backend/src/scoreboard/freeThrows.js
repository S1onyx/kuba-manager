import { getState, notifySubscribers, snapshotState, applyFreeThrowToStats, updatePenaltyEvent } from './stateStore.js';
import { addPoints } from './scoring.js';
import { pauseTimer, startTimer, stopTicker } from './timer.js';
import { triggerAudioEvent } from '../audio/dispatcher.js';

export class FreeThrowError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export const DEFAULT_FREE_THROWS = 2;
const ALLOWED_TOTALS = [1, 2];
const FREE_THROW_DESCRIPTION = 'Freiwurf';
export const freeThrowSoundKey = (hit) => (hit ? 'free_throw_hit' : 'free_throw_miss');

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

// Werfer für den nächsten Wurf; jeder Wurf einer Serie darf von einem anderen Spieler kommen.
export function setFreeThrowShooter({ playerId = null } = {}) {
  const state = getState();
  const series = requireSeries(state);
  if (isDone(series)) {
    throw new FreeThrowError('FREE_THROWS_DONE', 'Alle Freiwürfe wurden bereits geworfen.');
  }
  Object.assign(series, resolveShooter(state, series.team, playerId));
  notifySubscribers();
  return snapshotState();
}

export function recordFreeThrow({ hit, playerId } = {}) {
  const state = getState();
  const series = requireSeries(state);
  if (isDone(series)) {
    throw new FreeThrowError('FREE_THROWS_DONE', 'Alle Freiwürfe wurden bereits geworfen.');
  }
  if (playerId !== undefined) {
    Object.assign(series, resolveShooter(state, series.team, playerId));
  }
  const attemptHit = Boolean(hit);
  series.attempts.push({
    id: `${Date.now()}-${series.attempts.length + 1}`,
    hit: attemptHit,
    playerId: series.playerId,
    playerName: series.playerName,
    at: new Date().toISOString()
  });
  applyFreeThrowToStats(series.team, series.playerId, attemptHit);
  if (isDone(series)) {
    series.completedAt = new Date().toISOString();
  }
  triggerAudioEvent(freeThrowSoundKey(attemptHit), { team: series.team, playerName: series.playerName }).catch((error) => {
    console.error('Audio-Trigger (Freiwurf) fehlgeschlagen:', error);
  });
  if (attemptHit) {
    // Freiwurf-Treffer hat einen eigenen Sound statt Korb-Sound bzw. Korbhymne.
    addPoints(series.team, 1, { playerId: series.playerId, shotType: 'free', type: 'freethrow', description: FREE_THROW_DESCRIPTION, scoreAudio: false });
  } else {
    notifySubscribers();
  }
  if (series.completedAt && !state.isRunning && !state.isHalftimeBreak && hasPlayTimeLeft(state)) {
    series.clockBeforeResume = captureClock(state);
    // Ohne Startton, damit der Freiwurf-Sound nicht abgeschnitten wird.
    return startTimer({ silent: true });
  }
  return snapshotState();
}

const CLOCK_FIELDS = ['remainingSeconds', 'extraElapsedSeconds', 'isExtraTime', 'currentHalf', 'halftimeTriggered', 'isHalftimeBreak', 'halftimePauseRemaining', 'isFinished'];
const PENALTY_CLOCK_FIELDS = ['remainingSeconds', 'isExpired', 'expiredAt'];
const pick = (source, fields) => Object.fromEntries(fields.map((field) => [field, source[field]]));

// Uhr- und Strafenstand im Moment des Auto-Starts, um ihn beim Zurücknehmen wiederherzustellen.
function captureClock(state) {
  return {
    ...pick(state, CLOCK_FIELDS),
    penalties: ['a', 'b'].flatMap((team) => state.penalties[team].map((penalty) => ({ team, id: penalty.id, ...pick(penalty, PENALTY_CLOCK_FIELDS) })))
  };
}

// Still anhalten (kein Pause-Ton) – auch wenn inzwischen Halbzeitpause oder Spielende eingetreten ist.
function restoreClock(state, saved) {
  state.isRunning = false;
  stopTicker();
  Object.assign(state, pick(saved, CLOCK_FIELDS));
  saved.penalties.forEach(({ team, id, ...fields }) => {
    const penalty = state.penalties[team].find((entry) => entry.id === id);
    if (!penalty) return;
    Object.assign(penalty, fields);
    updatePenaltyEvent(id, (entry) => ({ ...entry, ...fields }));
  });
}

export function undoFreeThrow() {
  const state = getState();
  const series = requireSeries(state);
  const last = series.attempts.pop();
  if (!last) {
    throw new FreeThrowError('FREE_THROWS_NO_ATTEMPTS', 'Es gibt keinen Freiwurf zum Zurücknehmen.');
  }
  series.completedAt = null;
  if (series.clockBeforeResume) {
    restoreClock(state, series.clockBeforeResume);
    series.clockBeforeResume = null;
  }
  Object.assign(series, { playerId: last.playerId ?? null, playerName: last.playerName ?? null });
  applyFreeThrowToStats(series.team, last.playerId, last.hit, -1);
  if (last.hit) {
    return addPoints(series.team, -1, { playerId: last.playerId, shotType: 'free', type: 'freethrow', description: FREE_THROW_DESCRIPTION });
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
