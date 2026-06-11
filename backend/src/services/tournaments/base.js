import { getConnection, persistDatabase } from '../../db/connection.js';
import { normalizeClassificationMode, normalizeTournamentPayload } from './helpers.js';
import { getAudioFileById } from '../audio/index.js';

export function mapTournament(row) {
  let classificationMode = 'top4';
  try {
    classificationMode = normalizeClassificationMode(row.classification_mode ?? 'top4');
  } catch (error) {
    classificationMode = 'top4';
  }

  return {
    id: row.id,
    name: row.name,
    group_count: row.group_count ?? 0,
    knockout_rounds: row.knockout_rounds ?? 0,
    is_public: Boolean(row.is_public),
    is_completed: Boolean(row.is_completed),
    team_count: row.team_count ?? 0,
    classification_mode: classificationMode,
    created_at: row.created_at,
    status: row.status ?? 'active',
    planned_at: row.planned_at ?? null,
    description: row.description ?? null,
    location: row.location ?? null,
    poster_file_id: row.poster_file_id ?? null,
    schedule_info: row.schedule_info ?? null,
    travel_info: row.travel_info ?? null,
    contact_email: row.contact_email ?? null,
    registration_url: row.registration_url ?? null,
    registration_deadline: row.registration_deadline ?? null,
    registration_closed: Boolean(row.registration_closed)
  };
}

export async function listTournaments() {
  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM tournaments ORDER BY datetime(created_at) DESC, id DESC');
  const rows = [];
  try {
    while (stmt.step()) {
      rows.push(mapTournament(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }
  return rows;
}

export async function getTournament(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM tournaments WHERE id = ?');
  try {
    stmt.bind([numeric]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    return row ? mapTournament(row) : null;
  } finally {
    stmt.free();
  }
}

export async function insertTournament(payload) {
  const normalized = normalizeTournamentPayload(payload);
  const { SQL, db } = await getConnection();

  const stmt = db.prepare(`
    INSERT INTO tournaments (name, group_count, knockout_rounds, is_public, team_count, classification_mode, status, planned_at, description, location, poster_file_id, schedule_info, travel_info, contact_email, registration_url, registration_deadline)
    VALUES (:name, :group_count, :knockout_rounds, :is_public, :team_count, :classification_mode, :status, :planned_at, :description, :location, :poster_file_id, :schedule_info, :travel_info, :contact_email, :registration_url, :registration_deadline)
  `);

  let newId = null;
  try {
    stmt.bind({
      ':name': normalized.name,
      ':group_count': normalized.groupCount,
      ':knockout_rounds': normalized.knockoutRounds,
      ':is_public': normalized.isPublic ? 1 : 0,
      ':team_count': normalized.teamCount,
      ':classification_mode': normalized.classification,
      ':status': normalized.status,
      ':planned_at': normalized.plannedAt,
      ':description': normalized.description,
      ':location': normalized.location,
      ':poster_file_id': normalized.posterFileId,
      ':schedule_info': normalized.scheduleInfo,
      ':travel_info': normalized.travelInfo,
      ':contact_email': normalized.contactEmail,
      ':registration_url': normalized.registrationUrl,
      ':registration_deadline': normalized.registrationDeadline
    });
    stmt.step();
    newId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  } finally {
    stmt.free();
  }

  persistDatabase(db, SQL);
  return { id: newId, normalized };
}

export async function updateTournamentRecord(id, patch = {}, defaults = {}) {
  const normalized = normalizeTournamentPayload(patch, defaults);
  const { SQL, db } = await getConnection();

  db.run(
    `UPDATE tournaments
     SET name = ?, group_count = ?, knockout_rounds = ?, is_public = ?, team_count = ?, classification_mode = ?,
         status = ?, planned_at = ?, description = ?, location = ?, poster_file_id = ?,
         schedule_info = ?, travel_info = ?, contact_email = ?, registration_url = ?, registration_deadline = ?
     WHERE id = ?`,
    [
      normalized.name,
      normalized.groupCount,
      normalized.knockoutRounds,
      normalized.isPublic ? 1 : 0,
      normalized.teamCount,
      normalized.classification,
      normalized.status,
      normalized.plannedAt,
      normalized.description,
      normalized.location,
      normalized.posterFileId,
      normalized.scheduleInfo,
      normalized.travelInfo,
      normalized.contactEmail,
      normalized.registrationUrl,
      normalized.registrationDeadline,
      id
    ]
  );

  persistDatabase(db, SQL);
  return normalized;
}

export async function setTournamentCompletionStatus(id, completed) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error('Ungültige Turnier-ID.');
  }
  const { SQL, db } = await getConnection();
  db.run('UPDATE tournaments SET is_completed = ? WHERE id = ?', [completed ? 1 : 0, numeric]);
  persistDatabase(db, SQL);
  return getTournament(numeric);
}

export async function deleteTournamentCascade(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return false;
  }

  const { SQL, db } = await getConnection();
  const existing = await getTournament(numeric);
  if (!existing) {
    return false;
  }

  db.run('DELETE FROM tournaments WHERE id = ?', [numeric]);
  db.run('DELETE FROM tournament_teams WHERE tournament_id = ?', [numeric]);
  db.run('DELETE FROM tournament_schedule WHERE tournament_id = ?', [numeric]);
  db.run(
    'UPDATE games SET tournament_id = NULL, tournament_name = NULL, stage_type = NULL, stage_label = NULL WHERE tournament_id = ?',
    [numeric]
  );

  persistDatabase(db, SQL);
  return true;
}

export async function listPublicTournaments() {
  const all = await listTournaments();
  const visible = all.filter((tournament) => tournament.is_public);
  return Promise.all(
    visible.map(async (t) => {
      if (!t.poster_file_id) return t;
      const file = await getAudioFileById(t.poster_file_id);
      return { ...t, poster_url: file ? `/media/audio/${encodeURIComponent(file.file_name)}` : null };
    })
  );
}
