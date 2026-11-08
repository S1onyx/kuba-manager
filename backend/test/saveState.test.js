import test from 'node:test';
import assert from 'node:assert/strict';
import { getState, snapshotState, markGameSaved } from '../src/scoreboard/stateStore.js';
import { clearGame } from '../src/scoreboard/reset.js';

test('Speicherstatus: ungespeichert → gespeichert → nach Änderung geändert', () => {
  clearGame();
  Object.assign(getState(), { scoreA: 4, scoreB: 2, isFinished: true });
  assert.equal(snapshotState().saveState, 'unsaved');
  markGameSaved(17);
  assert.deepEqual([snapshotState().saveState, snapshotState().savedGameId], ['saved', 17]);
  getState().scoreB = 3;
  assert.equal(snapshotState().saveState, 'changed');
  clearGame();
  assert.deepEqual([snapshotState().saveState, snapshotState().savedGameId, snapshotState().isFinished], ['unsaved', null, false]);
});
