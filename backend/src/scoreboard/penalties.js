import {
  getState,
  notifySubscribers,
  snapshotState,
  generatePenaltyId,
  registerPenaltyEvent,
  markPenaltyRemoval
} from './stateStore.js';

export function addPenalty(team, label, durationSeconds, options = {}) {
  const state = getState();
  const normalizedTeam = String(team).toLowerCase() === 'b' ? 'b' : 'a';
  const id = generatePenaltyId();
  const sanitizedLabel = (label ?? '').toString().trim() || `Strafe ${id}`;
  const duration = Math.max(1, Math.trunc(Number(durationSeconds) || 0));
  const playerIdInput = options.playerId ?? options.player_id ?? null;
  const playerId =
    playerIdInput === null || playerIdInput === undefined || playerIdInput === ''
      ? null
      : Number(playerIdInput);
  const issuedAt = options.issuedAt ?? new Date().toISOString();
  const roster = state.players?.[normalizedTeam] ?? [];
  const playerMatch =
    playerId !== null ? roster.find((player) => player.playerId === Number(playerId)) : null;

  const penalty = {
    id,
    name: sanitizedLabel,
    remainingSeconds: duration,
    totalSeconds: duration,
    team: normalizedTeam,
    isExpired: false,
    expiredAt: null,
    issuedAt,
    playerId: playerId !== null && Number.isFinite(playerId) ? Number(playerId) : null,
    playerName: playerMatch?.name ?? null,
    description: options.description ?? sanitizedLabel
  };

  state.penalties[normalizedTeam].push(penalty);
  registerPenaltyEvent(normalizedTeam, penalty, {
    playerId: penalty.playerId,
    description: penalty.description
  });
  notifySubscribers();
  return snapshotState();
}

export function removePenalty(id) {
  const state = getState();
  const penaltyId = String(id);
  let changed = false;

  ['a', 'b'].forEach((teamKey) => {
    const penalties = state.penalties[teamKey];
    const removedPenalties = [];
    const filtered = penalties.filter((penalty) => {
      if (penalty.id === penaltyId) {
        removedPenalties.push(penalty);
        return false;
      }
      return true;
    });
    if (filtered.length !== penalties.length) {
      state.penalties[teamKey] = filtered;
      changed = true;
      removedPenalties.forEach((penalty) => {
        markPenaltyRemoval(penalty.id);
      });
    }
  });

  if (changed) {
    notifySubscribers();
  }

  return snapshotState();
}
