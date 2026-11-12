import test from 'node:test';
import assert from 'node:assert/strict';
import { isFreeThrowVisible, freeThrowSeriesKey } from '../src/utils/freeThrows.js';

const open = { team: 'a', startedAt: 't1', status: { done: false } };
const done = { ...open, status: { done: true } };

test('Freiwurf-Serie: offen immer sichtbar, fertig 10 s lang, ohne Serie nie', () => {
  assert.equal(isFreeThrowVisible(null, null, 0), false);
  assert.equal(isFreeThrowVisible(open, null, 99999), true);
  assert.equal(isFreeThrowVisible(done, 1000, 10999), true);
  assert.equal(isFreeThrowVisible(done, 1000, 11000), false);
  assert.equal(isFreeThrowVisible(done, null, 0), true);
});

test('Serien-Schlüssel unterscheidet neue Serien', () => {
  assert.notEqual(freeThrowSeriesKey(open), freeThrowSeriesKey({ ...open, startedAt: 't2' }));
  assert.equal(freeThrowSeriesKey(null), null);
});
