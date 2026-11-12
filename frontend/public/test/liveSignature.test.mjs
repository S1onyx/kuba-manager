import test from 'node:test';
import assert from 'node:assert/strict';
import { liveSignature } from '../src/utils/liveSignature.js';

const base = { tournamentId: 1, stageType: 'group', stageLabel: 'A', teamAName: 'Adler', teamBName: 'Biber', scoreA: 2, scoreB: 1, remainingSeconds: 300, durationSeconds: 600, penalties: { a: [], b: [] }, scoringLog: [{}, {}, {}], lastUpdated: 't1' };

test('Uhr-Tick löst kein Nachladen aus', () => {
  assert.equal(liveSignature(base), liveSignature({ ...base, remainingSeconds: 299, lastUpdated: 't2', isRunning: true }));
});

test('Korb, Strafe, Freiwurf, Spielende und Speichern lösen Nachladen aus', () => {
  const sig = liveSignature(base);
  assert.notEqual(sig, liveSignature({ ...base, scoreA: 3, scoringLog: [{}, {}, {}, {}] }));
  assert.notEqual(sig, liveSignature({ ...base, penalties: { a: [], b: [{}] } }));
  assert.notEqual(sig, liveSignature({ ...base, freeThrows: { attempts: [{ hit: false }] } }));
  assert.notEqual(sig, liveSignature({ ...base, isFinished: true }));
  assert.notEqual(sig, liveSignature({ ...base, savedGameId: 5 }));
});
