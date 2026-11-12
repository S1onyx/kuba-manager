import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Eigene Wegwerf-DB und Audio-Ablage statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

const audio = await import('../src/services/audio/index.js');

const upload = () =>
  audio.storeLibraryUpload({ buffer: Buffer.from('FAKE-MP3-FOR-TESTING'), originalName: 'test.mp3', mimeType: 'audio/mpeg', label: 'Test' });

test('Neue Datei hat noch keinen Lautheitswert', async () => {
  const file = await upload();
  assert.deepEqual([file.loudness_lufs, file.peak_db], [null, null]);
});

test('Lautheit speichern und in Bibliothek und Trigger-Payload ausliefern', async () => {
  const file = await upload();
  const saved = await audio.setAudioFileLoudness(file.id, { lufs: -18.25, peakDb: -1.5 });
  assert.deepEqual([saved.loudness_lufs, saved.peak_db], [-18.25, -1.5]);
  const listed = (await audio.listAudioFiles()).find((entry) => entry.id === file.id);
  assert.equal(listed.loudness_lufs, -18.25);
  await audio.assignFileToTrigger('free_throw_miss', file.id);
  const trigger = await audio.getActiveTriggerWithFile('free_throw_miss');
  assert.deepEqual([trigger.file.loudness_lufs, trigger.file.peak_db], [-18.25, -1.5]);
});

test('Ungültige Werte werden abgelehnt, unbekannte Datei liefert null', async () => {
  const file = await upload();
  await assert.rejects(() => audio.setAudioFileLoudness(file.id, { lufs: 5, peakDb: 0 }), /LUFS/);
  await assert.rejects(() => audio.setAudioFileLoudness(file.id, { lufs: -20, peakDb: 'laut' }), /Spitzenpegel/);
  assert.equal(await audio.setAudioFileLoudness(999999, { lufs: -20, peakDb: -3 }), null);
});
