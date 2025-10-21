import { getState, notifySubscribers, snapshotState } from './stateStore.js';

export function addPoints(team, points) {
  const state = getState();
  const normalized = Number(points);
  if (!Number.isFinite(normalized) || normalized === 0) {
    return snapshotState();
  }

  const delta = Math.trunc(normalized);
  if (String(team).toLowerCase() === 'b') {
    state.scoreB = Math.max(0, (state.scoreB || 0) + delta);
  } else {
    state.scoreA = Math.max(0, (state.scoreA || 0) + delta);
  }

  notifySubscribers();
  return snapshotState();
}

export function setScoreAbsolute(team, score) {
  const state = getState();
  const teamKey = String(team).toLowerCase();
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0) {
    return snapshotState();
  }

  const sanitized = Math.trunc(numericScore);

  if (teamKey === 'b') {
    state.scoreB = sanitized;
  } else if (teamKey === 'a') {
    state.scoreA = sanitized;
  } else {
    return snapshotState();
  }

  notifySubscribers();
  return snapshotState();
}

export function resetScores() {
  const state = getState();
  state.scoreA = 0;
  state.scoreB = 0;
  notifySubscribers();
  return snapshotState();
}
