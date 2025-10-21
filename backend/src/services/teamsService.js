import { getConnection, persistDatabase } from '../db/connection.js';

function mapTeam(row) {
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at
  };
}

export async function createTeam({ name }) {
  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) {
    throw new Error('Team name required');
  }

  const { SQL, db } = await getConnection();
  const stmt = db.prepare('INSERT INTO teams (name) VALUES (?)');
  try {
    stmt.run([trimmedName]);
  } catch (error) {
    stmt.free();
    if (String(error?.message || '').includes('UNIQUE')) {
      throw new Error('Team name must be unique');
    }
    throw error;
  }
  stmt.free();

  const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  persistDatabase(db, SQL);
  return (await getTeam(id)) ?? null;
}

export async function listTeams() {
  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM teams ORDER BY LOWER(name) ASC');
  const rows = [];

  try {
    while (stmt.step()) {
      rows.push(mapTeam(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return rows;
}

export async function getTeam(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM teams WHERE id = ?');

  try {
    stmt.bind([numeric]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    return row ? mapTeam(row) : null;
  } finally {
    stmt.free();
  }
}

export async function updateTeam(id, { name }) {
  const existing = await getTeam(id);
  if (!existing) {
    return null;
  }

  const trimmedName = String(name ?? '').trim();
  if (!trimmedName) {
    throw new Error('Team name required');
  }

  const { SQL, db } = await getConnection();
  try {
    db.run('UPDATE teams SET name = ? WHERE id = ?', [trimmedName, existing.id]);
  } catch (error) {
    if (String(error?.message || '').includes('UNIQUE')) {
      throw new Error('Team name must be unique');
    }
    throw error;
  }

  db.run('UPDATE games SET team_a = ? WHERE team_a_id = ?', [trimmedName, existing.id]);
  db.run('UPDATE games SET team_b = ? WHERE team_b_id = ?', [trimmedName, existing.id]);
  persistDatabase(db, SQL);
  return getTeam(existing.id);
}

export async function deleteTeam(id) {
  const existing = await getTeam(id);
  if (!existing) {
    return false;
  }

  const { SQL, db } = await getConnection();
  db.run('DELETE FROM teams WHERE id = ?', [existing.id]);
  db.run('UPDATE games SET team_a_id = NULL WHERE team_a_id = ?', [existing.id]);
  db.run('UPDATE games SET team_b_id = NULL WHERE team_b_id = ?', [existing.id]);
  persistDatabase(db, SQL);
  return true;
}
