import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScheduleProgress } from '../src/utils/scheduleProgress.js';

const at = (hhmm) => Date.UTC(2026, 10, 14, ...hhmm.split(':').map(Number));
const entries = [
  { key: 1, code: 'GRP_A_R1_M1', timestamp: at('13:00'), result: { hasResult: true } },
  { key: 2, code: 'GRP_A_R1_M2', timestamp: at('13:12'), result: { hasResult: true } },
  { key: 3, code: 'GRP_A_R1_M3', timestamp: at('13:24'), result: null },
  { key: 4, code: 'GRP_B_R1_M1', timestamp: at('13:36'), result: null },
  { key: 5, code: 'GRP_B_R1_M2', timestamp: at('13:48'), result: null }
];
const live = (code, playedMinutes = 0) => ({ code, durationSeconds: 600, remainingSeconds: 600 - playedMinutes * 60 });

test('Laufendes Spiel bestimmt Markierung, nicht die Uhrzeit', () => {
  const progress = computeScheduleProgress(entries, live('GRP_A_R1_M3', 4), at('13:52'));
  assert.equal(progress.activeKey, 3);
  assert.equal(progress.nextKey, 4);
});

test('Verzug: Spiel geplant 13:24, 4 Min. gespielt, jetzt 13:52 → 24 Min. hinter der Zeit', () => {
  const progress = computeScheduleProgress(entries, live('GRP_A_R1_M3', 4), at('13:52'));
  assert.equal(progress.delayMinutes, 24);
  assert.equal(progress.expectedTimestamp(entries[3]), at('14:00'));
  assert.equal(progress.expectedTimestamp(entries[0]), null);
  assert.equal(progress.expectedTimestamp(entries[2]), null);
});

test('Vorsprung: Spiel geplant 13:24 läuft schon seit 13:15 → 9 Min. vor der Zeit', () => {
  const progress = computeScheduleProgress(entries, live('GRP_A_R1_M3', 5), at('13:20'));
  assert.equal(progress.delayMinutes, -9);
  assert.equal(progress.expectedTimestamp(entries[4]), at('13:39'));
});

test('Pause zwischen Spielen: nächstes ungespieltes Spiel, Verzug nur wenn überfällig', () => {
  const late = computeScheduleProgress(entries, null, at('13:40'));
  assert.equal(late.activeKey, null);
  assert.equal(late.nextKey, 3);
  assert.equal(late.delayMinutes, 16);
  assert.equal(computeScheduleProgress(entries, null, at('13:20')).delayMinutes, 0);
});

test('Beendetes Spiel noch im Scoreboard gilt als gespielt', () => {
  const progress = computeScheduleProgress(entries, live('GRP_A_R1_M2', 10), at('13:30'));
  assert.equal(progress.activeKey, null);
  assert.equal(progress.nextKey, 3);
});

test('Vor Turnierbeginn kein Verzug, kein Fortschritt', () => {
  const fresh = entries.map((entry) => ({ ...entry, result: null }));
  const progress = computeScheduleProgress(fresh, null, at('15:00'));
  assert.equal(progress.hasStarted, false);
  assert.equal(progress.delayMinutes, null);
  assert.equal(progress.nextKey, 1);
});

test('Live-Erkennung: Spiel aus Spielplan läuft, gespeichertes oder zurückgesetztes nicht', async () => {
  const { isMatchLive } = await import('../src/utils/scheduleProgress.js');
  const base = { tournamentId: 28, durationSeconds: 600, remainingSeconds: 600, scoreA: 0, scoreB: 0, isRunning: false };
  const playedEntries = [{ code: 'GRP_A_R1_M1', result: { hasResult: true } }, { code: 'GRP_A_R1_M2', result: null }];
  assert.equal(isMatchLive({ ...base, scheduleCode: 'GRP_A_R1_M2' }, playedEntries, 28), true);
  assert.equal(isMatchLive({ ...base, scheduleCode: 'GRP_A_R1_M1', scoreA: 7 }, playedEntries, 28), false);
  assert.equal(isMatchLive({ ...base, scheduleCode: null }, playedEntries, 28), false);
  assert.equal(isMatchLive({ ...base, scheduleCode: 'GRP_A_R1_M2' }, playedEntries, 21), false);
  assert.equal(isMatchLive({ ...base, teamAId: 4, teamBId: 9, isRunning: true }, playedEntries, 28), true);
  assert.equal(isMatchLive(null, playedEntries, 28), false);
});

test('Abgeschlossenes Turnier: kein Verzug, kein „Als Nächstes“, keine ca.-Zeiten', () => {
  const progress = computeScheduleProgress(entries, null, at('15:00') + 400 * 24 * 3600 * 1000, { completed: true });
  assert.equal(progress.delayMinutes, null);
  assert.equal(progress.nextKey, null);
  assert.equal(progress.activeKey, null);
  assert.equal(progress.expectedTimestamp(entries[2]), null);
});

test('Unplausibler Verzug (anderer Tag) wird nicht angezeigt', () => {
  const progress = computeScheduleProgress(entries, null, at('13:40') + 2 * 24 * 3600 * 1000);
  assert.equal(progress.delayMinutes, null);
  assert.equal(progress.expectedTimestamp(entries[3]), null);
});
