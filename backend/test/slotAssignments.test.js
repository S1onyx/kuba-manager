import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateSlotTeam } from '../src/services/tournaments/helpers.js';

const current = [
  { slot_number: 1, team_id: 10 },
  { slot_number: 2, team_id: 20 },
  { slot_number: 3, team_id: null }
];

test('Tausch zweier Teams ist gültig', () => {
  const assignments = [
    { slotNumber: 1, teamId: 20 },
    { slotNumber: 2, teamId: 10 }
  ];
  assert.equal(findDuplicateSlotTeam(current, assignments), null);
});

test('Team in zweitem Slot, ohne den ersten zu ändern, wird erkannt', () => {
  assert.deepEqual(findDuplicateSlotTeam(current, [{ slotNumber: 3, teamId: 10 }]), { teamId: 10, slots: [1, 3] });
});

test('Slots ohne festes Team zählen nicht als doppelt', () => {
  assert.equal(findDuplicateSlotTeam(current, [{ slotNumber: 1, teamId: null }]), null);
});
