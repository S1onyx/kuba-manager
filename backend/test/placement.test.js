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

test('KO mit 8 Teams im Modus alle: Platzierungen hängen an der richtigen Runde', () => {
  const initialParticipants = Array.from({ length: 8 }, (_, i) => ({ source: createGroupPositionSource('A', i + 1) }));
  const { mainStages, placementStages } = generateKnockoutStages({ initialParticipants, knockoutRounds: 3, classificationMode: 'all' });
  assert.deepEqual(mainStages.map((stage) => stage.label), ['Viertelfinale', 'Halbfinale', 'Finale']);
  assert.deepEqual(
    placementStages.map((stage) => [stage.label, stage.afterRound]),
    [
      ['Platzierungsrunde 5-8', 0],
      ['Spiel um Platz 7 / 8', 0],
      ['Spiel um Platz 5 / 6', 0],
      ['Spiel um Platz 3 / 4', 1]
    ]
  );
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
