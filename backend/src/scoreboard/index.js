import { snapshotState, normalizeGroupStageLabel } from './stateStore.js';
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
import { resetGame } from './reset.js';

export function getScoreboardState() {
  return snapshotState();
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
  normalizeGroupStageLabel
};
