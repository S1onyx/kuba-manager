import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizationGain } from '../src/utils/loudnessGain.js';

const toDb = (gain) => 20 * Math.log10(gain);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.01, `${actual} statt ${expected}`);

test('Leise Datei wird auf -14 LUFS angehoben, laute abgesenkt', () => {
  near(toDb(normalizationGain(-20)), 6);
  near(toDb(normalizationGain(-4.4)), -9.6);
  near(toDb(normalizationGain(-14)), 0);
});

test('Anhebung ist auf +12 dB begrenzt', () => {
  near(toDb(normalizationGain(-40)), 12);
  near(toDb(normalizationGain(-70)), 12);
});

test('Ohne Messwert bleibt die Lautstärke unverändert', () => {
  assert.equal(normalizationGain(null), 1);
  assert.equal(normalizationGain(undefined), 1);
  assert.equal(normalizationGain(Number.NaN), 1);
});
