import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Eigene Wegwerf-DB statt backend/data.
process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-test-'));

const { getConnection } = await import('../src/db/connection.js');
const { default: initializeSchema } = await import('../src/db/schema.js');

const setting = (db, key) => db.exec('SELECT value FROM app_settings WHERE key = ?', [key])[0]?.values?.[0]?.[0] ?? null;

test('Auto-Start nach Halbzeitpause ist standardmäßig an', async () => {
  const { db } = await getConnection();
  assert.equal(setting(db, 'halftime_auto_start'), '1');
});

test('Bestehende Installation mit altem Standard "aus" wird einmalig auf "an" gestellt, danach bleibt eine bewusste Wahl erhalten', async () => {
  const { db } = await getConnection();
  db.run("UPDATE app_settings SET value = '0' WHERE key = 'halftime_auto_start'");
  db.run("DELETE FROM app_settings WHERE key = 'halftime_auto_start_default_on'");
  initializeSchema(db);
  assert.equal(setting(db, 'halftime_auto_start'), '1');
  db.run("UPDATE app_settings SET value = '0' WHERE key = 'halftime_auto_start'");
  initializeSchema(db);
  assert.equal(setting(db, 'halftime_auto_start'), '0');
});
