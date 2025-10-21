import {
  getState,
  notifySubscribers,
  snapshotState,
  generatePenaltyId
} from './stateStore.js';

export function addPenalty(team, label, durationSeconds) {
  const state = getState();
  const normalizedTeam = String(team).toLowerCase() === 'b' ? 'b' : 'a';
  const id = generatePenaltyId();
  const sanitizedLabel = (label ?? '').toString().trim() || `Strafe ${id}`;
  const duration = Math.max(1, Math.trunc(Number(durationSeconds) || 0));

  const penalty = {
    id,
    name: sanitizedLabel,
    remainingSeconds: duration,
    totalSeconds: duration,
    team: normalizedTeam,
    isExpired: false,
    expiredAt: null
  };

  state.penalties[normalizedTeam].push(penalty);
  notifySubscribers();
  return snapshotState();
}

export function removePenalty(id) {
  const state = getState();
  const penaltyId = String(id);
  let changed = false;

  ['a', 'b'].forEach((teamKey) => {
    const penalties = state.penalties[teamKey];
    const filtered = penalties.filter((penalty) => penalty.id !== penaltyId);
    if (filtered.length !== penalties.length) {
      state.penalties[teamKey] = filtered;
      changed = true;
    }
  });

  if (changed) {
    notifySubscribers();
  }

  return snapshotState();
}
