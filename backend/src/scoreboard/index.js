import {
  snapshotState,
  markGameSaved,
  getState,
  notifySubscribers,
  normalizeGroupStageLabel,
  bumpScheduleVersion,
  setTournamentCompleted
} from './stateStore.js';
import { setDisplayView } from './display.js';
import { registerScoreboardSocket } from './socket.js';
import { setTeams, setMatchContext, applyScheduleMatchSelection } from './teams.js';
import { addPoints, setScoreAbsolute, resetScores } from './scoring.js';
import {
  setRemainingSeconds,
  setHalftimeSeconds,
  setHalftimePauseSeconds,
  setExtraSeconds,
  startTimer,
  pauseTimer,
  clearScoreboardTicker
} from './timer.js';
import { addPenalty, removePenalty } from './penalties.js';
import { clearGame, resetGame } from './reset.js';
import { startShootout, recordShootoutAttempt, undoShootoutAttempt, cancelShootout, ShootoutError } from './shootout.js';
import {
  startFreeThrows,
  setFreeThrowShooter,
  recordFreeThrow,
  undoFreeThrow,
  closeFreeThrows,
  awardFreeThrowsForPenalty,
  FreeThrowError
} from './freeThrows.js';

export function getScoreboardState() {
  return snapshotState();
}

export function markGameFinished() {
  getState().isFinished = true;
  notifySubscribers();
}

export {
  registerScoreboardSocket,
  setTeams,
  setMatchContext,
  applyScheduleMatchSelection,
  addPoints,
  setScoreAbsolute,
  resetScores,
  setRemainingSeconds,
  setHalftimeSeconds,
  setHalftimePauseSeconds,
  setExtraSeconds,
  startTimer,
  pauseTimer,
  clearScoreboardTicker,
  addPenalty,
  removePenalty,
  resetGame,
  clearGame,
  startShootout,
  recordShootoutAttempt,
  undoShootoutAttempt,
  cancelShootout,
  ShootoutError,
  startFreeThrows,
  setFreeThrowShooter,
  recordFreeThrow,
  undoFreeThrow,
  closeFreeThrows,
  awardFreeThrowsForPenalty,
  FreeThrowError,
  markGameSaved,
  normalizeGroupStageLabel,
  setDisplayView,
  bumpScheduleVersion,
  setTournamentCompleted
};
