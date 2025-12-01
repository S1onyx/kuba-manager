import { getTournament } from './base.js';
import { listGamesByTournament } from '../gamesService.js';
import { listPlayersByTeam } from '../playersService.js';
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

  const rosterByTeamId = new Map();
  const uniqueTeamIds = Array.from(
    new Set(
      participants
        .map((participant) => Number(participant.team_id))
        .filter((teamId) => Number.isInteger(teamId) && teamId > 0)
    )
  );
  if (uniqueTeamIds.length > 0) {
    await Promise.all(
      uniqueTeamIds.map(async (teamId) => {
        try {
          const roster = await listPlayersByTeam(teamId);
          rosterByTeamId.set(teamId, Array.isArray(roster) ? roster : []);
        } catch (error) {
          console.error('Spieler konnten nicht geladen werden:', error);
          rosterByTeamId.set(teamId, []);
        }
      })
    );
  }

  const totals = {
    totalGames: games.length,
    totalGoals: 0,
    totalPenalties: 0,
    totalPenaltySeconds: 0,
    totalScoreEvents: 0
  };

  const overallStatsMap = new Map();

const playerTotals = new Map();

const accumulatePenaltySeconds = (entries = []) =>
  entries.reduce((sum, entry) => sum + (entry.totalSeconds ?? entry.remainingSeconds ?? 0), 0);

const makePlayerKey = (teamId, teamName, stat) => {
  if (stat.playerId != null) {
    return `id:${stat.playerId}`;
  }
  const teamSegment = teamId ?? teamName ?? 'unknown-team';
  const numberSegment = stat.jerseyNumber ?? stat.jersey_number ?? '';
  const nameSegment = (stat.name ?? stat.displayName ?? 'Unbekannt').trim();
  return `team:${teamSegment}:name:${nameSegment}:no:${numberSegment}`;
};

const registerPlayerStats = (teamId, teamName, stats = []) => {
  if (!Array.isArray(stats)) {
    return;
  }

  stats
    .filter((stat) => stat && !stat.isTeamTotal && !stat.isUnknown)
    .forEach((stat) => {
      const impact =
        (stat.points ?? 0) !== 0 ||
        (stat.scores ?? 0) !== 0 ||
        (stat.penalties ?? 0) !== 0 ||
        (stat.penaltySeconds ?? 0) !== 0;

      if (!impact) {
        return;
      }

      const key = makePlayerKey(teamId, teamName, stat);
      let aggregate = playerTotals.get(key);
      if (!aggregate) {
        aggregate = {
          key,
          playerId: stat.playerId ?? null,
          teamId: teamId ?? null,
          teamName: teamName ?? '',
          name: stat.name ?? stat.displayName ?? 'Unbekannt',
          displayName: stat.displayName ?? stat.name ?? 'Unbekannt',
          jerseyNumber: stat.jerseyNumber ?? stat.jersey_number ?? null,
          position: stat.position ?? '',
          points: 0,
          scores: 0,
          breakdown: { '1': 0, '2': 0, '3': 0 },
          penalties: 0,
          penaltySeconds: 0,
          games: 0,
          lastScoreAt: null
        };
        playerTotals.set(key, aggregate);
      }

      aggregate.points += stat.points ?? 0;
      aggregate.scores += stat.scores ?? 0;
      aggregate.breakdown['1'] += stat.breakdown?.['1'] ?? 0;
      aggregate.breakdown['2'] += stat.breakdown?.['2'] ?? 0;
      aggregate.breakdown['3'] += stat.breakdown?.['3'] ?? 0;
      aggregate.penalties += stat.penalties ?? 0;
      aggregate.penaltySeconds += stat.penaltySeconds ?? 0;
      aggregate.games += 1;

      if (stat.lastScoreAt) {
        const lastScoreAt = new Date(stat.lastScoreAt).toISOString();
        if (!aggregate.lastScoreAt || new Date(lastScoreAt) > new Date(aggregate.lastScoreAt)) {
          aggregate.lastScoreAt = lastScoreAt;
        }
      }
    });
};

  games.forEach((game) => {
    const penalties = game.penalties ?? { a: [], b: [] };
    totals.totalGoals += (game.score_a ?? 0) + (game.score_b ?? 0);
    totals.totalPenalties += (penalties.a?.length ?? 0) + (penalties.b?.length ?? 0);
    totals.totalPenaltySeconds += accumulatePenaltySeconds(penalties.a ?? []);
    totals.totalPenaltySeconds += accumulatePenaltySeconds(penalties.b ?? []);

    const snapshot = game.snapshot ?? {};
    totals.totalScoreEvents += snapshot.scoringLog?.length ?? 0;
    registerPlayerStats(game.team_a_id, game.team_a, snapshot.playerStats?.a ?? []);
    registerPlayerStats(game.team_b_id, game.team_b, snapshot.playerStats?.b ?? []);

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

  participants.forEach((participant) => {
    const teamId = Number(participant.team_id);
    if (!Number.isInteger(teamId) || teamId <= 0) {
      return;
    }
    const roster = rosterByTeamId.get(teamId) || [];
    const teamName = participant.team_name || participant.placeholder || `Team ${participant.slot_number}`;
    roster.forEach((player) => {
      const placeholderStat = {
        playerId: player.id,
        jerseyNumber: player.jersey_number,
        name: player.name
      };
      const key = makePlayerKey(teamId, teamName, placeholderStat);
      if (!playerTotals.has(key)) {
        playerTotals.set(key, {
          key,
          playerId: player.id,
          teamId,
          teamName,
          name: player.name,
          displayName: player.name,
          jerseyNumber: player.jersey_number ?? null,
          position: player.position ?? '',
          points: 0,
          scores: 0,
          breakdown: { '1': 0, '2': 0, '3': 0 },
          penalties: 0,
          penaltySeconds: 0,
          games: 0,
          lastScoreAt: null
        });
      }
    });
  });



const playerOverview = Array.from(playerTotals.values());
playerOverview.forEach((entry) => {
  entry.pointsPerGame = entry.games > 0 ? entry.points / entry.games : 0;
  entry.scoresPerGame = entry.games > 0 ? entry.scores / entry.games : 0;
  entry.penaltySecondsPerGame = entry.games > 0 ? entry.penaltySeconds / entry.games : 0;
});

const topScorers = playerOverview
  .filter((entry) => entry.points > 0)
  .slice()
  .sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.scores !== a.scores) return b.scores - a.scores;
    return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
  })
  .slice(0, 15);

const mostPenalized = playerOverview
  .filter((entry) => entry.penalties > 0 || entry.penaltySeconds > 0)
  .slice()
  .sort((a, b) => {
    if (b.penaltySeconds !== a.penaltySeconds) return b.penaltySeconds - a.penaltySeconds;
    if (b.penalties !== a.penalties) return b.penalties - a.penalties;
    return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
  })
  .slice(0, 15);

const topThreePointers = playerOverview
  .filter((entry) => (entry.breakdown?.['3'] ?? 0) > 0)
  .slice()
  .sort((a, b) => {
    const aThrees = a.breakdown?.['3'] ?? 0;
    const bThrees = b.breakdown?.['3'] ?? 0;
    if (bThrees !== aThrees) return bThrees - aThrees;
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
  })
  .slice(0, 15);
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
    playerStats: {
      totalPlayers: playerOverview.length,
      leaders: {
        topScorers,
        mostPenalized,
        topThreePointers
      },
      players: playerOverview
    },
    participants: participants.map((participant) => ({
      slot: participant.slot_number,
      name: participant.team_name,
      placeholder: participant.placeholder
    })),
    schedule
  };
}
