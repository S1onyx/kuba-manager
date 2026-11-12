import test from 'node:test';
import assert from 'node:assert/strict';
import { standingsSignature } from '../src/utils/standingsSignature.js';

const base = { tournamentId: 1, stageType: 'group', stageLabel: 'A', teamAName: 'Adler', teamBName: 'Biber', scoreA: 2, scoreB: 1, remainingSeconds: 300, durationSeconds: 600, penalties: { a: [], b: [] }, lastUpdated: 't1' };

test('Uhr-Tick ändert die Signatur nicht', () => {
  assert.equal(standingsSignature(base), standingsSignature({ ...base, remainingSeconds: 299, lastUpdated: 't2' }));
});

test('Korb, Strafe, Spielstart, Speichern und Spielplan-Änderung ändern die Signatur', () => {
  const sig = standingsSignature(base);
  assert.notEqual(sig, standingsSignature({ ...base, scoreB: 2 }));
  assert.notEqual(sig, standingsSignature({ ...base, penalties: { a: [{}], b: [] } }));
  assert.notEqual(sig, standingsSignature({ ...base, savedGameId: 9 }));
  assert.notEqual(sig, standingsSignature({ ...base, scheduleVersion: 3 }));
  const fresh = { ...base, scoreA: 0, scoreB: 0, remainingSeconds: 600 };
  assert.notEqual(standingsSignature(fresh), standingsSignature({ ...fresh, remainingSeconds: 599 }));
  assert.equal(standingsSignature(null), null);
});
