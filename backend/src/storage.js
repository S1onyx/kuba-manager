import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'scoreboard.sqlite');

let sqlModulePromise;
let dbInstance;

async function ensureDatabase() {
  if (!sqlModulePromise) {
    sqlModulePromise = (async () => {
      const wasmUrl = await import.meta.resolve('sql.js/dist/sql-wasm.wasm');
      const wasmPath = fileURLToPath(wasmUrl);
      const wasmDir = path.dirname(wasmPath);

      const SQL = await initSqlJs({
        locateFile: (file) => path.join(wasmDir, file)
      });

      const fileExists = fs.existsSync(dbPath);
      const db = fileExists ? new SQL.Database(fs.readFileSync(dbPath)) : new SQL.Database();

      db.exec(`
        CREATE TABLE IF NOT EXISTS games (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT DEFAULT (datetime('now')),
          team_a TEXT NOT NULL,
          team_b TEXT NOT NULL,
          score_a INTEGER NOT NULL,
          score_b INTEGER NOT NULL,
          duration_seconds INTEGER NOT NULL,
          halftime_seconds INTEGER NOT NULL,
          halftime_pause_seconds INTEGER NOT NULL,
          extra_seconds INTEGER NOT NULL,
          extra_elapsed_seconds INTEGER NOT NULL,
          is_extra_time INTEGER NOT NULL,
          penalties_json TEXT NOT NULL,
          snapshot_json TEXT NOT NULL
        );
      `);

      return { SQL, db };
    })();
  }

  if (!dbInstance) {
    dbInstance = await sqlModulePromise;
  }

  return dbInstance;
}

function persist(db, SQL) {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function safeParse(value, fallback) {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapRow(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    team_a: row.team_a,
    team_b: row.team_b,
    score_a: row.score_a,
    score_b: row.score_b,
    duration_seconds: row.duration_seconds,
    halftime_seconds: row.halftime_seconds,
    halftime_pause_seconds: row.halftime_pause_seconds,
    extra_seconds: row.extra_seconds,
    extra_elapsed_seconds: row.extra_elapsed_seconds,
    is_extra_time: Boolean(row.is_extra_time),
    penalties: safeParse(row.penalties_json, { a: [], b: [] }),
    snapshot: safeParse(row.snapshot_json, null)
  };
}

async function fetchRowById(db, id) {
  const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
  stmt.bind([id]);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

export async function saveGame(snapshot) {
  const { SQL, db } = await ensureDatabase();

  const stmt = db.prepare(`
    INSERT INTO games (
      team_a,
      team_b,
      score_a,
      score_b,
      duration_seconds,
      halftime_seconds,
      halftime_pause_seconds,
      extra_seconds,
      extra_elapsed_seconds,
      is_extra_time,
      penalties_json,
      snapshot_json
    ) VALUES (
      :team_a,
      :team_b,
      :score_a,
      :score_b,
      :duration_seconds,
      :halftime_seconds,
      :halftime_pause_seconds,
      :extra_seconds,
      :extra_elapsed_seconds,
      :is_extra_time,
      :penalties_json,
      :snapshot_json
    )
  `);

  stmt.bind({
    ':team_a': snapshot.teamAName ?? 'Team A',
    ':team_b': snapshot.teamBName ?? 'Team B',
    ':score_a': snapshot.scoreA ?? 0,
    ':score_b': snapshot.scoreB ?? 0,
    ':duration_seconds': snapshot.durationSeconds ?? 0,
    ':halftime_seconds': snapshot.halftimeSeconds ?? 0,
    ':halftime_pause_seconds': snapshot.halftimePauseSeconds ?? 0,
    ':extra_seconds': snapshot.extraSeconds ?? 0,
    ':extra_elapsed_seconds': snapshot.extraElapsedSeconds ?? 0,
    ':is_extra_time': snapshot.isExtraTime ? 1 : 0,
    ':penalties_json': JSON.stringify(snapshot.penalties ?? { a: [], b: [] }),
    ':snapshot_json': JSON.stringify(snapshot)
  });

  stmt.step();
  stmt.free();

  const selectStmt = db.prepare('SELECT * FROM games ORDER BY created_at DESC, id DESC LIMIT 1');
  selectStmt.step();
  const row = selectStmt.getAsObject();
  selectStmt.free();

  persist(db, SQL);

  return mapRow(row);
}

export async function listGames() {
  const { db } = await ensureDatabase();
  const stmt = db.prepare('SELECT * FROM games ORDER BY datetime(created_at) DESC, id DESC');
  const rows = [];

  while (stmt.step()) {
    rows.push(mapRow(stmt.getAsObject()));
  }

  stmt.free();
  return rows;
}

export async function getGame(id) {
  const { db } = await ensureDatabase();
  const row = await fetchRowById(db, id);
  return row ? mapRow(row) : null;
}

export async function updateGame(id, patch = {}) {
  const { SQL, db } = await ensureDatabase();
  const row = await fetchRowById(db, id);
  if (!row) {
    return null;
  }

  const existing = mapRow(row);

  const updated = {
    team_a: patch.team_a?.trim?.() || patch.team_a || existing.team_a,
    team_b: patch.team_b?.trim?.() || patch.team_b || existing.team_b,
    score_a: Number.isFinite(Number(patch.score_a)) ? Math.max(0, Number(patch.score_a)) : existing.score_a,
    score_b: Number.isFinite(Number(patch.score_b)) ? Math.max(0, Number(patch.score_b)) : existing.score_b,
    duration_seconds: Number.isFinite(Number(patch.duration_seconds)) ? Math.max(0, Number(patch.duration_seconds)) : existing.duration_seconds,
    halftime_seconds: Number.isFinite(Number(patch.halftime_seconds)) ? Math.max(0, Number(patch.halftime_seconds)) : existing.halftime_seconds,
    halftime_pause_seconds: Number.isFinite(Number(patch.halftime_pause_seconds)) ? Math.max(0, Number(patch.halftime_pause_seconds)) : existing.halftime_pause_seconds,
    extra_seconds: Number.isFinite(Number(patch.extra_seconds)) ? Math.max(0, Number(patch.extra_seconds)) : existing.extra_seconds,
    extra_elapsed_seconds: Number.isFinite(Number(patch.extra_elapsed_seconds)) ? Math.max(0, Number(patch.extra_elapsed_seconds)) : existing.extra_elapsed_seconds,
    is_extra_time: typeof patch.is_extra_time === 'boolean' ? patch.is_extra_time : existing.is_extra_time,
    penalties: patch.penalties ? patch.penalties : existing.penalties ?? { a: [], b: [] }
  };

  const snapshot = existing.snapshot ? { ...existing.snapshot } : {};
  if (Object.keys(snapshot).length === 0) {
    snapshot.teamAName = updated.team_a;
    snapshot.teamBName = updated.team_b;
  } else {
    snapshot.teamAName = updated.team_a;
    snapshot.teamBName = updated.team_b;
  }
  snapshot.scoreA = updated.score_a;
  snapshot.scoreB = updated.score_b;
  snapshot.durationSeconds = updated.duration_seconds;
  snapshot.halftimeSeconds = updated.halftime_seconds;
  snapshot.halftimePauseSeconds = updated.halftime_pause_seconds;
  snapshot.extraSeconds = updated.extra_seconds;
  snapshot.extraElapsedSeconds = updated.extra_elapsed_seconds;
  snapshot.isExtraTime = updated.is_extra_time;
  snapshot.penalties = updated.penalties;

  db.run(
    `UPDATE games SET
      team_a = :team_a,
      team_b = :team_b,
      score_a = :score_a,
      score_b = :score_b,
      duration_seconds = :duration_seconds,
      halftime_seconds = :halftime_seconds,
      halftime_pause_seconds = :halftime_pause_seconds,
      extra_seconds = :extra_seconds,
      extra_elapsed_seconds = :extra_elapsed_seconds,
      is_extra_time = :is_extra_time,
      penalties_json = :penalties_json,
      snapshot_json = :snapshot_json
    WHERE id = :id`,
    {
      ':team_a': updated.team_a,
      ':team_b': updated.team_b,
      ':score_a': updated.score_a,
      ':score_b': updated.score_b,
      ':duration_seconds': updated.duration_seconds,
      ':halftime_seconds': updated.halftime_seconds,
      ':halftime_pause_seconds': updated.halftime_pause_seconds,
      ':extra_seconds': updated.extra_seconds,
      ':extra_elapsed_seconds': updated.extra_elapsed_seconds,
      ':is_extra_time': updated.is_extra_time ? 1 : 0,
      ':penalties_json': JSON.stringify(updated.penalties),
      ':snapshot_json': JSON.stringify(snapshot),
      ':id': id
    }
  );

  persist(db, SQL);

  return getGame(id);
}

export async function deleteGame(id) {
  const { SQL, db } = await ensureDatabase();
  const row = await fetchRowById(db, id);
  if (!row) {
    return false;
  }

  db.run('DELETE FROM games WHERE id = ?', [id]);
  persist(db, SQL);
  return true;
}
