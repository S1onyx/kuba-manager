import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Audio-Trigger öffnen die Datenbank: eigene Wegwerf-DB statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

const { startOvertime, cancelOvertime } = await import('../src/scoreboard/overtime.js');
const { startShootout } = await import('../src/scoreboard/shootout.js');
const { getState } = await import('../src/scoreboard/stateStore.js');
const { clearGame } = await import('../src/scoreboard/reset.js');
const { setRemainingSeconds, stopTicker } = await import('../src/scoreboard/timer.js');

function tiedKnockoutAfterRegulation(overrides = {}) {
  clearGame();
  Object.assign(getState(), {
    stageType: 'knockout',
    scoreA: 5,
    scoreB: 5,
    remainingSeconds: 0,
    extraSeconds: 30,
    extraElapsedSeconds: 30,
    currentHalf: 2,
    halftimeTriggered: true,
    isFinished: true,
    ...overrides
  });
}

test.afterEach(() => stopTicker());

test('Verlängerung nur im KO-Spiel, bei Gleichstand und nach Ablauf der Spielzeit', () => {
  tiedKnockoutAfterRegulation({ stageType: 'group' });
  assert.throws(() => startOvertime(), { code: 'OVERTIME_NOT_KNOCKOUT' });
  tiedKnockoutAfterRegulation({ scoreB: 4 });
  assert.throws(() => startOvertime(), { code: 'OVERTIME_NOT_TIED' });
  tiedKnockoutAfterRegulation({ remainingSeconds: 12, isFinished: false });
  assert.throws(() => startOvertime(), { code: 'OVERTIME_CLOCK_NOT_OVER' });
  tiedKnockoutAfterRegulation({ isFinished: false, extraElapsedSeconds: 10 });
  assert.throws(() => startOvertime(), { code: 'OVERTIME_CLOCK_NOT_OVER' });
});

test('Start: 1 Minute Pause, danach halbe Spieldauer auf der Uhr, Nachspielzeit zurückgesetzt', () => {
  tiedKnockoutAfterRegulation({ durationSeconds: 600 });
  const state = startOvertime();
  assert.deepEqual(
    [state.isHalftimeBreak, state.halftimePauseRemaining, state.remainingSeconds, state.isRunning, state.isFinished],
    [true, 60, 300, false, false]
  );
  assert.deepEqual([state.extraSeconds, state.extraElapsedSeconds, state.currentHalf, state.halftimeTriggered], [0, 0, 2, true]);
  assert.deepEqual(
    { regularScoreA: state.overtime.regularScoreA, regularScoreB: state.overtime.regularScoreB, durationSeconds: state.overtime.durationSeconds },
    { regularScoreA: 5, regularScoreB: 5, durationSeconds: 300 }
  );
  assert.equal('clockBefore' in state.overtime, false);
  assert.throws(() => startOvertime(), { code: 'OVERTIME_ALREADY_STARTED' });
});

test('Abbrechen während der Pause stellt die Uhr wieder her, nach Anpfiff nicht mehr möglich', () => {
  tiedKnockoutAfterRegulation();
  startOvertime();
  let state = cancelOvertime();
  assert.deepEqual(
    [state.overtime, state.isHalftimeBreak, state.remainingSeconds, state.extraSeconds, state.extraElapsedSeconds, state.isFinished],
    [null, false, 0, 30, 30, true]
  );
  startOvertime();
  Object.assign(getState(), { isHalftimeBreak: false, remainingSeconds: 250 });
  assert.throws(() => cancelOvertime(), { code: 'OVERTIME_IN_PROGRESS' });
});

test('Freiwurf-Stechen erst nach abgelaufener Verlängerung', () => {
  tiedKnockoutAfterRegulation();
  assert.throws(() => startShootout(), { code: 'SHOOTOUT_NEEDS_OVERTIME' });
  startOvertime();
  assert.throws(() => startShootout(), { code: 'SHOOTOUT_NEEDS_OVERTIME' });
  Object.assign(getState(), { isHalftimeBreak: false, remainingSeconds: 0, isFinished: true });
  const state = startShootout({ firstTeam: 'b' });
  assert.equal(state.shootout.firstTeam, 'b');
});

test('Zeit setzen in der Verlängerung lässt Spieldauer und Halbzeit-Status unverändert', () => {
  tiedKnockoutAfterRegulation({ durationSeconds: 600 });
  startOvertime();
  const state = setRemainingSeconds(120);
  assert.deepEqual(
    [state.remainingSeconds, state.durationSeconds, state.halftimeTriggered, state.currentHalf, state.isHalftimeBreak],
    [120, 600, true, 2, false]
  );
});

test('Zusammenfassung aus gespeichertem Spiel: Verlängerung mit regulärem Stand', async () => {
  const { overtimeSummary } = await import('../src/services/shared/shootout.js');
  assert.equal(overtimeSummary({}), null);
  assert.deepEqual(overtimeSummary({ overtime: { regularScoreA: 4, regularScoreB: 4, durationSeconds: 300 } }), {
    regularScoreA: 4,
    regularScoreB: 4
  });
});
