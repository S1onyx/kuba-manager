import { getState, notifySubscribers, snapshotState, applyFreeThrowToStats } from './stateStore.js';
import { addPoints } from './scoring.js';
import { evaluateShootout } from './shootoutRules.js';

export class ShootoutError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const SHOOTOUT_DESCRIPTION = 'Freiwurf-Stechen';

function normalizeTeam(team) {
  return String(team).toLowerCase() === 'b' ? 'b' : 'a';
}

function requireShootout(state) {
  if (!state.shootout) {
    throw new ShootoutError('SHOOTOUT_NOT_ACTIVE', 'Es läuft kein Freiwurf-Stechen.');
  }
  return state.shootout;
}

export function startShootout({ firstTeam = 'a' } = {}) {
  const state = getState();
  if (state.shootout) {
    throw new ShootoutError('SHOOTOUT_ALREADY_ACTIVE', 'Das Freiwurf-Stechen läuft bereits.');
  }
  if (state.isRunning) {
    throw new ShootoutError('GAME_STILL_RUNNING', 'Bitte zuerst die Spielzeit anhalten.');
  }
  if ((state.scoreA ?? 0) !== (state.scoreB ?? 0)) {
    throw new ShootoutError('SHOOTOUT_NOT_TIED', 'Ein Freiwurf-Stechen ist nur bei Gleichstand möglich.');
  }
  state.shootout = {
    firstTeam: normalizeTeam(firstTeam),
    regularScoreA: state.scoreA ?? 0,
    regularScoreB: state.scoreB ?? 0,
    startedAt: new Date().toISOString(),
    attempts: []
  };
  notifySubscribers();
  return snapshotState();
}

export function recordShootoutAttempt({ team, playerId = null, hit }) {
  const state = getState();
  const shootout = requireShootout(state);
  if (evaluateShootout(shootout).decided) {
    throw new ShootoutError('SHOOTOUT_DECIDED', 'Das Freiwurf-Stechen ist bereits entschieden.');
  }
  const teamKey = normalizeTeam(team);
  const numericPlayerId = playerId === null || playerId === undefined || playerId === '' ? null : Number(playerId);
  const player = numericPlayerId === null ? null : (state.players?.[teamKey] ?? []).find((entry) => entry.playerId === numericPlayerId);
  if (numericPlayerId !== null && !player) {
    throw new ShootoutError('PLAYER_NOT_IN_TEAM', 'Spieler gehört nicht zum ausgewählten Team.');
  }
  shootout.attempts.push({
    id: `${Date.now()}-${shootout.attempts.length + 1}`,
    team: teamKey,
    playerId: numericPlayerId,
    playerName: player?.name ?? null,
    hit: Boolean(hit),
    at: new Date().toISOString()
  });
  applyFreeThrowToStats(teamKey, numericPlayerId, Boolean(hit));
  if (hit) {
    return addPoints(teamKey, 1, { playerId: numericPlayerId, shotType: 'free', description: SHOOTOUT_DESCRIPTION, type: 'shootout' });
  }
  notifySubscribers();
  return snapshotState();
}

export function undoShootoutAttempt() {
  const state = getState();
  const shootout = requireShootout(state);
  const last = shootout.attempts.pop();
  if (!last) {
    throw new ShootoutError('SHOOTOUT_NO_ATTEMPTS', 'Es gibt keinen Wurf zum Zurücknehmen.');
  }
  applyFreeThrowToStats(last.team, last.playerId, last.hit, -1);
  if (last.hit) {
    return addPoints(last.team, -1, { playerId: last.playerId, shotType: 'free', description: SHOOTOUT_DESCRIPTION, type: 'shootout' });
  }
  notifySubscribers();
  return snapshotState();
}

export function cancelShootout() {
  const state = getState();
  const shootout = requireShootout(state);
  if (shootout.attempts.length > 0) {
    throw new ShootoutError('SHOOTOUT_HAS_ATTEMPTS', 'Bitte zuerst alle Würfe zurücknehmen.');
  }
  state.shootout = null;
  notifySubscribers();
  return snapshotState();
}
