export default function initializeSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT DEFAULT (datetime('now')),
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      team_a_id INTEGER,
      team_b_id INTEGER,
      score_a INTEGER NOT NULL,
      score_b INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      halftime_seconds INTEGER NOT NULL,
      halftime_pause_seconds INTEGER NOT NULL,
      extra_seconds INTEGER NOT NULL,
      extra_elapsed_seconds INTEGER NOT NULL,
      is_extra_time INTEGER NOT NULL,
      penalties_json TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      tournament_id INTEGER,
      tournament_name TEXT,
      stage_type TEXT,
      stage_label TEXT,
      schedule_code TEXT
    );
  `);

  const gamesInfo = db.exec('PRAGMA table_info(games)');
  const gameColumns = (gamesInfo[0]?.values ?? []).map(([, name]) => name);
  const ensureGameColumn = (name, type) => {
    if (!gameColumns.includes(name)) {
      db.exec(`ALTER TABLE games ADD COLUMN ${name} ${type}`);
    }
  };

  ensureGameColumn('team_a_id', 'INTEGER');
  ensureGameColumn('team_b_id', 'INTEGER');
  ensureGameColumn('tournament_id', 'INTEGER');
  ensureGameColumn('tournament_name', 'TEXT');
  ensureGameColumn('stage_type', 'TEXT');
  ensureGameColumn('stage_label', 'TEXT');
  ensureGameColumn('schedule_code', 'TEXT');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      group_count INTEGER DEFAULT 0,
      knockout_rounds INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      team_count INTEGER DEFAULT 0,
      classification_mode TEXT DEFAULT 'top4',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const tournamentsInfo = db.exec('PRAGMA table_info(tournaments)');
  const tournamentColumns = (tournamentsInfo[0]?.values ?? []).map(([, name]) => name);
  const ensureTournamentColumn = (name, definition) => {
    if (!tournamentColumns.includes(name)) {
      db.exec(`ALTER TABLE tournaments ADD COLUMN ${name} ${definition}`);
    }
  };

  ensureTournamentColumn('is_public', 'INTEGER DEFAULT 0');
  ensureTournamentColumn('team_count', 'INTEGER DEFAULT 0');
  ensureTournamentColumn('classification_mode', "TEXT DEFAULT 'top4'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      slot_number INTEGER NOT NULL,
      team_id INTEGER,
      placeholder TEXT NOT NULL,
      UNIQUE(tournament_id, slot_number)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      phase TEXT NOT NULL,
      stage_label TEXT NOT NULL,
      round_number INTEGER DEFAULT 0,
      match_order INTEGER DEFAULT 0,
      stage_order INTEGER DEFAULT 0,
      code TEXT,
      home_slot INTEGER,
      away_slot INTEGER,
      home_source TEXT,
      away_source TEXT,
      metadata_json TEXT
    );
  `);

  db.exec(
    'CREATE INDEX IF NOT EXISTS idx_tournament_schedule_tournament ON tournament_schedule (tournament_id, stage_order, match_order)'
  );
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_schedule_code ON tournament_schedule (tournament_id, code)');

  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
