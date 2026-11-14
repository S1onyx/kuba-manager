import { getScoreboardState } from '../../scoreboard/index.js';
import { getTournament } from '../tournaments/base.js';
import { CallitError, parseJson, queryAll, queryOne, write } from './db.js';
import { DEFAULT_SETTINGS, NEAREST_BET_TYPES, SPECIAL_BET_TYPES, normalizeSettings, specialTypeOf } from './settings.js';
import { formatClock, isMinuteOfDay } from './time.js';
import { computeStandings, isTipValidForMatch, phaseGroupOf, rankRows, scoreMatchTip, scoreSpecials, validTipsByMatch, tendency } from './scoring.js';
import { applyLiveState, deriveSpecialOutcomes, invalidateTournamentContext, loadTournamentBase } from './context.js';
import { isMatchLocked, isRunningOnScoreboard, loadKickoffs, loadLocks, refreshEnabledTournaments } from './locks.js';
import { emitCallitUpdate, tournamentVersion } from './events.js';

const MAX_SCORE = 99;
const MAX_TOTAL_BASKETS = 100000;

function mapConfig(row, tournamentId) {
  return {
    tournamentId: Number(tournamentId),
    enabled: Boolean(row?.enabled),
    registrationOpen: row ? Boolean(row.registration_open) : true,
    joinCode: row?.join_code || null,
    settings: normalizeSettings(parseJson(row?.settings_json, DEFAULT_SETTINGS)),
    rulesText: row?.rules_text ?? '',
    updatedAt: row?.updated_at ?? null
  };
}

export async function getConfig(tournamentId) {
  const row = await queryOne('SELECT * FROM callit_tournaments WHERE tournament_id = ?', [tournamentId]);
  return mapConfig(row, tournamentId);
}

export async function updateConfig(tournamentId, patch = {}) {
  const tournament = await getTournament(tournamentId);
  if (!tournament) throw new CallitError('CALLIT_TOURNAMENT_NOT_FOUND', 'Turnier nicht gefunden.', 404);
  const current = await getConfig(tournamentId);
  const joinCode = patch.joinCode === undefined ? current.joinCode : String(patch.joinCode ?? '').trim().slice(0, 40) || null;
  const next = {
    enabled: patch.enabled === undefined ? current.enabled : Boolean(patch.enabled),
    registrationOpen: patch.registrationOpen === undefined ? current.registrationOpen : Boolean(patch.registrationOpen),
    joinCode,
    settings: patch.settings === undefined ? current.settings : normalizeSettings(patch.settings),
    rulesText: patch.rulesText === undefined ? current.rulesText : String(patch.rulesText ?? '').slice(0, 5000)
  };
  await write([
    `INSERT INTO callit_tournaments (tournament_id, enabled, registration_open, join_code, settings_json, rules_text, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(tournament_id) DO UPDATE SET enabled = excluded.enabled, registration_open = excluded.registration_open,
       join_code = excluded.join_code, settings_json = excluded.settings_json, rules_text = excluded.rules_text, updated_at = excluded.updated_at`,
    [tournamentId, next.enabled ? 1 : 0, next.registrationOpen ? 1 : 0, next.joinCode, JSON.stringify(next.settings), next.rulesText]
  ]);
  await refreshEnabledTournaments();
  invalidateTournamentContext(tournamentId);
  emitCallitUpdate(tournamentId, 'config');
  return getConfig(tournamentId);
}

async function requireEnabled(tournamentId) {
  const config = await getConfig(tournamentId);
  const tournament = config.enabled ? await getTournament(tournamentId) : null;
  if (!tournament) throw new CallitError('CALLIT_NOT_AVAILABLE', 'Für dieses Turnier gibt es kein Tippspiel.', 404);
  return { config, tournament };
}

export async function listEnabledTournaments() {
  const rows = await queryAll(
    `SELECT c.tournament_id, t.name, t.status, t.is_completed, t.is_public, t.planned_at, t.location,
       (SELECT COUNT(*) FROM callit_participants p WHERE p.tournament_id = c.tournament_id AND p.is_disqualified = 0) AS participant_count
     FROM callit_tournaments c JOIN tournaments t ON t.id = c.tournament_id
     WHERE c.enabled = 1 AND t.is_public = 1
     ORDER BY t.is_completed ASC, datetime(t.planned_at) DESC, t.id DESC`
  );
  return rows.map((row) => ({
    id: row.tournament_id,
    name: row.name,
    status: row.status ?? 'active',
    isCompleted: Boolean(row.is_completed),
    isPublic: Boolean(row.is_public),
    plannedAt: row.planned_at ?? null,
    location: row.location ?? null,
    participantCount: Number(row.participant_count ?? 0)
  }));
}

export async function getParticipant(tournamentId, userId) {
  if (!userId) return null;
  return queryOne('SELECT * FROM callit_participants WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId]);
}

export async function joinTournament(tournamentId, user, joinCode) {
  const { config } = await requireEnabled(tournamentId);
  const existing = await getParticipant(tournamentId, user.id);
  if (existing) return { joined: true, disqualified: Boolean(existing.is_disqualified) };
  if (!config.registrationOpen) throw new CallitError('CALLIT_REGISTRATION_CLOSED', 'Die Anmeldung ist geschlossen.', 403);
  if (config.joinCode && String(joinCode ?? '').trim().toLowerCase() !== config.joinCode.toLowerCase()) {
    throw new CallitError('CALLIT_INVALID_JOIN_CODE', 'Beitrittscode ist falsch.', 403);
  }
  await write(['INSERT OR IGNORE INTO callit_participants (tournament_id, user_id) VALUES (?, ?)', [tournamentId, user.id]]);
  emitCallitUpdate(tournamentId, 'participants');
  return { joined: true, disqualified: false };
}

async function activeParticipants(tournamentId) {
  const rows = await queryAll(
    `SELECT p.user_id, u.nickname FROM callit_participants p JOIN callit_users u ON u.id = p.user_id
     WHERE p.tournament_id = ? AND p.is_disqualified = 0 AND u.is_banned = 0`,
    [tournamentId]
  );
  return rows.map((row) => ({ userId: Number(row.user_id), nickname: row.nickname }));
}

function mapTip(row) {
  return {
    userId: Number(row.user_id),
    code: row.schedule_code,
    scoreHome: Number(row.score_home),
    scoreAway: Number(row.score_away),
    advance: row.advance || null,
    isJoker: Boolean(row.is_joker),
    homeKey: row.home_key,
    awayKey: row.away_key,
    updatedAt: row.updated_at
  };
}

async function loadTips(tournamentId, userId) {
  const rows = userId
    ? await queryAll('SELECT * FROM callit_tips WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId])
    : await queryAll('SELECT * FROM callit_tips WHERE tournament_id = ?', [tournamentId]);
  return rows.map(mapTip);
}

async function loadSpecialTips(tournamentId, userId) {
  const rows = userId
    ? await queryAll('SELECT * FROM callit_special_tips WHERE tournament_id = ? AND user_id = ?', [tournamentId, userId])
    : await queryAll('SELECT * FROM callit_special_tips WHERE tournament_id = ?', [tournamentId]);
  return rows.map((row) => ({ userId: Number(row.user_id), betKey: row.bet_key, value: parseJson(row.value_json, null), updatedAt: row.updated_at }));
}

async function loadOverrides(tournamentId) {
  const rows = await queryAll('SELECT bet_key, value_json FROM callit_special_results WHERE tournament_id = ?', [tournamentId]);
  return new Map(rows.map((row) => [row.bet_key, parseJson(row.value_json, null)]));
}

function specialBetsFor(base, settings) {
  const bets = [];
  const enabled = (type) => settings.specials[type].enabled;
  if (enabled('winner')) bets.push({ betKey: 'winner', type: 'winner' });
  if (enabled('group_winner')) base.groups.forEach((group) => bets.push({ betKey: group.betKey, type: 'group_winner', group }));
  if (enabled('top_scorer')) bets.push({ betKey: 'top_scorer', type: 'top_scorer' });
  if (enabled('most_penalty_seconds')) bets.push({ betKey: 'most_penalty_seconds', type: 'most_penalty_seconds' });
  if (enabled('total_baskets')) bets.push({ betKey: 'total_baskets', type: 'total_baskets' });
  const finalMatch = base.matches.find((match) => match.isFinal);
  if (enabled('final_kickoff') && finalMatch) bets.push({ betKey: 'final_kickoff', type: 'final_kickoff', scheduledAt: finalMatch.scheduledAt });
  return bets;
}

function optionsFor(bet, base) {
  const teamByKey = new Map(base.teams.map((team) => [team.key, team]));
  if (bet.type === 'winner') return base.teams.map((team) => ({ key: team.key, label: team.name }));
  if (bet.type === 'group_winner') {
    return bet.group.teamKeys.map((key) => ({ key, label: teamByKey.get(key)?.name ?? key.replace(/^name:/, '') }));
  }
  if (NEAREST_BET_TYPES.includes(bet.type)) return [];
  return base.players.map((player) => ({
    key: player.key,
    label: player.name,
    sub: [player.jerseyNumber != null ? `#${player.jerseyNumber}` : null, player.teamName].filter(Boolean).join(' · ')
  }));
}

// Kompletter, konsistenter Stand eines Turniers: Spielplan + Live-Stand + Sperren + Sonderwetten.
export async function loadTournamentState(tournamentId, now = Date.now()) {
  const { config, tournament } = await requireEnabled(tournamentId);
  const [base, locks, overrides, kickoffs] = await Promise.all([
    loadTournamentBase(tournamentId, now),
    loadLocks(tournamentId),
    loadOverrides(tournamentId),
    loadKickoffs(tournamentId)
  ]);
  const { settings } = config;
  const scoreboardState = getScoreboardState();
  const { matches: liveMatches, liveCode } = applyLiveState(base.matches, scoreboardState, tournamentId, base.resolveKey);
  const matches = liveMatches.map((match) => {
    const lockRow = locks.get(match.code);
    const known = Boolean(match.home && match.away);
    const locked = isMatchLocked(match, lockRow, settings, now) || isRunningOnScoreboard(tournamentId, match.code, scoreboardState);
    const status = !known ? 'pending' : !locked ? 'open' : match.result?.live ? 'live' : match.result ? 'finished' : 'locked';
    return { ...match, locked, lockReason: lockRow?.state === 'locked' ? lockRow.reason : null, unlockedOverride: lockRow?.state === 'unlocked', status };
  });
  const started =
    matches.some((match) => match.result) ||
    Array.from(locks.values()).some((lock) => lock.state === 'locked' && lock.reason === 'kickoff');
  const specialLocked = (type) => {
    const deadline = settings.specials[type]?.deadline;
    if (deadline) return Date.parse(deadline) <= now;
    return started;
  };
  const outcomes = deriveSpecialOutcomes({ tournament, summary: base.summary, matches, groups: base.groups, kickoffs, overrides, resolveKey: base.resolveKey });
  const bets = specialBetsFor(base, settings).map((bet) => ({ ...bet, locked: specialLocked(bet.type) }));
  // Turnier fertig: als abgeschlossen markiert oder jedes Spiel hat ein gespeichertes Ergebnis.
  const finished = Boolean(tournament.is_completed) || (matches.length > 0 && matches.every((match) => match.result?.saved));
  return { config, settings, tournament, base, matches, liveCode, outcomes, bets, overrides, now, finished };
}

function publicMatch(match) {
  return {
    code: match.code,
    phase: match.phase,
    stageLabel: match.stageLabel,
    stageLabelI18n: match.stageLabelI18n,
    group: match.group,
    scheduledAt: match.scheduledAt,
    isFinal: match.isFinal,
    home: match.home ? { key: match.home.key, name: match.home.name } : null,
    away: match.away ? { key: match.away.key, name: match.away.name } : null,
    homeLabel: match.homeLabel,
    awayLabel: match.awayLabel,
    status: match.status,
    locked: match.locked,
    result: match.result
      ? { home: match.result.home, away: match.result.away, winner: match.result.winner, live: match.result.live, shootout: match.result.shootout }
      : null
  };
}

function sortMatches(matches) {
  return matches.slice().sort((a, b) => {
    const ta = a.scheduledAt ? Date.parse(a.scheduledAt) : Infinity;
    const tb = b.scheduledAt ? Date.parse(b.scheduledAt) : Infinity;
    if (ta !== tb) return ta - tb;
    for (let i = 0; i < 3; i += 1) if (a.order[i] !== b.order[i]) return a.order[i] - b.order[i];
    return String(a.code).localeCompare(String(b.code));
  });
}

function publicSettings(settings) {
  return { points: settings.points, multipliers: settings.multipliers, joker: settings.joker, underdog: settings.underdog, specials: settings.specials };
}

export async function getTournamentInfo(tournamentId, user) {
  const state = await loadTournamentState(tournamentId);
  const participant = user ? await getParticipant(tournamentId, user.id) : null;
  const participants = await activeParticipants(tournamentId);
  return {
    tournament: { id: state.tournament.id, name: state.tournament.name, isCompleted: Boolean(state.tournament.is_completed), location: state.tournament.location ?? null },
    registrationOpen: state.config.registrationOpen,
    requiresJoinCode: Boolean(state.config.joinCode),
    rulesText: state.config.rulesText,
    settings: publicSettings(state.settings),
    participantCount: participants.length,
    participant: participant ? { joined: true, disqualified: Boolean(participant.is_disqualified), joinedAt: participant.joined_at } : null,
    liveCode: state.liveCode,
    finished: state.finished
  };
}

function jokerUsage(state, tips) {
  const usage = { group: { used: 0, total: state.settings.joker.perPhase }, ko: { used: 0, total: state.settings.joker.perPhase } };
  const byCode = new Map(state.matches.map((match) => [match.code, match]));
  tips.forEach((tip) => {
    const match = byCode.get(tip.code);
    if (tip.isJoker && match) usage[phaseGroupOf(match)].used += 1;
  });
  return { enabled: state.settings.joker.enabled, ...usage };
}

export async function listMatchesForUser(tournamentId, user) {
  const state = await loadTournamentState(tournamentId);
  const participants = await activeParticipants(tournamentId);
  const activeIds = new Set(participants.map((p) => p.userId));
  const allTips = await loadTips(tournamentId);
  const buckets = validTipsByMatch(state.matches, allTips, activeIds);
  const myTips = new Map(allTips.filter((tip) => tip.userId === user?.id).map((tip) => [tip.code, tip]));

  const matches = sortMatches(state.matches).map((match) => {
    const bucket = buckets.get(match.code);
    const mine = myTips.get(match.code);
    const valid = mine && bucket.tips.includes(mine);
    const stale = Boolean(mine && !valid && match.home && match.away);
    const score = valid && match.result ? scoreMatchTip(mine, match, { settings: state.settings, shares: bucket.shares }) : null;
    return {
      ...publicMatch(match),
      tipCount: bucket.tips.length,
      myTip: mine && !stale ? { scoreHome: mine.scoreHome, scoreAway: mine.scoreAway, advance: mine.advance, isJoker: mine.isJoker, updatedAt: mine.updatedAt } : null,
      myTipStale: stale,
      myPoints: score
    };
  });
  const open = matches.filter((match) => match.status === 'open');
  const openWithoutTip = open.filter((match) => !match.myTip);
  const mySpecialKeys = new Set(user ? (await loadSpecialTips(tournamentId, user.id)).map((tip) => tip.betKey) : []);
  const openSpecials = state.bets.filter((bet) => !bet.locked && !mySpecialKeys.has(bet.betKey)).length;
  return {
    matches,
    liveCode: state.liveCode,
    jokers: jokerUsage(state, Array.from(myTips.values()).filter((tip) => {
      const bucket = buckets.get(tip.code);
      return bucket?.tips.includes(tip);
    })),
    openCount: openWithoutTip.length + openSpecials,
    openMatchCount: openWithoutTip.length,
    openSpecialCount: openSpecials,
    nextOpen: openWithoutTip[0] ? { code: openWithoutTip[0].code, scheduledAt: openWithoutTip[0].scheduledAt } : null
  };
}

function parseScore(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 && numeric <= MAX_SCORE ? numeric : null;
}

async function requireActiveParticipant(tournamentId, user) {
  const participant = await getParticipant(tournamentId, user.id);
  if (!participant) throw new CallitError('CALLIT_NOT_JOINED', 'Bitte zuerst dem Tippspiel beitreten.', 403);
  if (participant.is_disqualified) throw new CallitError('CALLIT_DISQUALIFIED', 'Du bist von diesem Tippspiel ausgeschlossen.', 403);
  return participant;
}

export async function submitTip(tournamentId, user, code, payload = {}) {
  await requireActiveParticipant(tournamentId, user);
  const state = await loadTournamentState(tournamentId);
  const match = state.matches.find((entry) => entry.code === code);
  if (!match) throw new CallitError('CALLIT_MATCH_NOT_FOUND', 'Spiel nicht gefunden.', 404);
  if (match.status === 'pending') throw new CallitError('CALLIT_MATCH_PENDING', 'Die Teams stehen noch nicht fest.', 409);
  if (match.locked) throw new CallitError('CALLIT_MATCH_LOCKED', 'Das Spiel hat bereits begonnen.', 409);

  const scoreHome = parseScore(payload.scoreHome);
  const scoreAway = parseScore(payload.scoreAway);
  if (scoreHome === null || scoreAway === null) throw new CallitError('CALLIT_INVALID_SCORE', `Spielstand muss zwischen 0 und ${MAX_SCORE} liegen.`);
  const isKoDraw = match.phase !== 'group' && scoreHome === scoreAway;
  const advance = isKoDraw ? payload.advance : null;
  if (isKoDraw && advance !== 'home' && advance !== 'away') {
    throw new CallitError('CALLIT_ADVANCE_REQUIRED', 'Bei Unentschieden im KO-Spiel bitte wählen, wer weiterkommt.');
  }

  const wantsJoker = Boolean(payload.isJoker) && state.settings.joker.enabled;
  const statements = [];
  if (wantsJoker) {
    const phase = phaseGroupOf(match);
    const myTips = await loadTips(tournamentId, user.id);
    const byCode = new Map(state.matches.map((entry) => [entry.code, entry]));
    const otherJokers = myTips.filter(
      (tip) => tip.isJoker && tip.code !== code && isTipValidForMatch(tip, byCode.get(tip.code)) && phaseGroupOf(byCode.get(tip.code)) === phase
    );
    if (otherJokers.length >= state.settings.joker.perPhase) {
      const movable = otherJokers.find((tip) => !byCode.get(tip.code).locked);
      if (!movable) throw new CallitError('CALLIT_JOKER_USED', 'Joker für diese Phase bereits eingesetzt.', 409);
      statements.push(['UPDATE callit_tips SET is_joker = 0 WHERE tournament_id = ? AND user_id = ? AND schedule_code = ?', [tournamentId, user.id, movable.code]]);
    }
  }

  if (isRunningOnScoreboard(tournamentId, code)) {
    throw new CallitError('CALLIT_MATCH_LOCKED', 'Das Spiel hat bereits begonnen.', 409);
  }
  statements.push([
    `INSERT INTO callit_tips (tournament_id, user_id, schedule_code, score_home, score_away, advance, is_joker, home_key, away_key, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(tournament_id, user_id, schedule_code) DO UPDATE SET score_home = excluded.score_home, score_away = excluded.score_away,
       advance = excluded.advance, is_joker = excluded.is_joker, home_key = excluded.home_key, away_key = excluded.away_key, updated_at = excluded.updated_at`,
    [tournamentId, user.id, code, scoreHome, scoreAway, advance, wantsJoker ? 1 : 0, match.home.key, match.away.key]
  ]);
  await write(statements);
  emitCallitUpdate(tournamentId, 'tips');
  return { code, scoreHome, scoreAway, advance, isJoker: wantsJoker };
}

export async function deleteTip(tournamentId, user, code) {
  await requireActiveParticipant(tournamentId, user);
  const state = await loadTournamentState(tournamentId);
  const match = state.matches.find((entry) => entry.code === code);
  if (!match) throw new CallitError('CALLIT_MATCH_NOT_FOUND', 'Spiel nicht gefunden.', 404);
  if (match.locked || isRunningOnScoreboard(tournamentId, code)) {
    throw new CallitError('CALLIT_MATCH_LOCKED', 'Das Spiel hat bereits begonnen.', 409);
  }
  await write(['DELETE FROM callit_tips WHERE tournament_id = ? AND user_id = ? AND schedule_code = ?', [tournamentId, user.id, code]]);
  emitCallitUpdate(tournamentId, 'tips');
}

// Zahlenwert-Wetten als Text: Gesamtpunkte als Zahl, Finale-Startzeit als HH:MM.
const formatNearest = (type, value) => (type === 'final_kickoff' ? formatClock(value) : String(value));

function describeValue(bet, value, base) {
  if (!value) return null;
  if (NEAREST_BET_TYPES.includes(bet.type)) return formatNearest(bet.type, value.value);
  return optionsFor(bet, base).find((option) => option.key === String(value.key))?.label ?? null;
}

function describeOutcome(bet, outcome, base) {
  if (!outcome) return null;
  if (NEAREST_BET_TYPES.includes(bet.type)) return { value: outcome.value, final: outcome.final, labels: [formatNearest(bet.type, outcome.value)] };
  const options = optionsFor(bet, base);
  return {
    keys: outcome.keys,
    final: outcome.final,
    labels: outcome.keys.map((key) => options.find((option) => option.key === key)?.label ?? key.replace(/^name:/, ''))
  };
}

export async function listSpecialsForUser(tournamentId, user) {
  const state = await loadTournamentState(tournamentId);
  const myTips = user ? await loadSpecialTips(tournamentId, user.id) : [];
  const myScores = scoreSpecials(myTips, state.outcomes, state.settings).get(user?.id);
  return state.bets.map((bet) => {
    const mine = myTips.find((tip) => tip.betKey === bet.betKey);
    const config = state.settings.specials[bet.type];
    return {
      betKey: bet.betKey,
      type: bet.type,
      groupLabel: bet.group?.label ?? null,
      ...(bet.type === 'final_kickoff' ? { scheduledAt: bet.scheduledAt ?? null } : {}),
      points: config.points,
      deadline: config.deadline,
      locked: bet.locked,
      options: optionsFor(bet, state.base),
      myValue: mine?.value ?? null,
      myLabel: describeValue(bet, mine?.value, state.base),
      outcome: describeOutcome(bet, state.outcomes.get(bet.betKey), state.base),
      myPoints: myScores?.bets?.[bet.betKey] ?? null
    };
  });
}

export async function submitSpecialTip(tournamentId, user, betKey, value) {
  await requireActiveParticipant(tournamentId, user);
  const state = await loadTournamentState(tournamentId);
  const bet = state.bets.find((entry) => entry.betKey === betKey);
  if (!bet || !specialTypeOf(betKey)) throw new CallitError('CALLIT_BET_NOT_FOUND', 'Sonderwette nicht gefunden.', 404);
  if (bet.locked) throw new CallitError('CALLIT_BET_LOCKED', 'Diese Sonderwette ist bereits geschlossen.', 409);
  let normalized;
  if (bet.type === 'total_baskets') {
    const numeric = Number(value?.value);
    if (!Number.isInteger(numeric) || numeric < 0 || numeric > MAX_TOTAL_BASKETS) throw new CallitError('CALLIT_INVALID_VALUE', 'Bitte eine ganze Zahl eingeben.');
    normalized = { value: numeric };
  } else if (bet.type === 'final_kickoff') {
    const numeric = Number(value?.value);
    if (!isMinuteOfDay(numeric)) throw new CallitError('CALLIT_INVALID_VALUE', 'Bitte eine Uhrzeit (HH:MM) eingeben.');
    normalized = { value: numeric };
  } else {
    const key = String(value?.key ?? '');
    if (!optionsFor(bet, state.base).some((option) => option.key === key)) throw new CallitError('CALLIT_INVALID_VALUE', 'Ungültige Auswahl.');
    normalized = { key };
  }
  await write([
    `INSERT INTO callit_special_tips (tournament_id, user_id, bet_key, value_json, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(tournament_id, user_id, bet_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
    [tournamentId, user.id, betKey, JSON.stringify(normalized)]
  ]);
  emitCallitUpdate(tournamentId, 'specials');
  return { betKey, value: normalized };
}

function latestCode(state) {
  if (state.liveCode) return state.liveCode;
  const finished = state.matches.filter((match) => match.result?.saved && match.result.finishedAt);
  finished.sort((a, b) => Date.parse(b.result.finishedAt) - Date.parse(a.result.finishedAt));
  return finished[0]?.code ?? null;
}

const RANKING_TTL_MS = 2000;
const rankingCache = new Map();

// Kurzer Cache: Beamer, Public-Seite und viele Handys fragen gleichzeitig dasselbe Ranking ab.
export async function computeRanking(tournamentId, category = 'total') {
  const key = `${Number(tournamentId)}|${category}`;
  const version = tournamentVersion(tournamentId);
  const cached = rankingCache.get(key);
  if (cached && cached.version === version && cached.at + RANKING_TTL_MS > Date.now()) return cached.promise;
  const promise = computeRankingUncached(tournamentId, category).catch((error) => {
    rankingCache.delete(key);
    throw error;
  });
  rankingCache.set(key, { version, at: Date.now(), promise });
  return promise;
}

async function computeRankingUncached(tournamentId, category) {
  const state = await loadTournamentState(tournamentId);
  const [participants, tips, specialTips] = await Promise.all([activeParticipants(tournamentId), loadTips(tournamentId), loadSpecialTips(tournamentId)]);
  const input = { participants, matches: state.matches.filter((match) => match.locked), tips, specialTips, specialOutcomes: state.outcomes, settings: state.settings };
  const rows = rankRows(computeStandings(input), category);
  const previousCode = latestCode(state);
  const previous = previousCode ? rankRows(computeStandings({ ...input, excludeCodes: new Set([previousCode]) }), category) : null;
  const previousRank = new Map((previous ?? []).map((row) => [row.userId, row.rank]));
  const liveMatch = state.liveCode ? state.matches.find((match) => match.code === state.liveCode) : null;
  return {
    category,
    live: Boolean(state.liveCode),
    liveMatch: liveMatch ? publicMatch(liveMatch) : null,
    comparedTo: previousCode,
    participantCount: participants.length,
    rows: rows.map((row) => ({ ...row, delta: previous ? previousRank.get(row.userId) - row.rank : 0 })),
    state,
    tips,
    specialTips,
    participants
  };
}

export async function getRanking(tournamentId, category = 'total') {
  const { state, tips, specialTips, participants, ...ranking } = await computeRanking(tournamentId, category);
  return { ...ranking, updatedAt: new Date().toISOString() };
}

export { tendency, SPECIAL_BET_TYPES, formatNearest };
