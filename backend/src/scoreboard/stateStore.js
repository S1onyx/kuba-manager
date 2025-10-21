const DEFAULT_DURATION_SECONDS = 10 * 60;

function normalizeGroupStageLabel(input) {
  const raw = String(input ?? '').trim();
  if (!raw) {
    return '';
  }

  const upper = raw.toUpperCase();
  const groupPrefixMatch = upper.match(/^(GRUPPE|GROUP)\s+/);
  if (groupPrefixMatch) {
    return upper.slice(groupPrefixMatch[0].length).trim();
  }

  return upper.trim();
}

function createDefaultState(overrides = {}) {
  const base = {
    teamAName: 'Team A',
    teamBName: 'Team B',
    teamAId: null,
    teamBId: null,
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
    tournamentId: null,
    tournamentName: '',
    stageType: null,
    stageLabel: '',
    scheduleCode: null,
    lastUpdated: new Date().toISOString(),
    ...overrides
  };

  if (base.stageType === 'group') {
    base.stageLabel = normalizeGroupStageLabel(base.stageLabel);
  }

  return base;
}

const state = createDefaultState();

let nextPenaltyId = 1;
const subscribers = new Set();

function copyPenalties() {
  return {
    a: state.penalties.a.map((penalty) => ({ ...penalty })),
    b: state.penalties.b.map((penalty) => ({ ...penalty }))
  };
}

function updateTimestamp() {
  state.lastUpdated = new Date().toISOString();
}

export function snapshotState() {
  return {
    ...state,
    penalties: copyPenalties()
  };
}

export function notifySubscribers() {
  updateTimestamp();
  const currentState = snapshotState();

  for (const emit of subscribers) {
    try {
      emit(currentState);
    } catch (error) {
      console.error('Scoreboard subscriber error:', error);
    }
  }
}

export function addSubscriber(callback) {
  subscribers.add(callback);
}

export function removeSubscriber(callback) {
  subscribers.delete(callback);
}

export function getState() {
  return state;
}

export function generatePenaltyId() {
  return String(nextPenaltyId++);
}

export function resetPenaltyIds() {
  nextPenaltyId = 1;
}

export function resetState(overrides = {}) {
  Object.assign(state, createDefaultState(overrides));
  notifySubscribers();
}

export { DEFAULT_DURATION_SECONDS, normalizeGroupStageLabel, createDefaultState };
