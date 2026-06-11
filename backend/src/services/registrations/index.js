import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { databasePaths, getConnection, persistDatabase } from '../../db/connection.js';
import { getAudioStorageDirectory } from '../audio/index.js';

const REG_AUDIO_DIR = path.join(databasePaths.dataDir, 'registration-audio');
fs.mkdirSync(REG_AUDIO_DIR, { recursive: true });

function generateFileName(originalName) {
  const extension = path.extname(originalName || '').toLowerCase() || '.mp3';
  const random = crypto.randomBytes(8).toString('hex');
  return `${random}${extension}`;
}

export function getRegistrationAudioDir() {
  return REG_AUDIO_DIR;
}

export async function createRegistration({ tournamentId, teamName, contactName, contactEmail, players, audioNotes }) {
  const { SQL, db } = await getConnection();
  const stmt = db.prepare(`
    INSERT INTO tournament_registrations (tournament_id, team_name, contact_name, contact_email, players_json, audio_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  let id = null;
  try {
    stmt.bind([tournamentId, teamName, contactName, contactEmail, JSON.stringify(players ?? []), audioNotes ?? null]);
    stmt.step();
    id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  } finally {
    stmt.free();
  }
  persistDatabase(db, SQL);
  return id;
}

export async function attachAudioFile(registrationId, { buffer, originalName, label }) {
  const fileName = generateFileName(originalName);
  const targetPath = path.join(REG_AUDIO_DIR, fileName);
  await fsPromises.writeFile(targetPath, buffer);

  const { SQL, db } = await getConnection();
  try {
    db.run(
      'INSERT INTO registration_audio_files (registration_id, file_name, original_name, label) VALUES (?, ?, ?, ?)',
      [registrationId, fileName, originalName, label ?? null]
    );
    persistDatabase(db, SQL);
  } catch (err) {
    await fsPromises.unlink(targetPath).catch(() => {});
    throw err;
  }
}

export async function listRegistrations(tournamentId) {
  const { db } = await getConnection();
  const stmt = db.prepare(`
    SELECT r.*, GROUP_CONCAT(a.original_name || '|' || a.file_name || '|' || COALESCE(a.label,''), ';;') AS audio_files
    FROM tournament_registrations r
    LEFT JOIN registration_audio_files a ON a.registration_id = r.id
    WHERE r.tournament_id = ?
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `);
  const rows = [];
  try {
    stmt.bind([tournamentId]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push({
        id: row.id,
        tournamentId: row.tournament_id,
        teamName: row.team_name,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        players: JSON.parse(row.players_json || '[]'),
        audioNotes: row.audio_notes,
        status: row.status,
        teamId: row.team_id ?? null,
        createdAt: row.created_at,
        audioFiles: row.audio_files
          ? row.audio_files.split(';;').map((s) => {
              const [originalName, fileName, label] = s.split('|');
              return { originalName, fileName, url: `/media/reg-audio/${encodeURIComponent(fileName)}`, label: label || null };
            })
          : []
      });
    }
  } finally {
    stmt.free();
  }
  return rows;
}

export async function getRegistration(id) {
  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM tournament_registrations WHERE id = ?');
  try {
    stmt.bind([id]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    if (!row) return null;
    return {
      id: row.id,
      tournamentId: row.tournament_id,
      teamName: row.team_name,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      players: JSON.parse(row.players_json || '[]'),
      audioNotes: row.audio_notes,
      status: row.status,
      teamId: row.team_id ?? null,
      createdAt: row.created_at
    };
  } finally {
    stmt.free();
  }
}

// Upserts a team by name, returns team id
function upsertTeam(db, SQL, teamName) {
  db.run(
    `INSERT INTO teams (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name`,
    [teamName]
  );
  const result = db.exec('SELECT id FROM teams WHERE name = ?', [teamName]);
  return result[0]?.values[0][0] ?? null;
}

// Finds the next free slot in tournament_teams for this tournament
function nextFreeSlot(db, tournamentId) {
  const result = db.exec(
    'SELECT COALESCE(MAX(slot_number), 0) + 1 FROM tournament_teams WHERE tournament_id = ?',
    [tournamentId]
  );
  return result[0]?.values[0][0] ?? 1;
}

export async function confirmRegistration(regId) {
  const reg = await getRegistration(regId);
  if (!reg) throw new Error('Anmeldung nicht gefunden.');

  const { SQL, db } = await getConnection();

  // 1. Upsert team
  const teamId = upsertTeam(db, SQL, reg.teamName);

  // 2. Insert players (delete old ones from this team first to avoid dupes)
  db.run('DELETE FROM team_players WHERE team_id = ?', [teamId]);
  for (const player of reg.players) {
    if (!player.name?.trim()) continue;
    db.run(
      'INSERT INTO team_players (team_id, name, jersey_number, position) VALUES (?, ?, ?, ?)',
      [teamId, player.name.trim(), player.jerseyNumber ? Number(player.jerseyNumber) : null, null]
    );
  }

  // 3. Add to tournament_teams if not already there
  const existing = db.exec(
    'SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
    [reg.tournamentId, teamId]
  );
  if (!existing[0]?.values?.length) {
    const slot = nextFreeSlot(db, reg.tournamentId);
    db.run(
      'INSERT INTO tournament_teams (tournament_id, slot_number, team_id, placeholder) VALUES (?, ?, ?, ?)',
      [reg.tournamentId, slot, teamId, reg.teamName]
    );
  }

  // 4. Update registration
  db.run(
    'UPDATE tournament_registrations SET status = ?, team_id = ? WHERE id = ?',
    ['confirmed', teamId, regId]
  );

  persistDatabase(db, SQL);

  // 5. Copy Korbhymne into audio library and wire trigger (fire-and-forget)
  _copyKorbhymneAsync(regId, reg.teamName, teamId).catch((err) =>
    console.error('[registrations] Korbhymne copy failed:', err)
  );

  return { ...reg, status: 'confirmed', teamId };
}

async function _copyKorbhymneAsync(regId, teamName, teamId) {
  // Re-read audio file from DB using fresh connection to avoid stale state
  const { db: freshDb } = await getConnection();
  const stmt = freshDb.prepare(
    'SELECT file_name, original_name FROM registration_audio_files WHERE registration_id = ? LIMIT 1'
  );
  let audioRow = null;
  try {
    stmt.bind([regId]);
    if (stmt.step()) audioRow = stmt.getAsObject();
  } finally {
    stmt.free();
  }
  if (!audioRow) return;

  const srcPath = path.join(REG_AUDIO_DIR, audioRow.file_name);
  if (!fs.existsSync(srcPath)) return;

  const ext = path.extname(audioRow.file_name) || '.mp3';
  const destName = `${crypto.randomBytes(8).toString('hex')}${ext}`;
  const destPath = path.join(getAudioStorageDirectory(), destName);
  await fsPromises.copyFile(srcPath, destPath);
  const stat = await fsPromises.stat(destPath);

  const { SQL: SQL2, db: db2 } = await getConnection();

  // Insert into audio_files
  db2.run(
    `INSERT INTO audio_files (label, original_name, file_name, mime_type, size_bytes, usage, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [`Korbhymne – ${teamName}`, audioRow.original_name, destName, 'audio/mpeg', stat.size, 'library']
  );
  const audioFileId = db2.exec('SELECT last_insert_rowid() as id')[0].values[0][0];

  // Ensure score trigger exists for this team and assign the anthem
  const triggerKey = `score_team_${teamId}`;
  const triggerLabel = `Korb ${teamName}`;
  // Upsert trigger record
  db2.run(
    `INSERT INTO audio_triggers (key, label, description, is_active, audio_file_id, updated_at)
     VALUES (?, ?, ?, 1, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET audio_file_id = excluded.audio_file_id, updated_at = datetime('now')`,
    [triggerKey, triggerLabel, 'Korbhymne (automatisch)', audioFileId]
  );

  persistDatabase(db2, SQL2);
  console.log(`[registrations] Korbhymne für "${teamName}" → Trigger ${triggerKey} (file_id=${audioFileId})`);
}

export async function rejectRegistration(regId) {
  const reg = await getRegistration(regId);
  if (!reg) throw new Error('Anmeldung nicht gefunden.');

  const { SQL, db } = await getConnection();

  // Remove from tournament_teams if present and was confirmed via this registration
  if (reg.teamId) {
    db.run(
      'DELETE FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
      [reg.tournamentId, reg.teamId]
    );
  }

  db.run(
    'UPDATE tournament_registrations SET status = ?, team_id = NULL WHERE id = ?',
    ['rejected', regId]
  );

  persistDatabase(db, SQL);
  return { ...reg, status: 'rejected' };
}

export async function updateRegistrationStatus(id, status) {
  const { SQL, db } = await getConnection();
  db.run('UPDATE tournament_registrations SET status = ? WHERE id = ?', [status, id]);
  persistDatabase(db, SQL);
}
