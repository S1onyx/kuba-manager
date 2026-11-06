import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGroupFixtures,
  normalizeTournamentPayload,
  distributeSlotsAcrossGroups,
  createGroupLabels
} from '../src/services/tournaments/helpers.js';

function gamesPerSlot(fixtures) {
  const counts = new Map();
  const pairs = new Set();
  fixtures.flat().forEach(({ home, away }) => {
    counts.set(home, (counts.get(home) ?? 0) + 1);
    counts.set(away, (counts.get(away) ?? 0) + 1);
    pairs.add([home, away].sort((a, b) => a - b).join('-'));
  });
  return { counts, pairs, total: fixtures.flat().length };
}

test('6er-Gruppe mit 4 Spielen pro Team: jedes Team genau 4 Spiele, keine Doppelpaarung', () => {
  const { counts, pairs, total } = gamesPerSlot(generateGroupFixtures([1, 2, 3, 4, 5, 6], 4));
  assert.equal(total, 12);
  assert.equal(pairs.size, 12);
  [1, 2, 3, 4, 5, 6].forEach((slot) => assert.equal(counts.get(slot), 4));
});

test('5er-Gruppe mit 4 Spielen pro Team = jeder gegen jeden', () => {
  const { counts, total } = gamesPerSlot(generateGroupFixtures([7, 8, 9, 10, 11], 4));
  assert.equal(total, 10);
  [7, 8, 9, 10, 11].forEach((slot) => assert.equal(counts.get(slot), 4));
});

test('ohne Limit bleibt jeder gegen jeden', () => {
  assert.equal(gamesPerSlot(generateGroupFixtures([1, 2, 3, 4, 5, 6], null)).total, 15);
  assert.equal(gamesPerSlot(generateGroupFixtures([1, 2, 3, 4, 5, 6], 0)).total, 15);
});

test('ungerade Gruppe mit zu kleinem Limit wird abgelehnt', () => {
  assert.throws(() => generateGroupFixtures([1, 2, 3, 4, 5], 2), /nicht möglich/);
});

test('Payload-Validierung: 11 Teams, 2 Gruppen, 4 Spiele, 3 KO-Runden ist gültig', () => {
  const normalized = normalizeTournamentPayload({
    name: 'KUBA 2026',
    status: 'active',
    team_count: 11,
    group_count: 2,
    knockout_rounds: 3,
    group_games_per_team: 4
  });
  assert.equal(normalized.groupGamesPerTeam, 4);
  const sizes = [...distributeSlotsAcrossGroups(11, createGroupLabels(2)).values()].map((s) => s.length);
  assert.deepEqual(sizes, [6, 5]);
});

test('Payload-Validierung: 3 Spiele bei 5er-Gruppe wird abgelehnt', () => {
  assert.throws(
    () =>
      normalizeTournamentPayload({ name: 'X', status: 'active', team_count: 11, group_count: 2, group_games_per_team: 3 }),
    /nicht möglich/
  );
});

test('Payload ohne Feld übernimmt bestehenden Wert, leerer Wert entfernt Limit', () => {
  const defaults = { name: 'X', status: 'active', team_count: 11, group_count: 2, group_games_per_team: 4 };
  assert.equal(normalizeTournamentPayload({}, defaults).groupGamesPerTeam, 4);
  assert.equal(normalizeTournamentPayload({ group_games_per_team: '' }, defaults).groupGamesPerTeam, null);
});
