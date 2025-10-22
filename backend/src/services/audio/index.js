import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { databasePaths, getConnection, persistDatabase } from '../../db/connection.js';

const AUDIO_DIR = path.join(databasePaths.dataDir, 'audio');
fs.mkdirSync(AUDIO_DIR, { recursive: true });

function sanitizeUsage(input) {
  const allowed = new Set(['library', 'trigger']);
  const normalized = String(input ?? '').toLowerCase();
  return allowed.has(normalized) ? normalized : 'library';
}

function buildFileUrl(fileName) {
  return `/media/audio/${encodeURIComponent(fileName)}`;
}

function mapAudioFile(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    label: row.label ?? null,
    original_name: row.original_name,
    file_name: row.file_name,
    mime_type: row.mime_type,
    size_bytes: Number(row.size_bytes ?? 0),
    usage: sanitizeUsage(row.usage),
    created_at: row.created_at,
    updated_at: row.updated_at,
    url: buildFileUrl(row.file_name)
  };
}

function mapAudioTrigger(row) {
  if (!row) {
    return null;
  }
  const trigger = {
    key: row.key,
    label: row.label,
    description: row.description ?? '',
    is_active: Number(row.is_active ?? 0) === 1,
    updated_at: row.updated_at
  };

  if (row.file_id) {
    trigger.file = mapAudioFile({
      id: row.file_id,
      label: row.file_label,
      original_name: row.file_original_name,
      file_name: row.file_name,
      mime_type: row.file_mime_type,
      size_bytes: row.file_size_bytes,
      usage: row.file_usage,
      created_at: row.file_created_at,
      updated_at: row.file_updated_at
    });
  } else {
    trigger.file = null;
  }

  return trigger;
}

function generateFileName(originalName) {
  const extension = path.extname(originalName || '').toLowerCase() || '.mp3';
  const timestamp = Date.now();
  const random = crypto.randomBytes(6).toString('hex');
  return `${timestamp}-${random}${extension}`;
}

function isValidMimeType(mimeType) {
  const allowed = new Set(['audio/mpeg', 'audio/mp3', 'audio/x-mpeg']);
  return allowed.has(String(mimeType).toLowerCase());
}

export function getAudioStorageDirectory() {
  return AUDIO_DIR;
}

export async function createAudioFileRecord({ label, originalName, fileName, mimeType, sizeBytes, usage = 'library' }) {
  const { SQL, db } = await getConnection();
  const stmt = db.prepare(`
    INSERT INTO audio_files (label, original_name, file_name, mime_type, size_bytes, usage, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  try {
    stmt.run([
      label ?? null,
      originalName,
      fileName,
      mimeType,
      Number(sizeBytes) || 0,
      sanitizeUsage(usage)
    ]);
  } finally {
    stmt.free();
  }

  const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values?.[0]?.[0] ?? null;
  persistDatabase(db, SQL);
  return id ? getAudioFileById(id) : null;
}

export async function storeUploadedAudio({ buffer, originalName, mimeType, label = null, usage = 'library' }) {
  if (!buffer || !buffer.length) {
    throw new Error('Die Audiodatei ist leer.');
  }
  if (!isValidMimeType(mimeType)) {
    throw new Error('Es werden nur MP3-Dateien unterstützt.');
  }

  const fileName = generateFileName(originalName);
  const targetPath = path.join(AUDIO_DIR, fileName);
  await fsPromises.writeFile(targetPath, buffer);

  try {
    const record = await createAudioFileRecord({
      label,
      originalName,
      fileName,
      mimeType,
      sizeBytes: buffer.length,
      usage
    });
    return record;
  } catch (error) {
    await fsPromises.unlink(targetPath).catch(() => {});
    throw error;
  }
}

export async function listAudioFiles() {
  const { db } = await getConnection();
  const stmt = db.prepare(`
    SELECT *
    FROM audio_files
    ORDER BY datetime(created_at) DESC, id DESC
  `);
  const rows = [];
  try {
    while (stmt.step()) {
      rows.push(mapAudioFile(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }
  return rows;
}

export async function getAudioFileById(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }
  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM audio_files WHERE id = ?');
  try {
    stmt.bind([numeric]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    return mapAudioFile(row);
  } finally {
    stmt.free();
  }
}

export async function deleteAudioFile(id) {
  const file = await getAudioFileById(id);
  if (!file) {
    return false;
  }

  const filePath = path.join(AUDIO_DIR, file.file_name);
  const { SQL, db } = await getConnection();

  db.run('UPDATE audio_triggers SET audio_file_id = NULL WHERE audio_file_id = ?', [file.id]);
  db.run('DELETE FROM audio_files WHERE id = ?', [file.id]);
  persistDatabase(db, SQL);

  await fsPromises.unlink(filePath).catch(() => {});
  return true;
}

async function ensureScoreTriggerRecord(key, label, description = '') {
  const { SQL, db } = await getConnection();
  let changed = false;

  const selectStmt = db.prepare('SELECT label, description FROM audio_triggers WHERE key = ?');
  selectStmt.bind([key]);
  const existing = selectStmt.step() ? selectStmt.getAsObject() : null;
  selectStmt.free();

  if (!existing) {
    const insertStmt = db.prepare(
      'INSERT INTO audio_triggers (key, label, description, is_active, updated_at) VALUES (?, ?, ?, 1, datetime(\'now\'))'
    );
    insertStmt.run([key, label, description]);
    insertStmt.free();
    changed = true;
  } else if (existing.label !== label || existing.description !== description) {
    const updateStmt = db.prepare(
      'UPDATE audio_triggers SET label = ?, description = ?, updated_at = datetime(\'now\') WHERE key = ?'
    );
    updateStmt.run([label, description, key]);
    updateStmt.free();
    changed = true;
  }

  if (changed) {
    persistDatabase(db, SQL);
  }

  return changed;
}

export async function ensureScoreTriggerForTeam(teamId, teamName) {
  const numeric = Number(teamId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  const key = `score_team_${numeric}`;
  const labelBase = (teamName ?? '').toString().trim();
  const label = labelBase ? `Korb ${labelBase}` : `Korb Team ${numeric}`;
  const description = 'Team-spezifischer Korb-Sound';
  await ensureScoreTriggerRecord(key, label, description);
  return key;
}

async function ensureTeamScoreTriggers() {
  const { db } = await getConnection();
  const teamsStmt = db.prepare('SELECT id, name FROM teams');
  try {
    while (teamsStmt.step()) {
      const row = teamsStmt.getAsObject();
      await ensureScoreTriggerForTeam(row.id, row.name);
    }
  } finally {
    teamsStmt.free();
  }
}

export async function listAudioTriggers() {
  await ensureTeamScoreTriggers();
  const { db } = await getConnection();
  const stmt = db.prepare(`
    SELECT
      t.*,
      f.id AS file_id,
      f.label AS file_label,
      f.original_name AS file_original_name,
      f.file_name AS file_name,
      f.mime_type AS file_mime_type,
      f.size_bytes AS file_size_bytes,
      f.usage AS file_usage,
      f.created_at AS file_created_at,
      f.updated_at AS file_updated_at
    FROM audio_triggers t
    LEFT JOIN audio_files f ON f.id = t.audio_file_id
    ORDER BY t.label ASC
  `);

  const triggers = [];
  try {
    while (stmt.step()) {
      triggers.push(mapAudioTrigger(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return triggers;
}

export async function getAudioTrigger(key) {
  const normalized = String(key ?? '').trim();
  if (!normalized) {
    return null;
  }

  const { db } = await getConnection();
  const stmt = db.prepare(`
    SELECT
      t.*,
      f.id AS file_id,
      f.label AS file_label,
      f.original_name AS file_original_name,
      f.file_name AS file_name,
      f.mime_type AS file_mime_type,
      f.size_bytes AS file_size_bytes,
      f.usage AS file_usage,
      f.created_at AS file_created_at,
      f.updated_at AS file_updated_at
    FROM audio_triggers t
    LEFT JOIN audio_files f ON f.id = t.audio_file_id
    WHERE t.key = ?
    LIMIT 1
  `);

  try {
    stmt.bind([normalized]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    return mapAudioTrigger(row);
  } finally {
    stmt.free();
  }
}

export async function getActiveTriggerWithFile(key) {
  const trigger = await getAudioTrigger(key);
  if (!trigger || !trigger.is_active || !trigger.file) {
    return null;
  }
  return trigger;
}

export async function setTriggerActivation(key, isActive) {
  const trigger = await getAudioTrigger(key);
  if (!trigger) {
    return null;
  }

  const value = isActive ? 1 : 0;
  const { SQL, db } = await getConnection();
  db.run(
    `UPDATE audio_triggers
     SET is_active = ?, updated_at = datetime('now')
     WHERE key = ?`,
    [value, trigger.key]
  );
  persistDatabase(db, SQL);
  return getAudioTrigger(trigger.key);
}

export async function assignFileToTrigger(key, fileId) {
  const trigger = await getAudioTrigger(key);
  if (!trigger) {
    return null;
  }

  const file = fileId === null ? null : await getAudioFileById(fileId);
  if (fileId !== null && !file) {
    throw new Error('Audiodatei nicht gefunden.');
  }

  const { SQL, db } = await getConnection();
  db.run(
    `UPDATE audio_triggers
     SET audio_file_id = ?, updated_at = datetime('now')
     WHERE key = ?`,
    [file ? file.id : null, trigger.key]
  );
  persistDatabase(db, SQL);
  return getAudioTrigger(trigger.key);
}

export async function updateTriggerSettings(key, { isActive, fileId }) {
  const trigger = await getAudioTrigger(key);
  if (!trigger) {
    return null;
  }

  const { SQL, db } = await getConnection();
  const updates = [];
  const params = [];

  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  if (fileId !== undefined) {
    if (fileId === null) {
      updates.push('audio_file_id = NULL');
    } else {
      const file = await getAudioFileById(fileId);
      if (!file) {
        throw new Error('Audiodatei nicht gefunden.');
      }
      updates.push('audio_file_id = ?');
      params.push(file.id);
    }
  }

  if (updates.length === 0) {
    return trigger;
  }

  params.push(trigger.key);

  db.run(
    `UPDATE audio_triggers
     SET ${updates.join(', ')}, updated_at = datetime('now')
     WHERE key = ?`,
    params
  );
  persistDatabase(db, SQL);

  return getAudioTrigger(trigger.key);
}

export async function upsertTriggerFileFromUpload(key, uploadMeta) {
  const trigger = await getAudioTrigger(key);
  if (!trigger) {
    throw new Error('Unbekannter Audio-Trigger.');
  }

  const record = await storeUploadedAudio({
    buffer: uploadMeta.buffer,
    originalName: uploadMeta.originalName,
    mimeType: uploadMeta.mimeType,
    label: uploadMeta.label ?? null,
    usage: 'trigger'
  });

  await assignFileToTrigger(key, record.id);
  return getAudioTrigger(key);
}

export async function storeLibraryUpload(uploadMeta) {
  return storeUploadedAudio({
    buffer: uploadMeta.buffer,
    originalName: uploadMeta.originalName,
    mimeType: uploadMeta.mimeType,
    label: uploadMeta.label ?? null,
    usage: 'library'
  });
}
