import test from 'node:test';
import assert from 'node:assert/strict';
import { nextDisplaySlot, resolveDisplaySlot, viewForDisplay } from '../src/utils/displaySlot.js';

test('Display-Nummer: URL vor Speicher vor altem Spiegel-Modus', () => {
  assert.equal(resolveDisplaySlot({ search: '?display=3', stored: '2' }), '3');
  assert.equal(resolveDisplaySlot({ search: '?display=9', stored: '2' }), '2');
  assert.equal(resolveDisplaySlot({ legacyMirror: '1' }), '2');
  assert.equal(resolveDisplaySlot(), '1');
});

test('Display-Nummer wechselt reihum, Ansicht kommt aus dem Scoreboard-Zustand', () => {
  assert.deepEqual(['1', '2', '3'].map(nextDisplaySlot), ['2', '3', '1']);
  const scoreboard = { displays: { 1: 'scoreboard', 2: 'bracket', 3: 'callit' } };
  assert.deepEqual(['1', '2', '3'].map((slot) => viewForDisplay(scoreboard, slot)), ['scoreboard', 'bracket', 'callit']);
  assert.equal(viewForDisplay(null, '2'), 'scoreboard');
});
