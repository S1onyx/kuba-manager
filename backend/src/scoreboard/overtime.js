import { getState, notifySubscribers, snapshotState } from './stateStore.js';
import { startBreak, stopTicker } from './timer.js';
import { KNOCKOUT_STAGES, OVERTIME_PAUSE_SECONDS, OVERTIME_SECONDS, isClockOver } from './overtimeRules.js';

export class OvertimeError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const CLOCK_FIELDS = [
  'remainingSeconds',
  'extraSeconds',
  'extraElapsedSeconds',
  'isExtraTime',
  'isFinished',
  'currentHalf',
  'halftimeTriggered',
  'isHalftimeBreak',
  'halftimePauseRemaining'
];
const pick = (source, fields) => Object.fromEntries(fields.map((field) => [field, source[field]]));

// KO-Unentschieden nach Zeitablauf: 1 Minute Pause, danach Verlängerung über die halbe Spieldauer.
export function startOvertime() {
  const state = getState();
  if (state.overtime) {
    throw new OvertimeError('OVERTIME_ALREADY_STARTED', 'Die Verlängerung wurde bereits gestartet.');
  }
  if (!KNOCKOUT_STAGES.includes(state.stageType)) {
    throw new OvertimeError('OVERTIME_NOT_KNOCKOUT', 'Eine Verlängerung gibt es nur in KO-Spielen.');
  }
  if ((state.scoreA ?? 0) !== (state.scoreB ?? 0)) {
    throw new OvertimeError('OVERTIME_NOT_TIED', 'Eine Verlängerung ist nur bei Gleichstand möglich.');
  }
  if (!isClockOver(state)) {
    throw new OvertimeError('OVERTIME_CLOCK_NOT_OVER', 'Die reguläre Spielzeit ist noch nicht abgelaufen.');
  }
  const durationSeconds = OVERTIME_SECONDS;
  state.overtime = {
    regularScoreA: state.scoreA ?? 0,
    regularScoreB: state.scoreB ?? 0,
    durationSeconds,
    pauseSeconds: OVERTIME_PAUSE_SECONDS,
    startedAt: new Date().toISOString(),
    clockBefore: pick(state, CLOCK_FIELDS)
  };
  Object.assign(state, {
    remainingSeconds: durationSeconds,
    extraSeconds: 0,
    extraElapsedSeconds: 0,
    isExtraTime: false,
    isFinished: false,
    currentHalf: 2,
    halftimeTriggered: true
  });
  return startBreak(OVERTIME_PAUSE_SECONDS);
}

// Nur solange die Verlängerung noch nicht angepfiffen ist (z. B. versehentlich gestartet).
export function cancelOvertime() {
  const state = getState();
  const overtime = state.overtime;
  if (!overtime) {
    throw new OvertimeError('OVERTIME_NOT_ACTIVE', 'Es läuft keine Verlängerung.');
  }
  const notStarted = state.isHalftimeBreak || (!state.isRunning && state.remainingSeconds === overtime.durationSeconds);
  if (!notStarted) {
    throw new OvertimeError('OVERTIME_IN_PROGRESS', 'Die Verlängerung läuft bereits.');
  }
  state.isRunning = false;
  stopTicker();
  Object.assign(state, overtime.clockBefore);
  state.overtime = null;
  notifySubscribers();
  return snapshotState();
}
