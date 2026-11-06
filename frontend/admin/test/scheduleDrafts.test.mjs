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

test('Gruppenspiele abwechselnd auf dieselben Zeiten verteilen', async () => {
  const { interleaveGroupSlots } = await import('../src/utils/scheduleDrafts.js');
  const games = [
    { id: 'a1', group: 'A', value: '13:00' }, { id: 'a2', group: 'A', value: '13:12' }, { id: 'a3', group: 'A', value: '13:24' },
    { id: 'b1', group: 'B', value: '13:36' }, { id: 'b2', group: 'B', value: '13:48' }
  ];
  assert.deepEqual(interleaveGroupSlots(games), { a1: '13:00', b1: '13:12', a2: '13:24', b2: '13:36', a3: '13:48' });
});

test('Abwechselnd behält Reihenfolge innerhalb der Gruppe und nutzt nur vorhandene Zeiten', async () => {
  const { interleaveGroupSlots } = await import('../src/utils/scheduleDrafts.js');
  const games = [
    { id: 'b1', group: 'B', value: '10:00' }, { id: 'a1', group: 'A', value: '10:10' }, { id: 'b2', group: 'B', value: '10:20' }
  ];
  const result = interleaveGroupSlots(games);
  assert.deepEqual(Object.values(result).sort(), ['10:00', '10:10', '10:20']);
  assert.equal(result.a1, '10:00');
  assert.ok(result.b1 < result.b2);
});
