import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import initializeSchema from '../src/db/schema.js';
import { syncKnockoutSources } from '../src/db/migrations/knockoutSources.js';
import { expectedKnockoutSources } from '../src/services/tournaments/helpers.js';

const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js');
const wasmDir = path.dirname(require.resolve('sql.js/dist/sql-wasm.wasm'));
const tournament = { id: 28, name: 'Kuba2026', team_count: 11, group_count: 2, knockout_rounds: 3, group_games_per_team: 4, classification_mode: 'all' };
const winner = (code) => ({ type: 'previousMatch', code, result: 'winner' });

async function createDbWithOldSemifinals() {
  const SQL = await initSqlJs({ locateFile: (file) => path.join(wasmDir, file) });
  const db = new SQL.Database();
  initializeSchema(db);
  db.run(
    "INSERT INTO tournaments (id, name, team_count, group_count, knockout_rounds, group_games_per_team, classification_mode, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')",
    [tournament.id, tournament.name, tournament.team_count, tournament.group_count, tournament.knockout_rounds, tournament.group_games_per_team, tournament.classification_mode]
  );
  const old = new Map([
    ['KO_R2_M1', { home: winner('KO_R1_M1'), away: winner('KO_R1_M4') }],
    ['KO_R2_M2', { home: winner('KO_R1_M2'), away: winner('KO_R1_M3') }]
  ]);
  let minute = 0;
  expectedKnockoutSources(tournament).forEach((sources, code) => {
    const { home, away } = old.get(code) ?? sources;
    minute += 15;
    db.run(
      "INSERT INTO tournament_schedule (tournament_id, phase, stage_label, code, home_source, away_source, scheduled_at) VALUES (?, ?, 'x', ?, ?, ?, ?)",
      [tournament.id, code.startsWith('KO') ? 'knockout' : 'placement', code, JSON.stringify(home), JSON.stringify(away), `2026-11-14T16:${String(minute % 60).padStart(2, '0')}:00.000Z`]
    );
  });
  return db;
}

const sourcesOf = (db, code) => {
  const [home, away, scheduledAt] = db.exec('SELECT home_source, away_source, scheduled_at FROM tournament_schedule WHERE code = ?', [code])[0].values[0];
  return { home: JSON.parse(home).code, away: JSON.parse(away).code, scheduledAt };
};

test('Bestehendes Turnier: Halbfinale wird auf Kreuzpaarung korrigiert, Uhrzeiten bleiben', async () => {
  const db = await createDbWithOldSemifinals();
  const before = sourcesOf(db, 'KO_R2_M1').scheduledAt;
  assert.equal(syncKnockoutSources(db), 2);
  const semis = ['KO_R2_M1', 'KO_R2_M2'].map((code) => sourcesOf(db, code));
  assert.deepEqual(semis.map((s) => [s.home, s.away].sort()).sort(), [['KO_R1_M1', 'KO_R1_M3'], ['KO_R1_M2', 'KO_R1_M4']]);
  assert.equal(semis[0].scheduledAt, before);
  assert.equal(syncKnockoutSources(db), 0);
});

test('Sobald ein KO-Spiel gespielt ist, wird nichts mehr geändert', async () => {
  const db = await createDbWithOldSemifinals();
  db.run("INSERT INTO games (team_a, team_b, score_a, score_b, duration_seconds, halftime_seconds, halftime_pause_seconds, extra_seconds, extra_elapsed_seconds, is_extra_time, penalties_json, snapshot_json, tournament_id, schedule_code) VALUES ('A', 'B', 3, 1, 600, 300, 60, 0, 0, 0, '{}', '{}', ?, 'KO_R1_M1')", [tournament.id]);
  assert.equal(syncKnockoutSources(db), 0);
  assert.deepEqual([sourcesOf(db, 'KO_R2_M1').home, sourcesOf(db, 'KO_R2_M1').away], ['KO_R1_M1', 'KO_R1_M4']);
});
