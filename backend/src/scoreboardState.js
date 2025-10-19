const DEFAULT_DURATION_SECONDS = 10 * 60; // 10 minutes

function createDefaultState() {
  return {
    teamAName: 'Team A',
    teamBName: 'Team B',
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
    halftimePauseSeconds: 60,
    halftimePauseRemaining: 60,
    extraSeconds: 0,
    extraElapsedSeconds: 0,
    halftimeTriggered: false,
    isHalftimeBreak: false,
    isExtraTime: false,
    currentHalf: 1,
    lastUpdated: new Date().toISOString()
  };
}

const state = createDefaultState();

let ticker = null;
let nextPenaltyId = 1;
const subscribers = new Set();

function copyPenalties() {
  return {
    a: state.penalties.a.map((penalty) => ({ ...penalty })),
    b: state.penalties.b.map((penalty) => ({ ...penalty }))
  };
}

function snapshot() {
  return {
    ...state,
    penalties: copyPenalties()
  };
}

function updateTimestamp() {
  state.lastUpdated = new Date().toISOString();
}

function notifySubscribers() {
  updateTimestamp();
  const currentState = snapshot();

  for (const emit of subscribers) {
    try {
      emit(currentState);
    } catch (error) {
      console.error('Scoreboard subscriber error:', error);
    }
  }
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function tickPenalties() {
  let changed = false;

  ['a', 'b'].forEach((teamKey) => {
    const penalties = state.penalties[teamKey];
    if (penalties.length === 0) return;

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

      if (state.isRunning && tickPenalties()) {
        changed = true;
      }
    } else {
      // neither running nor halftime break, stop ticker
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

export function registerScoreboardSocket(socket) {
  const sendUpdate = (payload) => socket.emit('scoreboard:update', payload);

  subscribers.add(sendUpdate);
  sendUpdate(snapshot());

  socket.on('disconnect', () => {
    subscribers.delete(sendUpdate);
  });
}

export function getScoreboardState() {
  return snapshot();
}

export function setTeams({ teamAName, teamBName }) {
  let changed = false;

  if (typeof teamAName === 'string') {
    const trimmed = teamAName.trim();
    if (trimmed.length > 0 && trimmed !== state.teamAName) {
      state.teamAName = trimmed;
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
    notifySubscribers();
  }

  return snapshot();
}

export function addPoints(team, points) {
  const normalized = Number(points);
  if (!Number.isFinite(normalized) || normalized === 0) {
    return snapshot();
  }

  const delta = Math.trunc(normalized);
  if (String(team).toLowerCase() === 'b') {
    state.scoreB = Math.max(0, (state.scoreB || 0) + delta);
  } else {
    state.scoreA = Math.max(0, (state.scoreA || 0) + delta);
  }

  notifySubscribers();
  return snapshot();
}

export function setScoreAbsolute(team, score) {
  const teamKey = String(team).toLowerCase();
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0) {
    return snapshot();
  }

  const sanitized = Math.trunc(numericScore);

  if (teamKey === 'b') {
    state.scoreB = sanitized;
  } else if (teamKey === 'a') {
    state.scoreA = sanitized;
  } else {
    return snapshot();
  }

  notifySubscribers();
  return snapshot();
}

export function resetScores() {
  state.scoreA = 0;
  state.scoreB = 0;
  notifySubscribers();
  return snapshot();
}

export function setRemainingSeconds(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshot();
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
  return snapshot();
}

export function addPenalty(team, label, durationSeconds) {
  const normalizedTeam = String(team).toLowerCase() === 'b' ? 'b' : 'a';
  const sanitizedLabel = (label ?? '').toString().trim() || `Strafe ${nextPenaltyId}`;
  const duration = Math.max(1, Math.trunc(Number(durationSeconds) || 0));

  const penalty = {
    id: String(nextPenaltyId++),
    name: sanitizedLabel,
    remainingSeconds: duration,
    totalSeconds: duration,
    team: normalizedTeam,
    isExpired: false,
    expiredAt: null
  };

  state.penalties[normalizedTeam].push(penalty);
  notifySubscribers();
  return snapshot();
}

export function removePenalty(id) {
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

  return snapshot();
}

export function setHalftimeSeconds(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshot();
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

  return snapshot();
}

export function setHalftimePauseSeconds(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshot();
  }

  const sanitized = Math.max(0, Math.trunc(parsed));
  state.halftimePauseSeconds = sanitized;
  state.halftimePauseRemaining = sanitized;
  notifySubscribers();

  return snapshot();
}

export function setExtraSeconds(seconds) {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) {
    return snapshot();
  }

  const sanitized = Math.max(0, Math.trunc(parsed));
  state.extraSeconds = sanitized;
  state.extraElapsedSeconds = 0;
  state.isExtraTime = sanitized > 0 ? state.isExtraTime : false;
  notifySubscribers();

  return snapshot();
}

export function startTimer() {
  if (state.isRunning) {
    return snapshot();
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
  return snapshot();
}

export function pauseTimer() {
  if (!state.isRunning) {
    return snapshot();
  }

  state.isRunning = false;
  if (!state.isHalftimeBreak) {
    stopTicker();
  }
  notifySubscribers();
  return snapshot();
}

export function clearScoreboardTicker() {
  stopTicker();
}

export function resetGame() {
  stopTicker();
  nextPenaltyId = 1;
  Object.assign(state, createDefaultState());
  notifySubscribers();
  return snapshot();
}
