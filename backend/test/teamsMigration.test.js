import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { migrateTeamsToTournaments } from '../src/db/migrations/tournamentTeams.js';

const require = createRequire(import.meta.url);
const initSqlJs = require('sql.js');
const wasmDir = path.dirname(require.resolve('sql.js/dist/sql-wasm.wasm'));

async function createLegacyDb() {
  const SQL = await initSqlJs({ locateFile: (file) => path.join(wasmDir, file) });
  const db = new SQL.Database();
  db.exec(`
    CREATE TABLE tournaments (id INTEGER PRIMARY KEY, name TEXT);
    CREATE TABLE teams (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE team_players (id INTEGER PRIMARY KEY AUTOINCREMENT, team_id INTEGER NOT NULL, name TEXT NOT NULL, jersey_number INTEGER, position TEXT, created_at TEXT, updated_at TEXT);
    CREATE TABLE tournament_teams (id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id INTEGER, slot_number INTEGER, team_id INTEGER, placeholder TEXT);
    CREATE TABLE tournament_registrations (id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id INTEGER, team_name TEXT, team_id INTEGER);
    CREATE TABLE games (id INTEGER PRIMARY KEY AUTOINCREMENT, tournament_id INTEGER, team_a TEXT, team_b TEXT, team_a_id INTEGER, team_b_id INTEGER, snapshot_json TEXT);
    CREATE TABLE audio_triggers (key TEXT PRIMARY KEY, label TEXT, tournament_id INTEGER, audio_file_id INTEGER);

    INSERT INTO tournaments VALUES (19, 'KUBA2024'), (21, 'KUBA2025'), (28, 'Kuba2026');
    INSERT INTO teams (id, name) VALUES (4, 'Gäu Baller'), (7, 'Namensfindung'), (18, 'Testteam'), (30, 'Korbflitzer');
    INSERT INTO team_players (id, team_id, name, jersey_number) VALUES (100, 4, 'Neu 2026', 9), (101, 7, 'Linus', 3), (102, 30, 'Flitzer', 1);
    INSERT INTO tournament_teams (tournament_id, slot_number, team_id, placeholder) VALUES
      (19, 1, 4, 'Gäu Baller'), (21, 1, 4, 'Gäu Baller'), (21, 2, 7, 'Namensfindung'), (28, 1, 4, 'Gäu Baller'), (28, 2, 30, 'Korbflitzer');
    INSERT INTO tournament_registrations (tournament_id, team_name, team_id) VALUES (28, 'Gäu Baller', 4), (27, 'Testteam', 18);
    INSERT INTO audio_triggers VALUES ('score_team_4', 'Korb Gäu Baller', 28, 27), ('score_team_7', 'Korb Namensfindung', 21, 40);
  `);
  const snapshot = (a, b) => JSON.stringify({ players: { a, b } });
  db.run('INSERT INTO games (tournament_id, team_a, team_b, team_a_id, team_b_id, snapshot_json) VALUES (?, ?, ?, ?, ?, ?)', [
    21, 'Gäu Baller', 'Namensfindung', 4, 7,
    snapshot([{ playerId: 28, name: 'Simeon Hufen', jerseyNumber: 2 }, { playerId: 29, name: 'Simon Köcher', jerseyNumber: 7 }], [{ playerId: 101, name: 'Linus', jerseyNumber: 3 }])
  ]);
  db.run('INSERT INTO games (tournament_id, team_a, team_b, team_a_id, team_b_id, snapshot_json) VALUES (?, ?, ?, ?, ?, ?)', [
    19, 'Gäu Baller', 'Kings', null, null, snapshot([{ playerId: 28, name: 'Simeon Hufen', jerseyNumber: 2 }], [])
  ]);
  return db;
}

const rows = (db, sql, params = []) => {
  const result = db.exec(sql, params)[0];
  return result ? result.values.map((values) => Object.fromEntries(result.columns.map((c, i) => [c, values[i]]))) : [];
};

test('Teams werden pro Turnier aufgeteilt, neuestes Turnier behält die ID', async () => {
  const db = await createLegacyDb();
  assert.equal(migrateTeamsToTournaments(db), true);
  const teams = rows(db, 'SELECT id, tournament_id, name FROM teams ORDER BY tournament_id, name');
  assert.deepEqual(
    teams.filter((team) => team.name === 'Gäu Baller').map((team) => [team.tournament_id, team.id === 4]),
    [[19, false], [21, false], [28, true]]
  );
  assert.equal(teams.find((team) => team.name === 'Namensfindung').tournament_id, 21);
  assert.equal(teams.find((team) => team.name === 'Testteam').tournament_id, null);
});

test('Slots, Anmeldungen, Spiele und Korbhymnen zeigen auf das Team des eigenen Turniers', async () => {
  const db = await createLegacyDb();
  migrateTeamsToTournaments(db);
  const teamOf = (tournamentId) => rows(db, "SELECT id FROM teams WHERE name = 'Gäu Baller' AND tournament_id = ?", [tournamentId])[0].id;
  const slots = rows(db, 'SELECT tournament_id, team_id FROM tournament_teams WHERE slot_number = 1 ORDER BY tournament_id');
  assert.deepEqual(slots.map((slot) => slot.team_id), [teamOf(19), teamOf(21), 4]);
  assert.equal(rows(db, 'SELECT team_a_id FROM games WHERE tournament_id = 21')[0].team_a_id, teamOf(21));
  assert.equal(rows(db, 'SELECT team_a_id FROM games WHERE tournament_id = 19')[0].team_a_id, null);
  assert.equal(rows(db, 'SELECT team_id FROM tournament_registrations WHERE tournament_id = 28')[0].team_id, 4);
  assert.deepEqual(rows(db, "SELECT key, tournament_id FROM audio_triggers WHERE key = 'score_team_4'"), [{ key: 'score_team_4', tournament_id: 28 }]);
});

test('Kader alter Turniere wird aus den Spielen mit Original-Spieler-IDs wiederhergestellt', async () => {
  const db = await createLegacyDb();
  migrateTeamsToTournaments(db);
  const roster = (tournamentId) =>
    rows(db, "SELECT p.id, p.name, p.jersey_number FROM team_players p JOIN teams t ON t.id = p.team_id WHERE t.name = 'Gäu Baller' AND t.tournament_id = ? ORDER BY p.id", [tournamentId]);
  assert.deepEqual(roster(28), [{ id: 100, name: 'Neu 2026', jersey_number: 9 }]);
  assert.deepEqual(roster(21), [{ id: 28, name: 'Simeon Hufen', jersey_number: 2 }, { id: 29, name: 'Simon Köcher', jersey_number: 7 }]);
  assert.deepEqual(roster(19), []);
  assert.deepEqual(
    rows(db, "SELECT p.id FROM team_players p JOIN teams t ON t.id = p.team_id WHERE t.name = 'Namensfindung'").map((p) => p.id),
    [101]
  );
});

test('Zweiter Lauf ändert nichts', async () => {
  const db = await createLegacyDb();
  migrateTeamsToTournaments(db);
  const before = JSON.stringify(rows(db, 'SELECT * FROM teams ORDER BY id'));
  assert.equal(migrateTeamsToTournaments(db), false);
  assert.equal(JSON.stringify(rows(db, 'SELECT * FROM teams ORDER BY id')), before);
});

test('Teamname ist pro Turnier eindeutig, in verschiedenen Turnieren erlaubt', async () => {
  const db = await createLegacyDb();
  migrateTeamsToTournaments(db);
  assert.throws(() => db.run("INSERT INTO teams (tournament_id, name) VALUES (28, 'Gäu Baller')"), /UNIQUE/);
  db.run("INSERT INTO teams (tournament_id, name) VALUES (28, 'Namensfindung')");
});
