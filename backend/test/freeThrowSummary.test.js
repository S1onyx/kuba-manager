import test from 'node:test';
import assert from 'node:assert/strict';
import { freeThrowPct, rankFreeThrowShooters, collectTeamFreeThrows } from '../src/services/tournaments/freeThrowStats.js';

test('Quote: null ohne Versuche, sonst Anteil', () => {
  assert.equal(freeThrowPct(0, 0), null);
  assert.equal(freeThrowPct(undefined, undefined), null);
  assert.equal(freeThrowPct(3, 4), 0.75);
});

test('Bestenliste: ab 2 Versuchen, Quote vor Treffern vor Name', () => {
  const players = [
    { name: 'Cleo', freeThrowsMade: 1, freeThrowsAttempted: 1 },
    { name: 'Bert', freeThrowsMade: 2, freeThrowsAttempted: 4 },
    { name: 'Anna', freeThrowsMade: 3, freeThrowsAttempted: 4 },
    { name: 'Dora', freeThrowsMade: 6, freeThrowsAttempted: 8 },
    { name: 'Emil', freeThrowsMade: 0, freeThrowsAttempted: 0 }
  ];
  assert.deepEqual(rankFreeThrowShooters(players).map((entry) => entry.name), ['Dora', 'Anna', 'Bert']);
});

test('Team-Freiwürfe aus Snapshot-Teamsummen, alte Snapshots ohne Felder zählen 0', () => {
  const games = [
    {
      team_a: 'Adler',
      team_b: 'Biber',
      snapshot: {
        playerStats: {
          a: [{ isTeamTotal: true, freeThrowsAttempted: 2, freeThrowsMade: 1 }, { playerId: 1, freeThrowsAttempted: 2, freeThrowsMade: 1 }],
          b: [{ isTeamTotal: true, freeThrowsAttempted: 1, freeThrowsMade: 1 }]
        }
      }
    },
    { team_a: 'Adler', team_b: 'Biber', snapshot: { playerStats: { a: [{ isTeamTotal: true, points: 4 }], b: [] } } },
    { team_a: 'Adler', team_b: 'Chamäleon', snapshot: {} }
  ];
  const totals = collectTeamFreeThrows(games);
  assert.deepEqual(totals.get('Adler'), { freeThrowsAttempted: 2, freeThrowsMade: 1 });
  assert.deepEqual(totals.get('Biber'), { freeThrowsAttempted: 1, freeThrowsMade: 1 });
  assert.deepEqual(totals.get('Chamäleon'), { freeThrowsAttempted: 0, freeThrowsMade: 0 });
});
