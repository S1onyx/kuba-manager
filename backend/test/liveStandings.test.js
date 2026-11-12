import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Eigene Wegwerf-DB statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

const { saveGame } = await import('../src/services/gamesService.js');
const { computeGroupStandings } = await import('../src/services/tournaments/standings.js');

const TOURNAMENT_ID = 4711;
const game = (teamA, teamB, scoreA, scoreB, extra = {}) => ({
  teamAName: teamA,
  teamBName: teamB,
  scoreA,
  scoreB,
  durationSeconds: 600,
  remainingSeconds: 0,
  halftimeSeconds: 300,
  halftimePauseSeconds: 60,
  extraSeconds: 0,
  extraElapsedSeconds: 0,
  isExtraTime: false,
  penalties: { a: [], b: [] },
  tournamentId: TOURNAMENT_ID,
  tournamentName: 'Test-Cup',
  stageType: 'group',
  stageLabel: 'A',
  ...extra
});
const row = (standings, team) => standings.find((entry) => entry.team === team);

test('Laufendes Spiel zählt live in der Tabelle', async () => {
  await saveGame(game('Adler', 'Biber', 3, 1));
  const live = game('Adler', 'Chamäleon', 2, 0, { remainingSeconds: 400 });
  const { standings } = await computeGroupStandings(TOURNAMENT_ID, 'A', { currentSnapshot: live });
  assert.deepEqual([row(standings, 'Adler').played, row(standings, 'Adler').points, row(standings, 'Chamäleon').played], [2, 6, 1]);
});

test('Bereits gespeichertes Live-Spiel zählt nur einmal, mit aktuellem Stand', async () => {
  const saved = await saveGame(game('Biber', 'Chamäleon', 1, 1));
  const liveAfterSave = game('Biber', 'Chamäleon', 2, 1, { savedGameId: saved.id });
  const { standings } = await computeGroupStandings(TOURNAMENT_ID, 'A', { currentSnapshot: liveAfterSave });
  assert.deepEqual([row(standings, 'Biber').played, row(standings, 'Biber').goalsFor, row(standings, 'Chamäleon').played], [2, 3, 1]);
});
