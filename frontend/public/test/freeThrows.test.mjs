import test from 'node:test';
import assert from 'node:assert/strict';
import { isFreeThrowVisible, formatFreeThrowPct } from '../src/utils/freeThrows.js';

test('Freiwurf-Serie: offen sichtbar, fertig 10 s lang', () => {
  const done = { team: 'a', startedAt: 't1', status: { done: true } };
  assert.equal(isFreeThrowVisible({ ...done, status: { done: false } }, null, 99999), true);
  assert.equal(isFreeThrowVisible(done, 0, 9999), true);
  assert.equal(isFreeThrowVisible(done, 0, 10000), false);
});

test('Freiwurfquote: Strich ohne Versuche, sonst gerundete Prozent', () => {
  assert.equal(formatFreeThrowPct(null), '—');
  assert.equal(formatFreeThrowPct(undefined), '—');
  assert.equal(formatFreeThrowPct(2 / 3), '67 %');
  assert.equal(formatFreeThrowPct(0), '0 %');
});
