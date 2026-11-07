import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKnockoutStages, createGroupPositionSource } from '../src/services/tournaments/helpers.js';

const winnerCodes = (match) => [match.home_source.code, match.away_source.code].sort();

test('2 Gruppen, VF über Kreuz: Gruppensieger treffen frühestens im Finale', () => {
  const initialParticipants = ['A', 'B'].flatMap((group) =>
    [1, 2, 3, 4].map((position) => ({ source: createGroupPositionSource(group, position) }))
  );
  const { mainStages } = generateKnockoutStages({ initialParticipants, knockoutRounds: 3, classificationMode: 'all' });
  const [quarterfinal, semifinal] = mainStages;
  const qf = (code) => quarterfinal.matches.find((match) => match.code === code);
  assert.deepEqual([qf('KO_R1_M1').home_source.position, qf('KO_R1_M1').home_source.group], [1, 'A']);
  assert.deepEqual([qf('KO_R1_M4').away_source.position, qf('KO_R1_M4').away_source.group], [1, 'B']);
  assert.deepEqual(
    semifinal.matches.map(winnerCodes).sort(),
    [['KO_R1_M1', 'KO_R1_M3'], ['KO_R1_M2', 'KO_R1_M4']]
  );
});

test('Ohne Gruppen bleibt klassische Setzliste (1-8 und 4-5 im selben Halbfinale)', () => {
  const initialParticipants = Array.from({ length: 8 }, (_, i) => ({ source: createGroupPositionSource('A', i + 1) }));
  const { mainStages } = generateKnockoutStages({ initialParticipants, knockoutRounds: 3, classificationMode: 'top4' });
  assert.deepEqual(
    mainStages[1].matches.map(winnerCodes).sort(),
    [['KO_R1_M1', 'KO_R1_M4'], ['KO_R1_M2', 'KO_R1_M3']]
  );
});
