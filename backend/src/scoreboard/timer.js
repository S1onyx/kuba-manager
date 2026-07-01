import {
  getState,
  notifySubscribers,
  snapshotState,
  markPenaltyExpiration
} from './stateStore.js';
import { triggerAudioEvent } from '../audio/dispatcher.js';
import { broadcastAudioStop } from '../audio/socket.js';
import { getTimerCueSettingsSync } from '../services/audio/index.js';

let ticker = null;

function createAudioContext(state) {
  return {
    teamA: state.teamAName,
    teamB: state.teamBName,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    remainingSeconds: state.remainingSeconds
  };
}

function triggerPauseTone(context) {
  triggerAudioEvent('game_pause', context).catch((error) => {
    console.error('Audio-Trigger (game_pause) fehlgeschlagen:', error);
  });
}

// Pure: which cue (if any) fires `secondsLeft` seconds before a boundary.
// Beep only inside (0, countdownFrom] → it stops exactly at the boundary, never past it.
export function classifyCue(secondsLeft, { warningSeconds, countdownFrom }) {
  if (secondsLeft <= 0) {
    return null;
  }
  if (warningSeconds > 0 && secondsLeft === warningSeconds) {
    return 'timer_warning';
  }
  if (countdownFrom > 0 && secondsLeft <= countdownFrom) {
    return 'timer_countdown_beep';
  }
  return null;
}

// Warn/countdown cues relative to a boundary (0 = end of half / game / break).
function fireTimerCue(secondsLeft, context) {
  const key = classifyCue(secondsLeft, getTimerCueSettingsSync());
  if (!key) {
    return;
  }
  triggerAudioEvent(key, context).catch((err) => {
    console.error(`Audio-Trigger (${key}) fehlgeschlagen:`, err);
  });
}

function triggerStartTone(context) {
  triggerAudioEvent('game_start', context)
    .then((payload) => {
      if (payload) {
        return;
      }
      triggerPauseTone(context);
    })
    .catch((error) => {
      console.error('Audio-Trigger (game_start) fehlgeschlagen:', error);
      triggerPauseTone(context);
    });
}

function stopTicker() {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function endGame(state) {
  state.remainingSeconds = 0;
  state.extraElapsedSeconds = 0;
  state.isExtraTime = false;
  state.isRunning = false;
  stopTicker();
  triggerAudioEvent('game_end', {
    teamA: state.teamAName,
    teamB: state.teamBName,
    scoreA: state.scoreA,
    scoreB: state.scoreB
  }).catch((error) => {
    console.error('Audio-Trigger (game_end) fehlgeschlagen:', error);
  });
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
          triggerAudioEvent('penalty_expired', {
            team: teamKey,
            name: penalty.name ?? null
          }).catch((error) => {
            console.error('Audio-Trigger (penalty_expired) fehlgeschlagen:', error);
          });
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
        // Countdown/warning before the break ends
        fireTimerCue(state.halftimePauseRemaining, createAudioContext(state));
      }

      if (state.halftimePauseRemaining === 0 && state.isHalftimeBreak) {
        state.isHalftimeBreak = false;
        changed = true;
        if (getTimerCueSettingsSync().halftimeAutoStart) {
          state.isRunning = true;
          triggerStartTone(createAudioContext(state));
        } else {
          // Default: leave paused, ref starts 2nd half manually.
          // No sound plays here, so cut off the last countdown beep explicitly.
          state.isRunning = false;
          stopTicker();
          broadcastAudioStop();
        }
      }
    } else if (state.isRunning) {
      const inFirstHalf =
        state.currentHalf === 1 && state.halftimeSeconds > 0 && !state.halftimeTriggered;
      const plannedExtra = Math.max(0, state.extraSeconds ?? 0);

      if (state.remainingSeconds > 0) {
        state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
        changed = true;
        state.isExtraTime = false;

        // Halftime is only "ahead" while we're in the 1st half AND above the halftime mark.
        const halftimeAhead = inFirstHalf && state.remainingSeconds > state.halftimeSeconds;

        if (inFirstHalf && state.remainingSeconds === state.halftimeSeconds) {
          state.halftimeTriggered = true;
          state.currentHalf = 2;
          state.isRunning = false;
          if (state.halftimePauseSeconds > 0) {
            state.isHalftimeBreak = true;
            state.halftimePauseRemaining = state.halftimePauseSeconds;
          }
          ensureTicker();
          changed = true;
          triggerPauseTone(createAudioContext(state));
        } else if (halftimeAhead) {
          // Next boundary is halftime
          fireTimerCue(state.remainingSeconds - state.halftimeSeconds, createAudioContext(state));
        } else {
          // Next boundary is game end — count the planned extra time in
          fireTimerCue(state.remainingSeconds + plannedExtra, createAudioContext(state));
        }
      } else if (plannedExtra > 0 && state.extraElapsedSeconds < plannedExtra) {
        // Nachspielzeit runs up to the planned amount, then the game ends
        state.extraElapsedSeconds += 1;
        state.isExtraTime = true;
        changed = true;
        const extraLeft = plannedExtra - state.extraElapsedSeconds;
        fireTimerCue(extraLeft, createAudioContext(state));
        if (extraLeft <= 0) {
          endGame(state);
        }
      } else {
        endGame(state);
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
  triggerStartTone(createAudioContext(state));
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
  triggerPauseTone(createAudioContext(state));
  return snapshotState();
}

export function clearScoreboardTicker() {
  stopTicker();
}

export { stopTicker };
