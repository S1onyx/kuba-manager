import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Treffer und Uhrstart loesen Audio-Trigger aus, die die Datenbank oeffnen: eigene Wegwerf-DB statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

const ft = await import('../src/scoreboard/freeThrows.js');
const { getState, setTeamPlayers } = await import('../src/scoreboard/stateStore.js');
const { clearGame } = await import('../src/scoreboard/reset.js');
const { startTimer, clearScoreboardTicker } = await import('../src/scoreboard/timer.js');
const { addPenalty } = await import('../src/scoreboard/penalties.js');

const totalOf = (state, team) => state.playerStats[team].find((entry) => entry.isTeamTotal);
const playerOf = (state, team, playerId) => state.playerStats[team].find((entry) => entry.playerId === playerId);

function freshGame(overrides = {}) {
  clearGame();
  setTeamPlayers('a', [{ playerId: 1, name: 'Anna' }]);
  setTeamPlayers('b', [{ playerId: 2, name: 'Ben' }]);
  Object.assign(getState(), { durationSeconds: 600, remainingSeconds: 400, ...overrides });
}

afterEach(() => clearScoreboardTicker());

test('Serie starten: nur 1 oder 2 Würfe, Spieler muss zum Team gehören', () => {
  freshGame();
  assert.throws(() => ft.startFreeThrows({ team: 'a', total: 3 }), (error) => error.code === 'FREE_THROWS_INVALID_TOTAL');
  assert.throws(() => ft.startFreeThrows({ team: 'a', playerId: 2 }), (error) => error.code === 'PLAYER_NOT_IN_TEAM');
  const state = ft.startFreeThrows({ team: 'a', playerId: 1 });
  assert.deepEqual([state.freeThrows.team, state.freeThrows.total, state.freeThrows.playerName, state.freeThrows.status.done], ['a', 2, 'Anna', false]);
  assert.throws(() => ft.startFreeThrows({ team: 'b' }), (error) => error.code === 'FREE_THROWS_OPEN');
});

test('Start hält laufende Uhr an, nach letztem Wurf läuft sie weiter', () => {
  freshGame();
  startTimer();
  let state = ft.startFreeThrows({ team: 'b', playerId: 2 });
  assert.equal(state.isRunning, false);
  state = ft.recordFreeThrow({ hit: true });
  assert.deepEqual([state.scoreB, state.isRunning, state.scoringLog.at(-1).type, state.scoringLog.at(-1).shotType], [1, false, 'freethrow', 'free']);
  state = ft.recordFreeThrow({ hit: false });
  assert.deepEqual([state.isRunning, state.freeThrows.status.done, state.freeThrows.status.made, Boolean(state.freeThrows.completedAt)], [true, true, 1, true]);
  assert.deepEqual([playerOf(state, 'b', 2).freeThrowsAttempted, playerOf(state, 'b', 2).freeThrowsMade, playerOf(state, 'b', 2).points], [2, 1, 1]);
  assert.throws(() => ft.recordFreeThrow({ hit: true }), (error) => error.code === 'FREE_THROWS_DONE');
});

test('Letzten Wurf zurücknehmen nach Auto-Start: Uhr hält an und springt auf alte Zeit, Strafe auch', () => {
  freshGame();
  addPenalty('a', 'Foul', 60);
  startTimer();
  ft.startFreeThrows({ team: 'b', playerId: 2 });
  ft.recordFreeThrow({ hit: false });
  const resumed = ft.recordFreeThrow({ hit: true });
  assert.deepEqual([resumed.isRunning, 'clockBeforeResume' in resumed.freeThrows], [true, false]);
  // Uhr lief weiter: 7 Sekunden vergehen, Strafe läuft mit
  const live = getState();
  live.remainingSeconds -= 7;
  live.penalties.a[0].remainingSeconds -= 7;
  const state = ft.undoFreeThrow();
  assert.deepEqual([state.isRunning, state.remainingSeconds, state.penalties.a[0].remainingSeconds, state.scoreB], [false, 400, 60, 0]);
  assert.deepEqual([state.freeThrows.status.done, state.freeThrows.completedAt], [false, null]);
  // Erneut werfen: Uhr läuft wieder an
  assert.equal(ft.recordFreeThrow({ hit: true }).isRunning, true);
});

test('Zurücknehmen ohne vorherigen Auto-Start ändert die Uhr nicht', () => {
  freshGame();
  ft.startFreeThrows({ team: 'b' });
  ft.recordFreeThrow({ hit: true });
  getState().remainingSeconds = 390;
  const state = ft.undoFreeThrow();
  assert.deepEqual([state.isRunning, state.remainingSeconds], [false, 390]);
});

test('Keine Restzeit und keine Nachspielzeit: Uhr bleibt nach letztem Wurf aus', () => {
  freshGame({ remainingSeconds: 0, extraSeconds: 0 });
  ft.startFreeThrows({ team: 'a', total: 1 });
  const state = ft.recordFreeThrow({ hit: true });
  assert.deepEqual([state.isRunning, state.scoreA], [false, 1]);
});

test('Vor Spielbeginn startet die Uhr nach den Freiwürfen nicht', () => {
  freshGame({ remainingSeconds: 600 });
  ft.startFreeThrows({ team: 'a', total: 1 });
  assert.equal(ft.recordFreeThrow({ hit: false }).isRunning, false);
});

test('Jeder Wurf einer Serie kann von einem anderen Spieler kommen', () => {
  freshGame();
  setTeamPlayers('a', [{ playerId: 1, name: 'Anna' }, { playerId: 3, name: 'Clara' }]);
  ft.startFreeThrows({ team: 'a', playerId: 1 });
  ft.recordFreeThrow({ hit: true });
  assert.equal(ft.setFreeThrowShooter({ playerId: 3 }).freeThrows.playerName, 'Clara');
  const state = ft.recordFreeThrow({ hit: false });
  assert.deepEqual(state.freeThrows.attempts.map((attempt) => [attempt.playerName, attempt.hit]), [['Anna', true], ['Clara', false]]);
  assert.deepEqual([playerOf(state, 'a', 1).freeThrowsMade, playerOf(state, 'a', 1).freeThrowsAttempted, playerOf(state, 'a', 1).points], [1, 1, 1]);
  assert.deepEqual([playerOf(state, 'a', 3).freeThrowsMade, playerOf(state, 'a', 3).freeThrowsAttempted, playerOf(state, 'a', 3).points], [0, 1, 0]);
  assert.throws(() => ft.setFreeThrowShooter({ playerId: 1 }), (error) => error.code === 'FREE_THROWS_DONE');
});

test('Werfer direkt beim Wurf mitgeben; fremder Spieler abgelehnt', () => {
  freshGame();
  setTeamPlayers('a', [{ playerId: 1, name: 'Anna' }, { playerId: 3, name: 'Clara' }]);
  ft.startFreeThrows({ team: 'a' });
  assert.equal(ft.recordFreeThrow({ hit: true, playerId: 3 }).freeThrows.attempts[0].playerName, 'Clara');
  assert.throws(() => ft.recordFreeThrow({ hit: true, playerId: 2 }), (error) => error.code === 'PLAYER_NOT_IN_TEAM');
});

test('Freiwurf-Sounds: eigener Trigger für Treffer und daneben', () => {
  assert.deepEqual([ft.freeThrowSoundKey(true), ft.freeThrowSoundKey(false)], ['free_throw_hit', 'free_throw_miss']);
});

test('Zurücknehmen nimmt Punkt und Zähler beim richtigen Werfer zurück', () => {
  freshGame();
  setTeamPlayers('a', [{ playerId: 1, name: 'Anna' }, { playerId: 3, name: 'Clara' }]);
  ft.startFreeThrows({ team: 'a', playerId: 1 });
  ft.recordFreeThrow({ hit: true, playerId: 3 });
  ft.setFreeThrowShooter({ playerId: 1 });
  const state = ft.undoFreeThrow();
  assert.deepEqual([state.scoreA, state.freeThrows.attempts.length, state.freeThrows.playerName], [0, 0, 'Clara']);
  assert.deepEqual([playerOf(state, 'a', 3).freeThrowsAttempted, playerOf(state, 'a', 3).points, totalOf(state, 'a').freeThrowsMade], [0, 0, 0]);
  assert.throws(() => ft.undoFreeThrow(), (error) => error.code === 'FREE_THROWS_NO_ATTEMPTS');
});

test('Schließen: offene Serie mit Würfen abgelehnt, ohne Würfe oder fertig erlaubt', () => {
  freshGame();
  ft.startFreeThrows({ team: 'a' });
  ft.recordFreeThrow({ hit: false });
  assert.throws(() => ft.closeFreeThrows(), (error) => error.code === 'FREE_THROWS_HAS_ATTEMPTS');
  ft.recordFreeThrow({ hit: false });
  assert.equal(ft.closeFreeThrows().freeThrows, null);
  ft.startFreeThrows({ team: 'a' });
  assert.equal(ft.closeFreeThrows().freeThrows, null);
});

test('Fertige Serie darf durch neue ersetzt werden', () => {
  freshGame();
  ft.startFreeThrows({ team: 'a', total: 1 });
  ft.recordFreeThrow({ hit: true });
  assert.equal(ft.startFreeThrows({ team: 'b' }).freeThrows.team, 'b');
});

test('Strafe mit Freiwürfen legt Serie für Gegner an, bei offener Serie übersprungen', () => {
  freshGame();
  addPenalty('a', 'Foul', 60, { playerId: 1 });
  let result = ft.awardFreeThrowsForPenalty('a', 2);
  assert.deepEqual([result.skipped, result.state.freeThrows.team, result.state.freeThrows.source, result.state.freeThrows.playerId], [false, 'b', 'penalty', null]);
  addPenalty('b', 'Foul', 60);
  result = ft.awardFreeThrowsForPenalty('b', 1);
  assert.deepEqual([result.skipped, result.state.freeThrows.team, result.state.penalties.b.length], [true, 'b', 1]);
});

test('Spielstand-Reset entfernt Serie', async () => {
  const { resetScores } = await import('../src/scoreboard/scoring.js');
  freshGame();
  ft.startFreeThrows({ team: 'a' });
  assert.equal(resetScores().freeThrows, null);
});

test('Gespeichert-Status ändert sich bei neuem Freiwurf', async () => {
  const { markGameSaved, snapshotState } = await import('../src/scoreboard/stateStore.js');
  freshGame();
  ft.startFreeThrows({ team: 'a' });
  markGameSaved(99);
  assert.equal(snapshotState().saveState, 'saved');
  ft.recordFreeThrow({ hit: false });
  assert.equal(snapshotState().saveState, 'changed');
});
