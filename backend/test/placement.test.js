import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateClassificationStages,
  generateKnockoutStages,
  createGroupPositionSource,
  resolveParticipantDetails
} from '../src/services/tournaments/helpers.js';

const loser = (code) => ({ type: 'previousMatch', code, result: 'loser' });

test('Platzierungsrunde 5-8: Verlierer VF1 vs VF4, VF2 vs VF3, danach Platz 7 vor Platz 5', () => {
  const stages = generateClassificationStages([loser('Q1'), loser('Q2'), loser('Q3'), loser('Q4')], 5, 'PL-8');
  assert.deepEqual(
    stages.map((stage) => stage.label),
    ['Platzierungsrunde 5-8', 'Spiel um Platz 7 / 8', 'Spiel um Platz 5 / 6']
  );
  assert.deepEqual(
    stages[0].matches.map((match) => [match.home_source.code, match.away_source.code]),
    [['Q1', 'Q4'], ['Q2', 'Q3']]
  );
});

test('KO mit 8 Teams im Modus alle: VF-Verlierer direkt um Platz 7 und 5, kein Zwischenspiel', () => {
  const initialParticipants = Array.from({ length: 8 }, (_, i) => ({ source: createGroupPositionSource('A', i + 1) }));
  const { mainStages, placementStages } = generateKnockoutStages({ initialParticipants, knockoutRounds: 3, classificationMode: 'all' });
  assert.deepEqual(mainStages.map((stage) => stage.label), ['Viertelfinale', 'Halbfinale', 'Finale']);
  assert.deepEqual(
    placementStages.map((stage) => [stage.label, stage.afterRound]),
    [
      ['Spiel um Platz 7 / 8', 0],
      ['Spiel um Platz 5 / 6', 0],
      ['Spiel um Platz 3 / 4', 1]
    ]
  );
  const ranks = (stage) => [stage.matches[0].home_source.rank, stage.matches[0].away_source.rank];
  assert.deepEqual(ranks(placementStages[0]), [3, 4]);
  assert.deepEqual(ranks(placementStages[1]), [1, 2]);
  assert.deepEqual(placementStages[1].matches[0].home_source.codes, ['KO_R1_M1', 'KO_R1_M2', 'KO_R1_M3', 'KO_R1_M4']);
});

test('Rangfolge der VF-Verlierer: Gruppenplatz, dann Punkte, Korbdifferenz, Körbe', () => {
  const codes = ['Q1', 'Q2', 'Q3', 'Q4'];
  const result = (a, b, scoreA, scoreB) => ({ id: 1, team_a: a, team_b: b, score_a: scoreA, score_b: scoreB });
  const resultsByCode = new Map([
    ['Q1', result('A1', 'B4', 10, 2)],
    ['Q2', result('A2', 'B3', 3, 9)],
    ['Q3', result('A3', 'B2', 1, 8)],
    ['Q4', result('A4', 'B1', 7, 6)]
  ]);
  const entry = (team, points, goalDiff, goalsFor) => ({ team, points, goalDiff, goalsFor });
  const groupStandingsMap = new Map([
    ['A', { isComplete: true, standings: [entry('A1', 12, 20, 40), entry('A2', 9, 8, 30), entry('A3', 6, 2, 25), entry('A4', 3, -5, 20)] }],
    ['B', { isComplete: true, standings: [entry('B1', 12, 18, 38), entry('B2', 9, 6, 28), entry('B3', 4, 0, 22), entry('B4', 4, 1, 21)] }]
  ]);
  const resolve = (rank, results = resultsByCode) =>
    resolveParticipantDetails({
      source: { type: 'rankedLoser', codes, rank },
      teamsByName: new Map(),
      matchLabelLookup: new Map(codes.map((code) => [code, { stage_label: 'Viertelfinale' }])),
      resultsByCode: results,
      groupStandingsMap
    }).label;
  assert.deepEqual([1, 2, 3, 4].map((rank) => resolve(rank)), ['B1', 'A2', 'A3', 'B4']);
  const incomplete = new Map(resultsByCode);
  incomplete.delete('Q4');
  assert.equal(resolve(1, incomplete), '1. bester Verlierer Viertelfinale');
});

test('Gruppenplatz wird erst bei abgeschlossener Gruppe mit Teamnamen gefüllt', () => {
  const source = createGroupPositionSource('A', 1);
  const standings = [{ team: 'Alpha' }, { team: 'Beta' }];
  const resolve = (isComplete) =>
    resolveParticipantDetails({
      source,
      teamsByName: new Map(),
      matchLabelLookup: new Map(),
      groupStandingsMap: new Map([['A', { standings, isComplete }]])
    });
  assert.equal(resolve(false).label, 'Platz 1 Gruppe A');
  assert.equal(resolve(false).teamName, null);
  assert.equal(resolve(true).label, 'Alpha');
});
