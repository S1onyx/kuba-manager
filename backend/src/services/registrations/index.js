import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { databasePaths, getConnection, persistDatabase } from '../../db/connection.js';

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

export async function updateRegistrationStatus(id, status) {
  const { SQL, db } = await getConnection();
  db.run('UPDATE tournament_registrations SET status = ? WHERE id = ?', [status, id]);
  persistDatabase(db, SQL);
}
