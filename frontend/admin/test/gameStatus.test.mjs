import test from 'node:test';
import assert from 'node:assert/strict';
import { canStartOvertime, canStartShootout, getSaveStatus, isOvertimeBreak } from '../src/utils/gameStatus.js';

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
  assert.equal(getSaveStatus({ ...base, isFinished: true, freeThrows: { status: { done: false } } }), 'freeThrowsOpen');
  assert.equal(getSaveStatus({ ...base, isFinished: true, freeThrows: { status: { done: true } } }), 'needsSave');
});

const koDraw = { ...base, stageType: 'knockout', scoreA: 5, scoreB: 5, remainingSeconds: 0, extraSeconds: 0, extraElapsedSeconds: 0 };

test('Verlängerung: erst nach Zeitablauf bei KO-Unentschieden, danach Stechen', () => {
  assert.equal(canStartOvertime(koDraw), true);
  assert.equal(canStartOvertime({ ...koDraw, isFinished: true, remainingSeconds: 40 }), true);
  assert.equal(canStartOvertime({ ...koDraw, stageType: 'group' }), false);
  assert.equal(canStartOvertime({ ...koDraw, scoreB: 4 }), false);
  assert.equal(canStartOvertime({ ...koDraw, remainingSeconds: 40 }), false);
  assert.equal(canStartOvertime({ ...koDraw, extraSeconds: 30, extraElapsedSeconds: 10 }), false);
  assert.equal(canStartOvertime({ ...koDraw, isRunning: true }), false);
  assert.equal(canStartShootout(koDraw), false);

  const overtime = { regularScoreA: 5, regularScoreB: 5, durationSeconds: 300 };
  const inBreak = { ...koDraw, overtime, remainingSeconds: 300, isHalftimeBreak: true };
  assert.equal(canStartOvertime(inBreak), false);
  assert.equal(isOvertimeBreak(inBreak), true);
  assert.equal(canStartShootout(inBreak), false);
  assert.equal(getSaveStatus(inBreak), 'running');
  assert.equal(canStartShootout({ ...koDraw, overtime, remainingSeconds: 120 }), false);

  const overtimeOver = { ...koDraw, overtime, remainingSeconds: 0 };
  assert.equal(isOvertimeBreak(overtimeOver), false);
  assert.equal(canStartShootout(overtimeOver), true);
  assert.equal(canStartShootout({ ...overtimeOver, shootout: { attempts: [] } }), false);
  assert.equal(getSaveStatus(overtimeOver), 'blocked');
});
