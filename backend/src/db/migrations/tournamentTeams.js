function selectRows(db, sql, params = []) {
  const result = db.exec(sql, params)[0];
  if (!result) return [];
  return result.values.map((values) => Object.fromEntries(result.columns.map((column, index) => [column, values[index]])));
}

function collectTeamUsage(db) {
  const usage = new Map();
  const add = (teamId, tournamentId) => {
    if (teamId === null || tournamentId === null) return;
    if (!usage.has(teamId)) usage.set(teamId, new Set());
    usage.get(teamId).add(tournamentId);
  };

  selectRows(
    db,
    'SELECT tt.team_id, tt.tournament_id FROM tournament_teams tt JOIN tournaments t ON t.id = tt.tournament_id WHERE tt.team_id IS NOT NULL'
  ).forEach((row) => add(row.team_id, row.tournament_id));
  selectRows(
    db,
    'SELECT r.team_id, r.tournament_id FROM tournament_registrations r JOIN tournaments t ON t.id = r.tournament_id WHERE r.team_id IS NOT NULL'
  ).forEach((row) => add(row.team_id, row.tournament_id));
  selectRows(
    db,
    'SELECT g.team_a_id, g.team_b_id, g.tournament_id FROM games g JOIN tournaments t ON t.id = g.tournament_id'
  ).forEach((row) => {
    add(row.team_a_id, row.tournament_id);
    add(row.team_b_id, row.tournament_id);
  });

  return usage;
}

function restoreRosterFromGames(db, { tournamentId, teamId, teamName }) {
  const seen = new Set();
  const games = selectRows(
    db,
    'SELECT team_a, team_b, team_a_id, team_b_id, snapshot_json FROM games WHERE tournament_id = ? ORDER BY id',
    [tournamentId]
  );

  games.forEach((game) => {
    let snapshot = null;
    try {
      snapshot = JSON.parse(game.snapshot_json || 'null');
    } catch {
      snapshot = null;
    }
    const sides = [
      ['a', game.team_a_id, game.team_a],
      ['b', game.team_b_id, game.team_b]
    ];
    sides.forEach(([side, sideTeamId, sideName]) => {
      const belongs = sideTeamId === teamId || (sideTeamId === null && sideName === teamName);
      if (!belongs) return;
      (snapshot?.players?.[side] ?? []).forEach((player) => {
        const name = String(player?.name ?? '').trim();
        if (!name) return;
        const playerId = Number(player.playerId ?? player.id);
        const key = Number.isInteger(playerId) && playerId > 0 ? `id:${playerId}` : `name:${name}`;
        if (seen.has(key)) return;
        seen.add(key);
        const jersey = Number.isInteger(Number(player.jerseyNumber)) ? Number(player.jerseyNumber) : null;
        if (Number.isInteger(playerId) && playerId > 0) {
          const taken = selectRows(db, 'SELECT id FROM team_players WHERE id = ?', [playerId]).length > 0;
          if (!taken) {
            db.run('INSERT INTO team_players (id, team_id, name, jersey_number, position) VALUES (?, ?, ?, ?, ?)', [
              playerId,
              teamId,
              name,
              jersey,
              player.position || null
            ]);
          }
          return;
        }
        db.run('INSERT INTO team_players (team_id, name, jersey_number, position) VALUES (?, ?, ?, ?)', [
          teamId,
          name,
          jersey,
          player.position || null
        ]);
      });
    });
  });
}

export function migrateTeamsToTournaments(db) {
  const columns = selectRows(db, 'PRAGMA table_info(teams)').map((column) => column.name);
  if (columns.includes('tournament_id')) {
    return false;
  }

  db.exec('BEGIN');
  try {
    db.exec(`
      CREATE TABLE teams_scoped (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(tournament_id, name)
      );
      INSERT INTO teams_scoped (id, tournament_id, name, created_at) SELECT id, NULL, name, created_at FROM teams;
      DROP TABLE teams;
      ALTER TABLE teams_scoped RENAME TO teams;
    `);

    const usage = collectTeamUsage(db);
    selectRows(db, 'SELECT id, name, created_at FROM teams ORDER BY id').forEach((team) => {
      const tournaments = Array.from(usage.get(team.id) ?? []).sort((a, b) => b - a);
      if (tournaments.length === 0) return;

      const [owner, ...older] = tournaments;
      db.run('UPDATE teams SET tournament_id = ? WHERE id = ?', [owner, team.id]);

      older.forEach((tournamentId) => {
        db.run('INSERT INTO teams (tournament_id, name, created_at) VALUES (?, ?, ?)', [tournamentId, team.name, team.created_at]);
        const cloneId = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
        const remap = [tournamentId, team.id];
        db.run('UPDATE tournament_teams SET team_id = ? WHERE tournament_id = ? AND team_id = ?', [cloneId, ...remap]);
        db.run('UPDATE tournament_registrations SET team_id = ? WHERE tournament_id = ? AND team_id = ?', [cloneId, ...remap]);
        db.run('UPDATE games SET team_a_id = ? WHERE tournament_id = ? AND team_a_id = ?', [cloneId, ...remap]);
        db.run('UPDATE games SET team_b_id = ? WHERE tournament_id = ? AND team_b_id = ?', [cloneId, ...remap]);
        db.run('UPDATE audio_triggers SET key = ? WHERE key = ? AND tournament_id = ?', [
          `score_team_${cloneId}`,
          `score_team_${team.id}`,
          tournamentId
        ]);
        restoreRosterFromGames(db, { tournamentId, teamId: cloneId, teamName: team.name });
      });
    });

    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
