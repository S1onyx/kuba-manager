import test from 'node:test';
import assert from 'node:assert/strict';
import { getSaveStatus } from '../src/utils/gameStatus.js';

const base = { teamAId: 1, teamBId: 2, scheduleCode: 'GRP_A_R1_M1', scoreA: 4, scoreB: 2, remainingSeconds: 120, durationSeconds: 600, isRunning: false, stageType: 'group', saveState: 'unsaved' };

test('Speicherstatus für Live-Steuerung', () => {
  assert.equal(getSaveStatus(null), 'none');
  assert.equal(getSaveStatus({ ...base, teamAId: null, teamBId: null, scheduleCode: null, scoreA: 0, scoreB: 0 }), 'none');
  assert.equal(getSaveStatus(base), 'running');
  assert.equal(getSaveStatus({ ...base, isFinished: true }), 'needsSave');
  assert.equal(getSaveStatus({ ...base, remainingSeconds: 0 }), 'needsSave');
  assert.equal(getSaveStatus({ ...base, isFinished: true, saveState: 'saved' }), 'saved');
  assert.equal(getSaveStatus({ ...base, isFinished: true, saveState: 'changed' }), 'changed');
  assert.equal(getSaveStatus({ ...base, isFinished: true, stageType: 'knockout', scoreB: 4 }), 'blocked');
  assert.equal(getSaveStatus({ ...base, isFinished: true, shootout: { status: { decided: false } } }), 'blocked');
});
