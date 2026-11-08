import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateShootout } from '../src/scoreboard/shootoutRules.js';

const shots = (sequence, firstTeam = 'a') => ({
  firstTeam,
  attempts: sequence.split(' ').filter(Boolean).map((token) => ({ team: token[0], hit: token[1] === '+' }))
});

test('Start: A wirft zuerst, noch nichts entschieden', () => {
  const result = evaluateShootout(shots(''));
  assert.deepEqual([result.hits.a, result.hits.b, result.decided, result.nextTeam, result.suddenDeath], [0, 0, false, 'a', false]);
});

test('Abwechselnd werfen, nächster Werfer stimmt', () => {
  assert.equal(evaluateShootout(shots('a+')).nextTeam, 'b');
  assert.equal(evaluateShootout(shots('a+ b-')).nextTeam, 'a');
  assert.equal(evaluateShootout(shots('', 'b')).nextTeam, 'b');
});

test('Vorzeitig entschieden: 3:0 nach je 3 Würfen', () => {
  const result = evaluateShootout(shots('a+ b- a+ b- a+ b-'));
  assert.deepEqual([result.decided, result.winner, result.nextTeam], [true, 'a', null]);
});

test('Nicht vorzeitig entschieden, solange aufholbar', () => {
  const result = evaluateShootout(shots('a+ b- a+ b- a+'));
  assert.equal(result.decided, false);
});

test('Nach je 5 Würfen gleich → Sudden Death, entschieden nach gleich vielen Würfen mit Unterschied', () => {
  const five = 'a+ b+ a- b- a+ b+ a- b- a+ b+';
  assert.deepEqual([evaluateShootout(shots(five)).decided, evaluateShootout(shots(five)).suddenDeath], [false, true]);
  assert.equal(evaluateShootout(shots(`${five} a+`)).decided, false);
  assert.equal(evaluateShootout(shots(`${five} a+ b+`)).decided, false);
  const final = evaluateShootout(shots(`${five} a+ b+ a- b+`));
  assert.deepEqual([final.decided, final.winner, final.hits.a, final.hits.b], [true, 'b', 4, 5]);
});

test('Nach 5:4 regulär entschieden', () => {
  const result = evaluateShootout(shots('a+ b+ a+ b+ a+ b+ a+ b+ a+ b-'));
  assert.deepEqual([result.decided, result.winner, result.suddenDeath], [true, 'a', false]);
});

test('Zusammenfassung aus gespeichertem Spiel: regulärer Stand + Stechen-Treffer', async () => {
  const { shootoutSummary } = await import('../src/services/shared/shootout.js');
  assert.equal(shootoutSummary({}), null);
  assert.equal(shootoutSummary({ shootout: { attempts: [] } }), null);
  assert.deepEqual(
    shootoutSummary({ shootout: { regularScoreA: 6, regularScoreB: 6, firstTeam: 'a', attempts: [{ team: 'a', hit: true }, { team: 'b', hit: false }] } }),
    { regularScoreA: 6, regularScoreB: 6, hitsA: 1, hitsB: 0 }
  );
});
