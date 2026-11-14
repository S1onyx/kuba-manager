import { addSubscriber, getState } from '../../scoreboard/stateStore.js';
import { queryAll, write } from './db.js';
import { emitCallitUpdate } from './events.js';
import { invalidateTournamentContext } from './context.js';

const enabledTournaments = new Set();
const lockedKeys = new Set();
const unlockedKeys = new Set();
const kickoffKeys = new Set();
let lastRunningKey = null;
let lastSignature = null;
let lastTournamentId = null;

const lockKey = (tournamentId, code) => `${Number(tournamentId)}|${code}`;

export async function refreshEnabledTournaments() {
  const rows = await queryAll('SELECT tournament_id FROM callit_tournaments WHERE enabled = 1');
  enabledTournaments.clear();
  rows.forEach((row) => enabledTournaments.add(Number(row.tournament_id)));
}

export async function loadLocks(tournamentId) {
  const rows = await queryAll('SELECT schedule_code, state, reason, changed_at FROM callit_locks WHERE tournament_id = ?', [tournamentId]);
  return new Map(rows.map((row) => [row.schedule_code, { state: row.state, reason: row.reason, changedAt: row.changed_at }]));
}

export async function loadKickoffs(tournamentId) {
  const rows = await queryAll('SELECT schedule_code, started_at FROM callit_kickoffs WHERE tournament_id = ?', [tournamentId]);
  return new Map(rows.map((row) => [row.schedule_code, row.started_at]));
}

// Erster Uhr-Start eines Spiels = tatsächliche Anpfiffzeit (z. B. für die Sonderwette Finale-Startzeit).
async function recordKickoff(tournamentId, code) {
  const key = lockKey(tournamentId, code);
  if (kickoffKeys.has(key)) return;
  kickoffKeys.add(key);
  await write([
    'INSERT OR IGNORE INTO callit_kickoffs (tournament_id, schedule_code, started_at) VALUES (?, ?, ?)',
    [tournamentId, code, new Date().toISOString()]
  ]);
}

export async function setLock(tournamentId, code, state, reason) {
  const key = lockKey(tournamentId, code);
  if (state === null) {
    await write(['DELETE FROM callit_locks WHERE tournament_id = ? AND schedule_code = ?', [tournamentId, code]]);
  } else {
    await write([
      `INSERT INTO callit_locks (tournament_id, schedule_code, state, reason, changed_at) VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(tournament_id, schedule_code) DO UPDATE SET state = excluded.state, reason = excluded.reason, changed_at = excluded.changed_at`,
      [tournamentId, code, state, reason]
    ]);
  }
  lockedKeys.delete(key);
  unlockedKeys.delete(key);
  if (state === 'locked') lockedKeys.add(key);
  if (state === 'unlocked') unlockedKeys.add(key);
  emitCallitUpdate(tournamentId, 'lock');
}

// Läuft die Uhr gerade für genau dieses Spiel? Synchrone Prüfung gegen Anpfiff-Races.
export function isRunningOnScoreboard(tournamentId, code, state = getState()) {
  return Boolean(state && Number(state.tournamentId) === Number(tournamentId) && state.scheduleCode === code && state.isRunning);
}

// Gespeichertes Ergebnis sperrt immer. Manuelles Entsperren hebt Anpfiff-, Live- und Uhrzeit-Sperre auf.
export function isMatchLocked(match, lockRow, settings, now = Date.now()) {
  if (match.result?.saved) return true;
  if (lockRow?.state === 'unlocked') return false;
  if (lockRow?.state === 'locked') return true;
  if (match.result) return true;
  if (settings.locks.atScheduledTime && match.scheduledAt) {
    const time = Date.parse(match.scheduledAt);
    if (!Number.isNaN(time) && time <= now) return true;
  }
  return false;
}

// Anpfiff = Uhr startet für einen Spielplan-Code (Scoreboard-Zustand ist nicht persistent, nach einem
// Neustart läuft keine Uhr). Ein manuelles Entsperren gilt, bis das Scoreboard ein anderes Spiel lädt.
export async function handleScoreboardState(state) {
  const tournamentId = Number(state?.tournamentId);
  const runningKey = state?.isRunning && state.scheduleCode ? lockKey(tournamentId, state.scheduleCode) : null;
  if (lastTournamentId !== null && lastTournamentId !== tournamentId && enabledTournaments.has(lastTournamentId)) {
    // Scoreboard hat das Turnier verlassen: Live-Stand des alten Turniers ist vorbei.
    invalidateTournamentContext(lastTournamentId);
    emitCallitUpdate(lastTournamentId, 'live');
  }
  lastTournamentId = tournamentId;
  if (!enabledTournaments.has(tournamentId)) {
    lastRunningKey = runningKey;
    return;
  }
  const kickoff = runningKey && runningKey !== lastRunningKey;
  lastRunningKey = runningKey;
  if (kickoff) await recordKickoff(tournamentId, state.scheduleCode);

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
  if (signature === lastSignature && !kickoff) return;
  lastSignature = signature;
  invalidateTournamentContext(tournamentId);
  emitCallitUpdate(tournamentId, 'live');

  const currentKey = state.scheduleCode ? lockKey(tournamentId, state.scheduleCode) : null;
  for (const key of Array.from(unlockedKeys)) {
    const [keyTournament, ...codeParts] = key.split('|');
    if (Number(keyTournament) === tournamentId && key !== currentKey) {
      await setLock(tournamentId, codeParts.join('|'), null, null);
    }
  }

  if (kickoff && !lockedKeys.has(runningKey) && !unlockedKeys.has(runningKey)) {
    await setLock(tournamentId, state.scheduleCode, 'locked', 'kickoff');
  }
}

export function resetLockTracking() {
  lockedKeys.clear();
  unlockedKeys.clear();
  kickoffKeys.clear();
  lastRunningKey = null;
  lastSignature = null;
  lastTournamentId = null;
}

export async function registerCallitScoreboardHook() {
  await refreshEnabledTournaments();
  const rows = await queryAll('SELECT tournament_id, schedule_code, state FROM callit_locks');
  rows.forEach((row) => {
    const key = lockKey(row.tournament_id, row.schedule_code);
    if (row.state === 'locked') lockedKeys.add(key);
    if (row.state === 'unlocked') unlockedKeys.add(key);
  });
  const kickoffs = await queryAll('SELECT tournament_id, schedule_code FROM callit_kickoffs');
  kickoffs.forEach((row) => kickoffKeys.add(lockKey(row.tournament_id, row.schedule_code)));
  addSubscriber((state) => {
    handleScoreboardState(state).catch((error) => console.error('[callit] Sperre bei Anpfiff fehlgeschlagen:', error));
  });
}
