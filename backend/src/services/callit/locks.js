import { addSubscriber } from '../../scoreboard/stateStore.js';
import { queryAll, write } from './db.js';
import { emitCallitUpdate } from './events.js';
import { invalidateTournamentContext } from './context.js';

const enabledTournaments = new Set();
const lockedKeys = new Set();
let lastRunningKey = null;
let lastSignature = null;

export async function refreshEnabledTournaments() {
  const rows = await queryAll('SELECT tournament_id FROM callit_tournaments WHERE enabled = 1');
  enabledTournaments.clear();
  rows.forEach((row) => enabledTournaments.add(Number(row.tournament_id)));
}

export async function loadLocks(tournamentId) {
  const rows = await queryAll('SELECT schedule_code, state, reason, changed_at FROM callit_locks WHERE tournament_id = ?', [tournamentId]);
  return new Map(rows.map((row) => [row.schedule_code, { state: row.state, reason: row.reason, changedAt: row.changed_at }]));
}

export async function setLock(tournamentId, code, state, reason) {
  const key = `${tournamentId}|${code}`;
  if (state === null) {
    await write(['DELETE FROM callit_locks WHERE tournament_id = ? AND schedule_code = ?', [tournamentId, code]]);
    lockedKeys.delete(key);
  } else {
    await write([
      `INSERT INTO callit_locks (tournament_id, schedule_code, state, reason, changed_at) VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(tournament_id, schedule_code) DO UPDATE SET state = excluded.state, reason = excluded.reason, changed_at = excluded.changed_at`,
      [tournamentId, code, state, reason]
    ]);
    if (state === 'locked') lockedKeys.add(key);
    else lockedKeys.delete(key);
  }
  emitCallitUpdate(tournamentId, 'lock');
}

export function isMatchLocked(match, lockRow, settings, now = Date.now()) {
  if (lockRow?.state === 'unlocked') return false;
  if (lockRow?.state === 'locked') return true;
  if (match.result) return true;
  if (settings.locks.atScheduledTime && match.scheduledAt) {
    const time = Date.parse(match.scheduledAt);
    if (!Number.isNaN(time) && time <= now) return true;
  }
  return false;
}

// Anpfiff = Uhr startet für einen Spielplan-Code. Jeder (Wieder-)Start sperrt das Spiel.
export async function handleScoreboardState(state) {
  const tournamentId = Number(state?.tournamentId);
  if (!enabledTournaments.has(tournamentId)) {
    lastRunningKey = null;
    return;
  }
  const runningKey = state.isRunning && state.scheduleCode ? `${tournamentId}|${state.scheduleCode}` : null;
  const kickoff = runningKey && runningKey !== lastRunningKey;
  lastRunningKey = runningKey;

  const signature = [
    tournamentId,
    state.scheduleCode,
    state.scoreA,
    state.scoreB,
    state.isRunning,
    state.isFinished,
    state.savedGameId,
    state.saveState,
    state.scheduleVersion,
    state.shootout?.attempts?.length ?? 0
  ].join('|');
  if (signature !== lastSignature) {
    lastSignature = signature;
    invalidateTournamentContext(tournamentId);
    emitCallitUpdate(tournamentId, 'live');
  }

  if (kickoff && !lockedKeys.has(runningKey)) {
    await setLock(tournamentId, state.scheduleCode, 'locked', 'kickoff');
  }
}

export function resetLockTracking() {
  lockedKeys.clear();
  lastRunningKey = null;
  lastSignature = null;
}

export async function registerCallitScoreboardHook() {
  await refreshEnabledTournaments();
  const rows = await queryAll("SELECT tournament_id, schedule_code FROM callit_locks WHERE state = 'locked'");
  rows.forEach((row) => lockedKeys.add(`${row.tournament_id}|${row.schedule_code}`));
  addSubscriber((state) => {
    handleScoreboardState(state).catch((error) => console.error('[callit] Sperre bei Anpfiff fehlgeschlagen:', error));
  });
}
