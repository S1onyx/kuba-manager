import { getConnection, persistDatabase } from '../db/connection.js';
import { safeParse } from './shared/json.js';

function mapGameRow(row) {
  const snapshot = safeParse(row.snapshot_json, null);
  return {
    id: row.id,
    created_at: row.created_at,
    team_a: row.team_a,
    team_b: row.team_b,
    team_a_id: row.team_a_id,
    team_b_id: row.team_b_id,
    score_a: row.score_a,
    score_b: row.score_b,
    duration_seconds: row.duration_seconds,
    halftime_seconds: row.halftime_seconds,
    halftime_pause_seconds: row.halftime_pause_seconds,
    extra_seconds: row.extra_seconds,
    extra_elapsed_seconds: row.extra_elapsed_seconds,
    is_extra_time: Boolean(row.is_extra_time),
    tournament_id: row.tournament_id,
    tournament_name: row.tournament_name,
    stage_type: row.stage_type,
    stage_label: row.stage_label,
    schedule_code: row.schedule_code,
    penalties: safeParse(row.penalties_json, { a: [], b: [] }),
    snapshot,
    player_stats: snapshot?.playerStats ?? { a: [], b: [] },
    scoring_log: snapshot?.scoringLog ?? [],
    penalty_log: snapshot?.penaltyLog ?? []
  };
}

async function fetchGameRow(db, id) {
  const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
  try {
    stmt.bind([id]);
    return stmt.step() ? stmt.getAsObject() : null;
  } finally {
    stmt.free();
  }
}

export async function saveGame(snapshot) {
  const { SQL, db } = await getConnection();

  const stmt = db.prepare(`
    INSERT INTO games (
      team_a,
      team_b,
      team_a_id,
      team_b_id,
      score_a,
      score_b,
      duration_seconds,
      halftime_seconds,
      halftime_pause_seconds,
      extra_seconds,
      extra_elapsed_seconds,
      is_extra_time,
      penalties_json,
      snapshot_json,
      tournament_id,
      tournament_name,
      stage_type,
      stage_label,
      schedule_code
    ) VALUES (
      :team_a,
      :team_b,
      :team_a_id,
      :team_b_id,
      :score_a,
      :score_b,
      :duration_seconds,
      :halftime_seconds,
      :halftime_pause_seconds,
      :extra_seconds,
      :extra_elapsed_seconds,
      :is_extra_time,
      :penalties_json,
      :snapshot_json,
      :tournament_id,
      :tournament_name,
      :stage_type,
      :stage_label,
      :schedule_code
    )
  `);

  try {
    stmt.bind({
      ':team_a': snapshot.teamAName ?? 'Team A',
      ':team_b': snapshot.teamBName ?? 'Team B',
      ':team_a_id': snapshot.teamAId ?? null,
      ':team_b_id': snapshot.teamBId ?? null,
      ':score_a': snapshot.scoreA ?? 0,
      ':score_b': snapshot.scoreB ?? 0,
      ':duration_seconds': snapshot.durationSeconds ?? 0,
      ':halftime_seconds': snapshot.halftimeSeconds ?? 0,
      ':halftime_pause_seconds': snapshot.halftimePauseSeconds ?? 0,
      ':extra_seconds': snapshot.extraSeconds ?? 0,
      ':extra_elapsed_seconds': snapshot.extraElapsedSeconds ?? 0,
      ':is_extra_time': snapshot.isExtraTime ? 1 : 0,
      ':penalties_json': JSON.stringify(snapshot.penalties ?? { a: [], b: [] }),
      ':snapshot_json': JSON.stringify(snapshot),
      ':tournament_id': snapshot.tournamentId ?? null,
      ':tournament_name': snapshot.tournamentName ?? null,
      ':stage_type': snapshot.stageType ?? null,
      ':stage_label': snapshot.stageLabel ?? null,
      ':schedule_code': snapshot.scheduleCode ?? null
    });
    stmt.step();
  } finally {
    stmt.free();
  }

  const selectStmt = db.prepare('SELECT * FROM games ORDER BY created_at DESC, id DESC LIMIT 1');
  try {
    selectStmt.step();
    const row = selectStmt.getAsObject();
    persistDatabase(db, SQL);
    return mapGameRow(row);
  } finally {
    selectStmt.free();
  }
}

export async function listGames() {
  const { db } = await getConnection();
  const stmt = db.prepare('SELECT * FROM games ORDER BY datetime(created_at) DESC, id DESC');
  const rows = [];

  try {
    while (stmt.step()) {
      rows.push(mapGameRow(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return rows;
}

export async function getGame(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  const { db } = await getConnection();
  const row = await fetchGameRow(db, numeric);
  return row ? mapGameRow(row) : null;
}

export async function updateGame(id, patch = {}) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }

  const { SQL, db } = await getConnection();
  const row = await fetchGameRow(db, numeric);
  if (!row) {
    return null;
  }

  const existing = mapGameRow(row);
  const normalizeTeamId = (value, fallback) => {
    if (value === undefined) {
      return fallback;
    }
    if (value === null || value === '') {
      return null;
    }
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue <= 0) {
      return fallback;
    }
    return numericValue;
  };

  const updated = {
    team_a: patch.team_a?.trim?.() || patch.team_a || existing.team_a,
    team_b: patch.team_b?.trim?.() || patch.team_b || existing.team_b,
    team_a_id: normalizeTeamId(patch.team_a_id, existing.team_a_id),
    team_b_id: normalizeTeamId(patch.team_b_id, existing.team_b_id),
    score_a: Number.isFinite(Number(patch.score_a)) ? Math.max(0, Number(patch.score_a)) : existing.score_a,
    score_b: Number.isFinite(Number(patch.score_b)) ? Math.max(0, Number(patch.score_b)) : existing.score_b,
    duration_seconds: Number.isFinite(Number(patch.duration_seconds))
      ? Math.max(0, Number(patch.duration_seconds))
      : existing.duration_seconds,
    halftime_seconds: Number.isFinite(Number(patch.halftime_seconds))
      ? Math.max(0, Number(patch.halftime_seconds))
      : existing.halftime_seconds,
    halftime_pause_seconds: Number.isFinite(Number(patch.halftime_pause_seconds))
      ? Math.max(0, Number(patch.halftime_pause_seconds))
      : existing.halftime_pause_seconds,
    extra_seconds: Number.isFinite(Number(patch.extra_seconds))
      ? Math.max(0, Number(patch.extra_seconds))
      : existing.extra_seconds,
    extra_elapsed_seconds: Number.isFinite(Number(patch.extra_elapsed_seconds))
      ? Math.max(0, Number(patch.extra_elapsed_seconds))
      : existing.extra_elapsed_seconds,
    is_extra_time: typeof patch.is_extra_time === 'boolean' ? patch.is_extra_time : existing.is_extra_time,
    penalties: patch.penalties ? patch.penalties : existing.penalties ?? { a: [], b: [] },
    tournament_id: patch.tournament_id !== undefined ? patch.tournament_id : existing.tournament_id,
    tournament_name: patch.tournament_name !== undefined ? patch.tournament_name : existing.tournament_name,
    stage_type: patch.stage_type !== undefined ? patch.stage_type : existing.stage_type,
    stage_label: patch.stage_label !== undefined ? patch.stage_label : existing.stage_label,
    schedule_code: patch.schedule_code !== undefined ? (patch.schedule_code || null) : existing.schedule_code
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
  snapshot.teamAId = updated.team_a_id ?? null;
  snapshot.teamBId = updated.team_b_id ?? null;
  snapshot.extraSeconds = updated.extra_seconds;
  snapshot.extraElapsedSeconds = updated.extra_elapsed_seconds;
  snapshot.isExtraTime = updated.is_extra_time;
  snapshot.tournamentId = updated.tournament_id;
  snapshot.tournamentName = updated.tournament_name;
  snapshot.stageType = updated.stage_type;
  snapshot.stageLabel = updated.stage_label;
  snapshot.penalties = updated.penalties;
  snapshot.scheduleCode = updated.schedule_code;

  db.run(
    `UPDATE games SET
      team_a = :team_a,
      team_b = :team_b,
      team_a_id = :team_a_id,
      team_b_id = :team_b_id,
      score_a = :score_a,
      score_b = :score_b,
      duration_seconds = :duration_seconds,
      halftime_seconds = :halftime_seconds,
      halftime_pause_seconds = :halftime_pause_seconds,
      extra_seconds = :extra_seconds,
      extra_elapsed_seconds = :extra_elapsed_seconds,
      is_extra_time = :is_extra_time,
      penalties_json = :penalties_json,
      snapshot_json = :snapshot_json,
      tournament_id = :tournament_id,
      tournament_name = :tournament_name,
      stage_type = :stage_type,
      stage_label = :stage_label,
      schedule_code = :schedule_code
    WHERE id = :id`,
    {
      ':team_a': updated.team_a,
      ':team_b': updated.team_b,
      ':team_a_id': updated.team_a_id,
      ':team_b_id': updated.team_b_id,
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
      ':tournament_id': updated.tournament_id,
      ':tournament_name': updated.tournament_name,
      ':stage_type': updated.stage_type,
      ':stage_label': updated.stage_label,
      ':schedule_code': updated.schedule_code,
      ':id': numeric
    }
  );

  persistDatabase(db, SQL);
  return getGame(numeric);
}

export async function deleteGame(id) {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return false;
  }

  const { SQL, db } = await getConnection();
  const row = await fetchGameRow(db, numeric);
  if (!row) {
    return false;
  }

  db.run('DELETE FROM games WHERE id = ?', [numeric]);
  persistDatabase(db, SQL);
  return true;
}

export async function listGamesByTournament(tournamentId) {
  const numeric = Number(tournamentId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return [];
  }

  const { db } = await getConnection();
  const stmt = db.prepare(
    'SELECT * FROM games WHERE tournament_id = ? ORDER BY datetime(created_at) ASC, id ASC'
  );
  const rows = [];

  try {
    stmt.bind([numeric]);
    while (stmt.step()) {
      rows.push(mapGameRow(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return rows;
}

export { mapGameRow };
