import {
  getState,
  notifySubscribers,
  snapshotState,
  markPenaltyExpiration
} from './stateStore.js';

let ticker = null;

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function tickPenalties(state) {
  let changed = false;

  ['a', 'b'].forEach((teamKey) => {
    const penalties = state.penalties[teamKey];
    if (penalties.length === 0) {
      return;
    }

    penalties.forEach((penalty) => {
      if (penalty.remainingSeconds > 0) {
        const nextValue = Math.max(0, penalty.remainingSeconds - 1);
        if (nextValue !== penalty.remainingSeconds) {
          penalty.remainingSeconds = nextValue;
          changed = true;
        }

        if (penalty.remainingSeconds === 0 && !penalty.isExpired) {
          penalty.isExpired = true;
          penalty.expiredAt = new Date().toISOString();
          markPenaltyExpiration(penalty, penalty.expiredAt);
          changed = true;
        }
      }
    });
  });

  return changed;
}

function ensureTicker() {
  if (ticker) {
    return;
  }

  ticker = setInterval(() => {
    const state = getState();
    let changed = false;

    if (state.isHalftimeBreak) {
      if (state.halftimePauseRemaining > 0) {
        state.halftimePauseRemaining = Math.max(0, state.halftimePauseRemaining - 1);
        changed = true;

        if (state.halftimePauseRemaining === 0) {
          stopTicker();
        }
      } else {
        stopTicker();
      }
    } else if (state.isRunning) {
      if (state.remainingSeconds > 0) {
        state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
        changed = true;
        state.isExtraTime = false;

        if (
          state.currentHalf === 1 &&
          state.halftimeSeconds > 0 &&
          !state.halftimeTriggered &&
          state.remainingSeconds === state.halftimeSeconds
        ) {
          state.halftimeTriggered = true;
          state.currentHalf = 2;
          state.isRunning = false;
          if (state.halftimePauseSeconds > 0) {
            state.isHalftimeBreak = true;
            state.halftimePauseRemaining = state.halftimePauseSeconds;
          }
          ensureTicker();
          changed = true;
        }
      } else {
        state.extraElapsedSeconds += 1;
        state.isExtraTime = true;
        changed = true;
      }

      if (state.isRunning && tickPenalties(state)) {
        changed = true;
      }
    } else {
      stopTicker();
      return;
    }

    if (!state.isRunning && !state.isHalftimeBreak) {
      stopTicker();
    }

    if (changed) {
      notifySubscribers();
    }
  }, 1000);
}

export function setRemainingSeconds(seconds) {
  const state = getState();
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshotState();
  }

  const sanitized = Math.max(0, Math.trunc(parsed));
  state.durationSeconds = sanitized;
  state.remainingSeconds = sanitized;
  state.isRunning = false;
  state.halftimeTriggered = false;
  state.isHalftimeBreak = false;
  state.currentHalf = 1;
  state.halftimePauseRemaining = state.halftimePauseSeconds;
  state.extraElapsedSeconds = 0;
  state.isExtraTime = false;
  stopTicker();
  notifySubscribers();
  return snapshotState();
}

export function setHalftimeSeconds(seconds) {
  const state = getState();
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshotState();
  }

  const sanitized = Math.max(0, Math.trunc(parsed));
  state.halftimeSeconds = sanitized;
  state.halftimeTriggered = false;
  state.isHalftimeBreak = false;
  if (state.currentHalf < 2) {
    state.currentHalf = 1;
  }
  state.halftimePauseRemaining = state.halftimePauseSeconds;
  state.isExtraTime = false;
  notifySubscribers();

  return snapshotState();
}

export function setHalftimePauseSeconds(seconds) {
  const state = getState();
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshotState();
  }

  const sanitized = Math.max(0, Math.trunc(parsed));
  state.halftimePauseSeconds = sanitized;
  state.halftimePauseRemaining = sanitized;
  notifySubscribers();

  return snapshotState();
}

export function setExtraSeconds(seconds) {
  const state = getState();
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshotState();
  }

  const sanitized = Math.max(0, Math.trunc(parsed));
  state.extraSeconds = sanitized;
  state.extraElapsedSeconds = 0;
  state.isExtraTime = sanitized > 0 ? state.isExtraTime : false;
  notifySubscribers();

  return snapshotState();
}

export function startTimer() {
  const state = getState();
  if (state.isRunning) {
    return snapshotState();
  }

  if (state.isHalftimeBreak) {
    state.isHalftimeBreak = false;
  }

  if (state.halftimeTriggered) {
    state.currentHalf = 2;
  } else {
    state.currentHalf = 1;
  }

  state.halftimePauseRemaining = state.halftimePauseSeconds;
  state.isExtraTime = state.remainingSeconds <= 0;
  state.isRunning = true;
  ensureTicker();
  notifySubscribers();
  return snapshotState();
}

export function pauseTimer() {
  const state = getState();
  if (!state.isRunning) {
    return snapshotState();
  }

  state.isRunning = false;
  if (!state.isHalftimeBreak) {
    stopTicker();
  }
  notifySubscribers();
  return snapshotState();
}

export function clearScoreboardTicker() {
  stopTicker();
}

export { stopTicker };
