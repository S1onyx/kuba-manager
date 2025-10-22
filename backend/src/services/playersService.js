import { getConnection, persistDatabase } from '../db/connection.js';

function mapPlayer(row) {
  return {
    id: row.id,
    team_id: row.team_id,
    team_name: row.team_name ?? null,
    name: row.name,
    jersey_number: row.jersey_number,
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function sanitizePlayerPayload(input = {}) {
  const teamIdRaw = input.teamId ?? input.team_id;
  const nameRaw = input.name;
  const numberRaw = input.jerseyNumber ?? input.jersey_number;
  const positionRaw = input.position ?? '';

  const teamId =
    teamIdRaw === null || teamIdRaw === undefined || teamIdRaw === ''
      ? null
      : Number(teamIdRaw);

  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new Error('teamId must be a positive integer');
  }

  const name = String(nameRaw ?? '').trim();
  if (!name) {
    throw new Error('Player name required');
  }

  const jerseyNumber =
    numberRaw === null || numberRaw === undefined || numberRaw === ''
      ? null
      : Number(numberRaw);

  if (jerseyNumber !== null && (!Number.isInteger(jerseyNumber) || jerseyNumber < 0)) {
    throw new Error('jerseyNumber must be a non-negative integer');
  }

  const position = String(positionRaw ?? '').trim();

  return {
    teamId,
    name,
    jerseyNumber,
    position
  };
}

export async function listPlayers({ teamId } = {}) {
  const { db } = await getConnection();
  let stmt;
  if (teamId) {
    const numeric = Number(teamId);
    if (!Number.isInteger(numeric) || numeric <= 0) {
      return [];
    }
    stmt = db.prepare(
      'SELECT * FROM team_players WHERE team_id = ? ORDER BY COALESCE(jersey_number, 9999), LOWER(name)'
    );
    stmt.bind([numeric]);
  } else {
    stmt = db.prepare(
      `SELECT p.*, t.name as team_name
       FROM team_players p
       LEFT JOIN teams t ON t.id = p.team_id
       ORDER BY t.name, COALESCE(p.jersey_number, 9999), LOWER(p.name)`
    );
  }

  const players = [];
  try {
    while (stmt.step()) {
      players.push(mapPlayer(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }
  return players;
}

export async function listPlayersByTeam(teamId) {
  return listPlayers({ teamId });
}

export async function getPlayer(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM team_players WHERE id = ?');
  try {
    stmt.bind([numeric]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    return row ? mapPlayer(row) : null;
  } finally {
    stmt.free();
  }
}

export async function createPlayer(payload) {
  const { teamId, name, jerseyNumber, position } = sanitizePlayerPayload(payload);

  const { SQL, db } = await getConnection();
  const stmt = db.prepare(
    `INSERT INTO team_players (team_id, name, jersey_number, position)
     VALUES (:team_id, :name, :jersey_number, :position)`
  );

  try {
    stmt.bind({
      ':team_id': teamId,
      ':name': name,
      ':jersey_number': jerseyNumber,
      ':position': position || null
    });
    stmt.step();
  } finally {
    stmt.free();
  }

  const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  persistDatabase(db, SQL);
  return getPlayer(id);
}

export async function updatePlayer(id, payload) {
  const player = await getPlayer(id);
  if (!player) {
    return null;
  }

  const { name, jerseyNumber, position } = sanitizePlayerPayload({
    ...payload,
    teamId: player.team_id
  });

  const { SQL, db } = await getConnection();
  db.run(
    `UPDATE team_players
     SET name = ?, jersey_number = ?, position = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [name, jerseyNumber, position || null, player.id]
  );
  persistDatabase(db, SQL);
  return getPlayer(player.id);
}

export async function movePlayer(id, targetTeamId) {
  const player = await getPlayer(id);
  if (!player) {
    return null;
  }
  const numericTeamId = Number(targetTeamId);
  if (!Number.isInteger(numericTeamId) || numericTeamId <= 0) {
    throw new Error('targetTeamId must be a positive integer');
  }

  const { SQL, db } = await getConnection();
  db.run(
    `UPDATE team_players
     SET team_id = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [numericTeamId, player.id]
  );
  persistDatabase(db, SQL);
  return getPlayer(player.id);
}

export async function deletePlayer(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return false;
  }

  const { SQL, db } = await getConnection();
  const stmt = db.prepare('DELETE FROM team_players WHERE id = ?');
  try {
    stmt.bind([numeric]);
    stmt.step();
  } finally {
    stmt.free();
  }
  persistDatabase(db, SQL);
  return true;
}
