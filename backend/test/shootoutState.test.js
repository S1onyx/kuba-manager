import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Treffer loesen Audio-Trigger aus, die die Datenbank oeffnen: eigene Wegwerf-DB statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

test('Stechen: Treffer zählt +1 Punkt für Spieler, Status im Zustand, Rückgängig und Speichersperre-Daten', async () => {
  const { startShootout, recordShootoutAttempt, undoShootoutAttempt } = await import('../src/scoreboard/shootout.js');
  const { getState } = await import('../src/scoreboard/stateStore.js');
  const { clearGame } = await import('../src/scoreboard/reset.js');
  clearGame();
  Object.assign(getState(), {
    stageType: 'knockout', scoreA: 6, scoreB: 6, isRunning: false, remainingSeconds: 0,
    overtime: { regularScoreA: 6, regularScoreB: 6, durationSeconds: 300 },
    players: { a: [{ playerId: 1, name: 'Anna' }], b: [{ playerId: 2, name: 'Ben' }] }
  });
  startShootout({ firstTeam: 'a' });
  let state = recordShootoutAttempt({ team: 'a', playerId: 1, hit: true });
  assert.deepEqual([state.scoreA, state.scoreB], [7, 6]);
  assert.equal(state.shootout.attempts[0].playerName, 'Anna');
  assert.equal(state.shootout.status.nextTeam, 'b');
  assert.equal(state.scoringLog.at(-1).type, 'shootout');
  state = recordShootoutAttempt({ team: 'b', playerId: 2, hit: false });
  assert.deepEqual([state.scoreA, state.scoreB, state.shootout.status.hits.a, state.shootout.status.hits.b], [7, 6, 1, 0]);
  undoShootoutAttempt();
  state = undoShootoutAttempt();
  assert.deepEqual([state.scoreA, state.shootout.attempts.length], [6, 0]);
  assert.throws(() => startShootout(), /läuft bereits/);
});
