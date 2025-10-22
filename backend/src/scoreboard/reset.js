import {
  getState,
  notifySubscribers,
  snapshotState,
  createDefaultState,
  resetPenaltyIds,
  resetScoreEventIds
} from './stateStore.js';
import { stopTicker } from './timer.js';

export function resetGame() {
  const state = getState();
  stopTicker();
  resetPenaltyIds();
  resetScoreEventIds();

  const context = {
    tournamentId: state.tournamentId,
    tournamentName: state.tournamentName,
    stageType: state.stageType,
    stageLabel: state.stageLabel,
    teamAName: state.teamAName,
    teamBName: state.teamBName,
    teamAId: state.teamAId,
    teamBId: state.teamBId,
    scheduleCode: state.scheduleCode,
    displayView: state.displayView,
    players: {
      a: state.players?.a ?? [],
      b: state.players?.b ?? []
    }
  };

  Object.assign(state, createDefaultState(context));
  notifySubscribers();
  return snapshotState();
}
