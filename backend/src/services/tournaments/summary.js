import { getTournament } from './base.js';
import { listGamesByTournament } from '../gamesService.js';
import {
  getTournamentTeams,
  getTournamentSchedule,
  groupScheduleByPhase
} from './structure.js';
import {
  addMatchStats,
  createStatsEntry,
  collectDistinctGroupLabels,
  computeGroupStandings,
  normalizeKnockoutLabel,
  knockoutRank
} from './standings.js';
import { canonicalGroupLabel, createGroupLabels } from './helpers.js';

export async function getTournamentSummary(tournamentId) {
  const tournament = await getTournament(tournamentId);
  if (!tournament || !tournament.is_public) {
    return null;
  }

  const games = await listGamesByTournament(tournament.id);
  const participants = await getTournamentTeams(tournament.id);
  const scheduleEntries = await getTournamentSchedule(tournament.id);
  const schedule = groupScheduleByPhase(scheduleEntries);

  const totals = {
    totalGames: games.length,
    totalGoals: 0,
    totalPenalties: 0
  };

  const overallStatsMap = new Map();

  games.forEach((game) => {
    const penalties = game.penalties ?? { a: [], b: [] };
    totals.totalGoals += (game.score_a ?? 0) + (game.score_b ?? 0);
    totals.totalPenalties += (penalties.a?.length ?? 0) + (penalties.b?.length ?? 0);

    if (!overallStatsMap.has(game.team_a)) {
      overallStatsMap.set(game.team_a, createStatsEntry(game.team_a));
    }
    if (!overallStatsMap.has(game.team_b)) {
      overallStatsMap.set(game.team_b, createStatsEntry(game.team_b));
    }

    addMatchStats(
      overallStatsMap,
      game.team_a,
      game.team_b,
      game.score_a ?? 0,
      game.score_b ?? 0,
      penalties.a?.length ?? 0
    );
    addMatchStats(
      overallStatsMap,
      game.team_b,
      game.team_a,
      game.score_b ?? 0,
      game.score_a ?? 0,
      penalties.b?.length ?? 0
    );
  });

  const overallStats = Array.from(overallStatsMap.values());
  overallStats.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team, 'de', { sensitivity: 'base' });
  });

  const groupLabelMap = new Map();
  const distinctFromGames = collectDistinctGroupLabels(games);
  distinctFromGames.forEach((raw, canonical) => {
    if (!groupLabelMap.has(canonical)) {
      groupLabelMap.set(canonical, raw || canonical);
    }
  });

  scheduleEntries
    .filter((entry) => entry.phase === 'group')
    .forEach((entry) => {
      const canonical = canonicalGroupLabel(entry.stage_label);
      if (!canonical) {
        return;
      }
      if (!groupLabelMap.has(canonical)) {
        groupLabelMap.set(canonical, entry.stage_label || canonical);
      }
    });

  const groupCount = Number(tournament.group_count ?? 0);
  const configuredLabels = groupCount > 0 ? createGroupLabels(groupCount) : [];
  configuredLabels.forEach((label) => {
    if (!groupLabelMap.has(label)) {
      groupLabelMap.set(label, `Gruppe ${label}`);
    }
  });

  const groups = [];
  const orderedCanonicals = Array.from(groupLabelMap.keys()).sort((a, b) =>
    a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' })
  );

  for (const canonical of orderedCanonicals) {
    const display = groupLabelMap.get(canonical) || `Gruppe ${canonical}`;
    const { standings, recordedGamesCount } = await computeGroupStandings(tournament.id, canonical, {});
    groups.push({
      label: display,
      canonicalLabel: canonical,
      recordedGamesCount,
      standings
    });
  }

  const knockoutGames = games
    .filter((game) => game.stage_type === 'knockout')
    .map((game) => ({
      id: game.id,
      stageLabel: normalizeKnockoutLabel(game.stage_label),
      teamA: game.team_a,
      teamB: game.team_b,
      scoreA: game.score_a,
      scoreB: game.score_b,
      created_at: game.created_at
    }))
    .sort((a, b) => {
      const rankDiff = knockoutRank(a.stageLabel) - knockoutRank(b.stageLabel);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const recentGames = games
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((game) => ({
      id: game.id,
      stageType: game.stage_type,
      stageLabel: game.stage_label,
      teamA: game.team_a,
      teamB: game.team_b,
      scoreA: game.score_a,
      scoreB: game.score_b,
      created_at: game.created_at
    }));

  return {
    tournament,
    totals: {
      ...totals,
      totalTeams: overallStats.length
    },
    overallStats,
    groupStandings: groups,
    knockoutGames,
    recentGames,
    participants: participants.map((participant) => ({
      slot: participant.slot_number,
      name: participant.team_name,
      placeholder: participant.placeholder
    })),
    schedule
  };
}
