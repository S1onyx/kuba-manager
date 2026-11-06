import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeScheduleDrafts, countUnsavedDrafts } from '../src/utils/scheduleDrafts.js';

const server = (entries) => Object.fromEntries(entries.map((entry) => [String(entry.id), entry.value]));

test('Neuladen nach Einzel-Speichern behält ungespeicherte Auto-Plan-Zeiten', () => {
  const before = [{ id: 1, value: '' }, { id: 2, value: '' }, { id: 3, value: '' }];
  const drafts = { 1: '2026-11-14T13:00', 2: '2026-11-14T13:12', 3: '2026-11-14T13:30' };
  const after = [{ id: 1, value: '' }, { id: 2, value: '' }, { id: 3, value: '2026-11-14T13:30' }];
  assert.deepEqual(mergeScheduleDrafts(drafts, server(before), server(after)), drafts);
});

test('Ohne lokale Änderung übernimmt Neuladen den Serverstand', () => {
  const drafts = { 1: '2026-11-14T13:00' };
  assert.deepEqual(
    mergeScheduleDrafts(drafts, { 1: '2026-11-14T13:00' }, { 1: '2026-11-14T14:00' }),
    { 1: '2026-11-14T14:00' }
  );
});

test('Spiele, die es nicht mehr gibt, fallen weg; neue kommen mit Serverwert dazu', () => {
  assert.deepEqual(mergeScheduleDrafts({ 1: 'x', 9: 'y' }, { 1: '', 9: '' }, { 1: '', 2: 'z' }), { 1: 'x', 2: 'z' });
});

test('Zählt ungespeicherte Änderungen', () => {
  assert.equal(countUnsavedDrafts({ 1: 'a', 2: '', 3: 'c' }, { 1: 'a', 2: 'b', 3: '' }), 2);
});
