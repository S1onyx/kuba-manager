import test from 'node:test';
import assert from 'node:assert/strict';
import { withLiveGame } from '../src/services/tournaments/liveGame.js';

const saved = [
  { id: 1, team_a: 'Adler', team_b: 'Biber', score_a: 3, score_b: 1 },
  { id: 2, team_a: 'Biber', team_b: 'Chamäleon', score_a: 1, score_b: 1 }
];
const live = (extra = {}) => ({
  tournamentId: 7,
  teamAName: 'Adler',
  teamBName: 'Chamäleon',
  scoreA: 2,
  scoreB: 0,
  remainingSeconds: 300,
  durationSeconds: 600,
  savedGameId: null,
  ...extra
});

test('Laufendes Spiel kommt zu den gespeicherten Spielen dazu', () => {
  const games = withLiveGame(saved, live(), 7);
  assert.deepEqual(games.map((game) => [game.team_a, game.score_a, Boolean(game.isLive)]), [['Adler', 3, false], ['Biber', 1, false], ['Adler', 2, true]]);
});

test('Gespeichertes Live-Spiel wird durch aktuellen Stand ersetzt, nicht doppelt gezählt', () => {
  const games = withLiveGame(saved, live({ teamAName: 'Biber', scoreA: 2, scoreB: 1, savedGameId: 2 }), 7);
  assert.deepEqual(games.map((game) => [game.id, game.score_a]), [[1, 3], [2, 2]]);
});

test('Nicht begonnenes Spiel oder anderes Turnier ändert nichts', () => {
  assert.equal(withLiveGame(saved, live({ scoreA: 0, remainingSeconds: 600 }), 7), saved);
  assert.equal(withLiveGame(saved, live(), 8), saved);
  assert.equal(withLiveGame(saved, null, 7), saved);
});
