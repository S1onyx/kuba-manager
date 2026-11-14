import { CallitError, queryAll, queryOne, write } from './db.js';
import { computeRanking, getConfig, listSpecialsForUser, loadTournamentState } from './index.js';
import { setLock } from './locks.js';
import { specialTypeOf } from './settings.js';
import { isMinuteOfDay } from './time.js';
import { emitCallitUpdate } from './events.js';
import { invalidateTournamentContext, loadTournamentBase } from './context.js';
import { validTipsByMatch } from './scoring.js';
import { getTournament } from '../tournaments/base.js';

export async function getAdminOverview(tournamentId) {
  const tournament = await getTournament(tournamentId);
  if (!tournament) throw new CallitError('CALLIT_TOURNAMENT_NOT_FOUND', 'Turnier nicht gefunden.', 404);
  const config = await getConfig(tournamentId);
  if (!config.enabled) return { config, tournament: { id: tournament.id, name: tournament.name, isPublic: Boolean(tournament.is_public) }, participants: [], matches: [], specials: [] };

  const ranking = await computeRanking(tournamentId, 'total');
  const { state, tips } = ranking;
  const rowsByUser = new Map(ranking.rows.map((row) => [row.userId, row]));
  const allParticipants = await queryAll(
    `SELECT p.user_id, p.joined_at, p.is_disqualified, u.nickname, u.is_banned, u.last_login_at
     FROM callit_participants p JOIN callit_users u ON u.id = p.user_id
     WHERE p.tournament_id = ? ORDER BY lower(u.nickname)`,
    [tournamentId]
  );
  const tipCounts = new Map();
  tips.forEach((tip) => tipCounts.set(tip.userId, (tipCounts.get(tip.userId) ?? 0) + 1));
  const allIds = new Set(allParticipants.map((row) => Number(row.user_id)));
  const buckets = validTipsByMatch(state.matches, tips, allIds);

  return {
    config,
    tournament: { id: tournament.id, name: tournament.name, isPublic: Boolean(tournament.is_public) },
    liveCode: state.liveCode,
    participants: allParticipants.map((row) => {
      const ranked = rowsByUser.get(Number(row.user_id));
      return {
        userId: Number(row.user_id),
        nickname: row.nickname,
        joinedAt: row.joined_at,
        lastLoginAt: row.last_login_at,
        disqualified: Boolean(row.is_disqualified),
        banned: Boolean(row.is_banned),
        tipsCount: tipCounts.get(Number(row.user_id)) ?? 0,
        rank: ranked?.rank ?? null,
        total: ranked?.total ?? null
      };
    }),
    matches: state.matches.map((match) => ({
      code: match.code,
      phase: match.phase,
      stageLabel: match.stageLabel,
      scheduledAt: match.scheduledAt,
      home: match.home?.name ?? match.homeLabel,
      away: match.away?.name ?? match.awayLabel,
      status: match.status,
      locked: match.locked,
      lockReason: match.lockReason,
      unlockedOverride: match.unlockedOverride,
      result: match.result ? { home: match.result.home, away: match.result.away, live: match.result.live } : null,
      tipCount: buckets.get(match.code)?.tips.length ?? 0
    })),
    specials: (await listSpecialsForUser(tournamentId, null)).map((bet) => ({
      betKey: bet.betKey,
      type: bet.type,
      groupLabel: bet.groupLabel,
      locked: bet.locked,
      options: bet.options,
      outcome: bet.outcome,
      override: state.overrides.get(bet.betKey) ?? null
    }))
  };
}

export async function adminSetLock(tournamentId, code, action) {
  const base = await loadTournamentBase(tournamentId);
  if (!base?.matches.some((match) => match.code === code)) throw new CallitError('CALLIT_MATCH_NOT_FOUND', 'Spiel nicht gefunden.', 404);
  const target = action === 'lock' ? 'locked' : action === 'unlock' ? 'unlocked' : action === 'auto' ? null : undefined;
  if (target === undefined) throw new CallitError('CALLIT_INVALID_ACTION', 'Ungültige Aktion.');
  await setLock(tournamentId, code, target, target ? 'manual' : null);
}

export async function adminListMatchTips(tournamentId, code) {
  const state = await loadTournamentState(tournamentId);
  const match = state.matches.find((entry) => entry.code === code);
  if (!match) throw new CallitError('CALLIT_MATCH_NOT_FOUND', 'Spiel nicht gefunden.', 404);
  const rows = await queryAll(
    `SELECT t.*, u.nickname FROM callit_tips t JOIN callit_users u ON u.id = t.user_id
     WHERE t.tournament_id = ? AND t.schedule_code = ? ORDER BY lower(u.nickname)`,
    [tournamentId, code]
  );
  return rows.map((row) => ({
    userId: Number(row.user_id),
    nickname: row.nickname,
    scoreHome: Number(row.score_home),
    scoreAway: Number(row.score_away),
    advance: row.advance || null,
    isJoker: Boolean(row.is_joker),
    stale: !(match.home && match.away && row.home_key === match.home.key && row.away_key === match.away.key),
    updatedAt: row.updated_at
  }));
}

export async function adminSetSpecialOverride(tournamentId, betKey, value) {
  const type = specialTypeOf(betKey);
  if (!type) throw new CallitError('CALLIT_BET_NOT_FOUND', 'Sonderwette nicht gefunden.', 404);
  if (value === null || value === undefined) {
    await write(['DELETE FROM callit_special_results WHERE tournament_id = ? AND bet_key = ?', [tournamentId, betKey]]);
  } else {
    let normalized;
    if (type === 'total_baskets') {
      const numeric = Number(value.value);
      if (!Number.isInteger(numeric) || numeric < 0) throw new CallitError('CALLIT_INVALID_VALUE', 'Ungültiger Wert.');
      normalized = { value: numeric };
    } else if (type === 'final_kickoff') {
      const numeric = Number(value.value);
      if (!isMinuteOfDay(numeric)) throw new CallitError('CALLIT_INVALID_VALUE', 'Ungültige Uhrzeit.');
      normalized = { value: numeric };
    } else {
      const keys = (Array.isArray(value.keys) ? value.keys : []).map(String).filter(Boolean).slice(0, 20);
      if (keys.length === 0) throw new CallitError('CALLIT_INVALID_VALUE', 'Bitte mindestens einen Treffer wählen.');
      normalized = { keys };
    }
    await write([
      `INSERT INTO callit_special_results (tournament_id, bet_key, value_json, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(tournament_id, bet_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      [tournamentId, betKey, JSON.stringify(normalized)]
    ]);
  }
  invalidateTournamentContext(tournamentId);
  emitCallitUpdate(tournamentId, 'specials');
}

export async function adminSetDisqualified(tournamentId, userId, disqualified) {
  const { changes } = await write([
    'UPDATE callit_participants SET is_disqualified = ? WHERE tournament_id = ? AND user_id = ?',
    [disqualified ? 1 : 0, tournamentId, userId]
  ]);
  if (!changes) throw new CallitError('CALLIT_USER_NOT_FOUND', 'Teilnehmer nicht gefunden.', 404);
  emitCallitUpdate(tournamentId, 'participants');
}

export async function adminRemoveParticipant(tournamentId, userId) {
  await write([
    ['DELETE FROM callit_tips WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId]],
    ['DELETE FROM callit_special_tips WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId]],
    ['DELETE FROM callit_participants WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId]]
  ]);
  emitCallitUpdate(tournamentId, 'participants');
}

export async function adminFindUser(userId) {
  const user = await queryOne('SELECT id, nickname, is_banned FROM callit_users WHERE id = ?', [userId]);
  if (!user) throw new CallitError('CALLIT_USER_NOT_FOUND', 'Nutzer nicht gefunden.', 404);
  return user;
}

const csvCell = (value) => {
  const text = String(value ?? '');
  // Formel-Injection in Tabellenprogrammen verhindern
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export async function adminExportCsv(tournamentId) {
  const ranking = await computeRanking(tournamentId, 'total');
  const header = ['Platz', 'Nickname', 'Gesamt', 'Spiele', 'Sonderwetten', 'Exakt', 'Differenz', 'Tendenz', 'Underdog', 'Tipps'];
  const lines = ranking.rows.map((row) =>
    [row.rank, row.nickname, row.total, row.matchPoints, row.specialPoints, row.exact, row.diff, row.tendency, row.underdogHits, row.tipsCount]
      .map(csvCell)
      .join(';')
  );
  return `\uFEFF${[header.join(';'), ...lines].join('\n')}\n`;
}
