import { getTournament } from '../tournaments/base.js';
import { getTournamentSchedule, getTournamentTeams } from '../tournaments/structure.js';
import { getTournamentSummary } from '../tournaments/summary.js';
import { canonicalGroupLabel } from '../tournaments/helpers.js';
import { hasLiveGameStarted } from '../tournaments/standings.js';
import { listPlayersByTeam } from '../playersService.js';
import { minutesOfDayInVenue } from './time.js';

const CACHE_TTL_MS = 3000;
const cache = new Map();

export function invalidateTournamentContext(tournamentId) {
  if (tournamentId === undefined) cache.clear();
  else cache.delete(Number(tournamentId));
}

const lower = (value) => String(value ?? '').trim().toLowerCase();

// Team-Schlüssel: bevorzugt die Team-ID, sonst über den Namen auf die ID der Turnierteilnehmer abgebildet.
export function makeTeamKeyResolver(participants = []) {
  const idByName = new Map();
  participants.forEach((participant) => {
    const id = Number(participant.team_id);
    if (Number.isInteger(id) && id > 0 && participant.team_name) idByName.set(lower(participant.team_name), id);
  });
  return (teamId, teamName) => {
    const numeric = Number(teamId);
    if (Number.isInteger(numeric) && numeric > 0) return `id:${numeric}`;
    const mapped = idByName.get(lower(teamName));
    if (mapped) return `id:${mapped}`;
    return lower(teamName) ? `name:${lower(teamName)}` : null;
  };
}

function side(details, resolveKey) {
  if (!details?.teamName) return null;
  const key = resolveKey(details.teamId, details.teamName);
  return key ? { key, teamId: details.teamId ?? null, name: details.teamName } : null;
}

function winnerOf(scoreA, scoreB) {
  if (scoreA === scoreB) return null;
  return scoreA > scoreB ? 'a' : 'b';
}

// Ergebnis in Heim/Gast-Orientierung des Spielplans; Tipp gilt für den Stand nach regulärer Zeit.
export function orientResult({ keyA, scoreA, scoreB, regularA, regularB }, match) {
  const swapped = Boolean(match.away && keyA && keyA === match.away.key);
  const winner = winnerOf(scoreA, scoreB);
  const mapSide = (value) => (value === null ? null : (value === 'a') !== swapped ? 'home' : 'away');
  return {
    home: swapped ? regularB : regularA,
    away: swapped ? regularA : regularB,
    winner: mapSide(winner)
  };
}

export function normalizeMatch(entry, resolveKey) {
  const match = {
    code: entry.code,
    phase: entry.phase,
    stageLabel: entry.stage_label,
    stageLabelI18n: entry.stage_label_i18n ?? null,
    group: entry.phase === 'group' ? canonicalGroupLabel(entry.metadata?.group ?? entry.stage_label) : null,
    scheduledAt: entry.scheduled_at ?? null,
    isFinal: entry.phase === 'knockout' && lower(entry.stage_label) === 'finale',
    order: [entry.stage_order ?? 0, entry.round_number ?? 0, entry.match_order ?? 0],
    home: side(entry.home, resolveKey),
    away: side(entry.away, resolveKey),
    homeLabel: entry.home_label || entry.home?.label || '',
    awayLabel: entry.away_label || entry.away?.label || '',
    result: null
  };
  const saved = entry.result;
  if (saved?.hasResult) {
    const scoreA = Number(saved.scoreA ?? 0);
    const scoreB = Number(saved.scoreB ?? 0);
    match.result = {
      ...orientResult(
        {
          keyA: resolveKey(saved.teamAId, saved.teamAName),
          scoreA,
          scoreB,
          regularA: saved.shootout ? Number(saved.shootout.regularScoreA ?? 0) : scoreA,
          regularB: saved.shootout ? Number(saved.shootout.regularScoreB ?? 0) : scoreB
        },
        match
      ),
      live: false,
      saved: true,
      gameId: saved.gameId,
      finishedAt: saved.finishedAt ?? null,
      shootout: Boolean(saved.shootout)
    };
  }
  return match;
}

// Laufendes Spiel überlagert den gespeicherten Stand, solange es nicht (unverändert) gesichert ist.
export function applyLiveState(matches, state, tournamentId, resolveKey) {
  if (!state || Number(state.tournamentId) !== Number(tournamentId) || !state.scheduleCode || !hasLiveGameStarted(state)) {
    return { matches, liveCode: null };
  }
  let liveCode = null;
  const next = matches.map((match) => {
    if (match.code !== state.scheduleCode || !match.home || !match.away) return match;
    const savedAndUnchanged = match.result?.saved && (state.savedGameId !== match.result.gameId || state.saveState === 'saved');
    if (savedAndUnchanged) return match;
    liveCode = state.isFinished ? null : match.code;
    const scoreA = Number(state.scoreA ?? 0);
    const scoreB = Number(state.scoreB ?? 0);
    return {
      ...match,
      result: {
        ...orientResult(
          {
            keyA: resolveKey(state.teamAId, state.teamAName),
            scoreA,
            scoreB,
            regularA: state.shootout ? Number(state.shootout.regularScoreA ?? 0) : scoreA,
            regularB: state.shootout ? Number(state.shootout.regularScoreB ?? 0) : scoreB
          },
          match
        ),
        live: !state.isFinished,
        saved: false,
        gameId: state.savedGameId ?? null,
        finishedAt: null,
        shootout: Boolean(state.shootout)
      }
    };
  });
  return { matches: next, liveCode };
}

function topKeys(players, field) {
  const max = Math.max(0, ...players.map((player) => player[field] ?? 0));
  if (max <= 0) return [];
  return players.filter((player) => (player[field] ?? 0) === max && player.playerId != null).map((player) => String(player.playerId));
}

export function deriveSpecialOutcomes({ tournament, summary, matches, groups, kickoffs = new Map(), overrides = new Map(), resolveKey }) {
  const outcomes = new Map();
  const savedMatches = matches.filter((match) => match.result?.saved);
  const allFinished = matches.length > 0 && savedMatches.length === matches.length;
  const tournamentDone = Boolean(tournament?.is_completed) || allFinished;

  const champion = summary?.finalPlacements?.find((entry) => entry.placement === 1);
  if (champion && (champion.decidedByCode === 'final' || tournament?.is_completed)) {
    const key = resolveKey(champion.teamId, champion.teamName);
    if (key) outcomes.set('winner', { keys: [key], final: true });
  }

  const players = summary?.playerStats?.players ?? [];
  [
    ['top_scorer', 'points'],
    ['most_penalty_seconds', 'penaltySeconds']
  ].forEach(([betKey, field]) => {
    const keys = topKeys(players, field);
    if (keys.length > 0) outcomes.set(betKey, { keys, final: tournamentDone });
  });

  groups.forEach((group) => {
    const standing = summary?.groupStandings?.find((entry) => entry.canonicalLabel === group.canonical);
    const leader = standing?.standings?.[0];
    if (!leader?.team || !standing.recordedGamesCount) return;
    const groupMatches = matches.filter((match) => match.group === group.canonical);
    const complete = groupMatches.length > 0 && groupMatches.every((match) => match.result?.saved);
    const key = resolveKey(null, leader.team);
    if (key) outcomes.set(group.betKey, { keys: [key], final: complete || Boolean(tournament?.is_completed) });
  });

  if (savedMatches.length > 0) {
    const value = savedMatches.reduce((sum, match) => sum + match.result.home + match.result.away, 0);
    outcomes.set('total_baskets', { value, final: tournamentDone });
  }

  const finalMatch = matches.find((match) => match.isFinal);
  const finalKickoff = finalMatch ? minutesOfDayInVenue(kickoffs.get(finalMatch.code)) : null;
  if (finalKickoff !== null) outcomes.set('final_kickoff', { value: finalKickoff, final: true });

  overrides.forEach((value, betKey) => {
    if (Array.isArray(value?.keys)) outcomes.set(betKey, { keys: value.keys.map(String), final: true });
    else if (Number.isInteger(value?.value)) outcomes.set(betKey, { value: value.value, final: true });
  });

  return outcomes;
}

async function buildBase(tournamentId) {
  const tournament = await getTournament(tournamentId);
  if (!tournament) return null;
  const [participants, schedule, summary] = await Promise.all([
    getTournamentTeams(tournamentId),
    getTournamentSchedule(tournamentId),
    getTournamentSummary(tournamentId, { includePrivate: true })
  ]);
  const resolveKey = makeTeamKeyResolver(participants);
  const matches = schedule.filter((entry) => entry.code).map((entry) => normalizeMatch(entry, resolveKey));

  const teams = participants
    .filter((participant) => Number(participant.team_id) > 0 && participant.team_name)
    .map((participant) => ({ key: resolveKey(participant.team_id, participant.team_name), teamId: participant.team_id, name: participant.team_name }));

  const groupMap = new Map();
  matches
    .filter((match) => match.group)
    .forEach((match) => {
      if (!groupMap.has(match.group)) {
        groupMap.set(match.group, { canonical: match.group, betKey: `group_winner:${match.group}`, label: match.stageLabel, teamKeys: new Set() });
      }
      const group = groupMap.get(match.group);
      [match.home, match.away].forEach((teamSide) => teamSide && group.teamKeys.add(teamSide.key));
    });
  const groups = Array.from(groupMap.values())
    .sort((a, b) => a.canonical.localeCompare(b.canonical, 'de', { numeric: true }))
    .map((group) => ({ ...group, teamKeys: Array.from(group.teamKeys) }));

  const rosters = await Promise.all(
    teams.map(async (team) => ((await listPlayersByTeam(team.teamId)) ?? []).map((player) => ({ player, team })))
  );
  const players = rosters.flat().map(({ player, team }) => ({
    key: String(player.id),
    name: player.name,
    jerseyNumber: player.jersey_number ?? null,
    teamKey: team.key,
    teamName: team.name
  }));

  return { tournament, matches, teams, groups, players, summary, resolveKey };
}

export async function loadTournamentBase(tournamentId, now = Date.now()) {
  const id = Number(tournamentId);
  const cached = cache.get(id);
  if (cached && cached.at + CACHE_TTL_MS > now) return cached.promise;
  const promise = buildBase(id).catch((error) => {
    cache.delete(id);
    throw error;
  });
  cache.set(id, { at: now, promise });
  return promise;
}
