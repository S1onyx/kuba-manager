import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Treffer loesen Audio-Trigger aus, die die Datenbank oeffnen: eigene Wegwerf-DB statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

const totalOf = (state, team) => state.playerStats[team].find((entry) => entry.isTeamTotal);
const playerOf = (state, team, playerId) => state.playerStats[team].find((entry) => entry.playerId === playerId);

async function freshGame(overrides = {}) {
  const { clearGame } = await import('../src/scoreboard/reset.js');
  const { getState, setTeamPlayers } = await import('../src/scoreboard/stateStore.js');
  clearGame();
  setTeamPlayers('a', [{ playerId: 1, name: 'Anna' }]);
  setTeamPlayers('b', [{ playerId: 2, name: 'Ben' }]);
  Object.assign(getState(), overrides);
}

test('+1 zählt nicht mehr als Freiwurf', async () => {
  const { addPoints } = await import('../src/scoreboard/scoring.js');
  await freshGame();
  const state = addPoints('a', 1, { playerId: 1 });
  assert.equal(state.scoringLog.at(-1).shotType, 'single');
  assert.deepEqual([totalOf(state, 'a').freeThrowsAttempted, totalOf(state, 'a').freeThrowsMade], [0, 0]);
  assert.deepEqual([playerOf(state, 'a', 1).freeThrowsAttempted, playerOf(state, 'a', 1).points], [0, 1]);
});

test('Stechen-Würfe zählen in die Freiwurfquote, Zurücknehmen zieht ab', async () => {
  const { startShootout, recordShootoutAttempt, undoShootoutAttempt } = await import('../src/scoreboard/shootout.js');
  await freshGame({
    stageType: 'knockout', scoreA: 3, scoreB: 3, remainingSeconds: 0,
    overtime: { regularScoreA: 3, regularScoreB: 3, durationSeconds: 300 }
  });
  startShootout({ firstTeam: 'a' });
  recordShootoutAttempt({ team: 'a', playerId: 1, hit: true });
  recordShootoutAttempt({ team: 'b', playerId: 2, hit: false });
  let state = recordShootoutAttempt({ team: 'a', playerId: 1, hit: false });
  assert.deepEqual([playerOf(state, 'a', 1).freeThrowsAttempted, playerOf(state, 'a', 1).freeThrowsMade], [2, 1]);
  assert.deepEqual([totalOf(state, 'b').freeThrowsAttempted, totalOf(state, 'b').freeThrowsMade], [1, 0]);
  undoShootoutAttempt();
  undoShootoutAttempt();
  state = undoShootoutAttempt();
  assert.deepEqual([playerOf(state, 'a', 1).freeThrowsAttempted, playerOf(state, 'a', 1).freeThrowsMade], [0, 0]);
  assert.deepEqual([totalOf(state, 'b').freeThrowsAttempted, totalOf(state, 'a').freeThrowsMade], [0, 0]);
});
