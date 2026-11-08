import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, notifySubscribers } from '../src/scoreboard/stateStore.js';
import { clearGame } from '../src/scoreboard/reset.js';

test('Zurücksetzen verwirft Spiel komplett, behält nur Turnier und Beameransicht', () => {
  Object.assign(getState(), {
    tournamentId: 28, tournamentName: 'Kuba2026', tournamentCompleted: false, displayView: 'bracket',
    teamAName: 'Gäu Baller', teamBName: 'Jessie', teamAId: 4, teamBId: 31, scoreA: 7, scoreB: 3,
    stageType: 'group', stageLabel: 'A', scheduleCode: 'GRP_A_R1_M1', isRunning: false, scheduleVersion: 7
  });
  notifySubscribers();
  const state = clearGame();
  assert.equal(state.tournamentId, 28);
  assert.equal(state.tournamentName, 'Kuba2026');
  assert.equal(state.displayView, 'bracket');
  assert.deepEqual([state.teamAName, state.teamBName, state.teamAId, state.teamBId], ['Team A', 'Team B', null, null]);
  assert.deepEqual([state.scoreA, state.scoreB, state.scheduleCode, state.stageType], [0, 0, null, null]);
  assert.equal(state.isRunning, false);
  assert.equal(state.scheduleVersion, 7);
});
