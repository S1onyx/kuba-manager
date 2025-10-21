import { getConnection } from '../../db/connection.js';
import { mapGameRow } from '../gamesService.js';
import {
  canonicalGroupLabel,
  createGroupLabels,
  distributeSlotsAcrossGroups,
  defaultSlotPlaceholder
} from './helpers.js';

export function addMatchStats(statsMap, team, opponent, goalsFor, goalsAgainst, penalties) {
  if (!team) {
    return;
  }

  if (!statsMap.has(team)) {
    statsMap.set(team, {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
      penalties: 0
    });
  }

  const entry = statsMap.get(team);
  entry.played += 1;
  entry.goalsFor += goalsFor;
  entry.goalsAgainst += goalsAgainst;
  entry.goalDiff = entry.goalsFor - entry.goalsAgainst;
  entry.penalties += penalties;

  if (goalsFor > goalsAgainst) {
    entry.wins += 1;
    entry.points += 3;
  } else if (goalsFor === goalsAgainst) {
    entry.draws += 1;
    entry.points += 1;
  } else {
    entry.losses += 1;
  }
}

export async function computeGroupStandings(tournamentId, stageLabel, { currentSnapshot } = {}) {
  if (!tournamentId || !stageLabel) {
    return { standings: [], recordedGamesCount: 0 };
  }

  const targetRaw = String(stageLabel ?? '').trim();
  const targetCanonical = canonicalGroupLabel(targetRaw);
  if (!targetRaw || !targetCanonical) {
    return { standings: [], recordedGamesCount: 0 };
  }
  const targetRawUpper = targetRaw.toUpperCase();

  const { db } = await getConnection();
  const stmt = db.prepare(
    `SELECT * FROM games
     WHERE tournament_id = ? AND stage_type = 'group'`
  );

  const stats = new Map();
  let recordedGamesCount = 0;

  try {
    stmt.bind([tournamentId]);

    while (stmt.step()) {
      const row = mapGameRow(stmt.getAsObject());
      const rawLabel = String(row.stage_label ?? '').trim();
      const rowCanonical = canonicalGroupLabel(rawLabel);
      const rowRawUpper = rawLabel.toUpperCase();

      const matchesTarget =
        rowRawUpper === targetRawUpper || (rowCanonical && rowCanonical === targetCanonical);

      if (!matchesTarget) {
        continue;
      }

      recordedGamesCount += 1;
      const penalties = row.penalties ?? { a: [], b: [] };

      addMatchStats(stats, row.team_a, row.team_b, row.score_a, row.score_b, penalties.a?.length ?? 0);
      addMatchStats(stats, row.team_b, row.team_a, row.score_b, row.score_a, penalties.b?.length ?? 0);
    }
  } finally {
    stmt.free();
  }

  let snapshotCountsAsMatch = false;

  if (
    currentSnapshot &&
    currentSnapshot.stageType === 'group' &&
    canonicalGroupLabel(currentSnapshot.stageLabel) === targetCanonical &&
    currentSnapshot.tournamentId === tournamentId
  ) {
    const penalties = currentSnapshot.penalties ?? { a: [], b: [] };
    const remainingSeconds = currentSnapshot.remainingSeconds ?? 0;
    const durationSeconds = currentSnapshot.durationSeconds ?? 0;
    const started =
      (currentSnapshot.scoreA ?? 0) !== 0 ||
      (currentSnapshot.scoreB ?? 0) !== 0 ||
      remainingSeconds !== durationSeconds;

    if (started) {
      addMatchStats(
        stats,
        currentSnapshot.teamAName,
        currentSnapshot.teamBName,
        currentSnapshot.scoreA ?? 0,
        currentSnapshot.scoreB ?? 0,
        penalties.a?.length ?? 0
      );
      addMatchStats(
        stats,
        currentSnapshot.teamBName,
        currentSnapshot.teamAName,
        currentSnapshot.scoreB ?? 0,
        currentSnapshot.scoreA ?? 0,
        penalties.b?.length ?? 0
      );
      snapshotCountsAsMatch = true;
    }
  }

  // ensure all participants are represented, even without recorded games
  try {
    const tournamentStmt = db.prepare(
      'SELECT group_count, team_count FROM tournaments WHERE id = ?'
    );
    let groupCount = 0;
    let teamCount = 0;
    try {
      tournamentStmt.bind([tournamentId]);
      if (tournamentStmt.step()) {
        const row = tournamentStmt.getAsObject();
        groupCount = Number(row?.group_count ?? 0);
        teamCount = Number(row?.team_count ?? 0);
      }
    } finally {
      tournamentStmt.free();
    }

    if (groupCount > 0 && teamCount > 0) {
      const groupLabels = createGroupLabels(groupCount);
      const assignments = distributeSlotsAcrossGroups(teamCount, groupLabels);
      const candidateSlots = assignments.get(targetCanonical);

      if (candidateSlots && candidateSlots.length > 0) {
        const participantsStmt = db.prepare(
          `SELECT tt.slot_number, tt.placeholder, tt.team_id, teams.name AS team_name
           FROM tournament_teams tt
           LEFT JOIN teams ON teams.id = tt.team_id
           WHERE tt.tournament_id = ?`
        );

        const slotMap = new Map();
        try {
          participantsStmt.bind([tournamentId]);
          while (participantsStmt.step()) {
            const row = participantsStmt.getAsObject();
            slotMap.set(row.slot_number, {
              teamName: row.team_name,
              placeholder: row.placeholder
            });
          }
        } finally {
          participantsStmt.free();
        }

        candidateSlots.forEach((slot) => {
          const entry = slotMap.get(slot) || {};
          const displayName = entry.teamName || entry.placeholder || defaultSlotPlaceholder(slot);
          if (!stats.has(displayName)) {
            stats.set(displayName, createStatsEntry(displayName));
          }
        });
      }
    }
  } catch (participantsError) {
    console.error('Teilnehmer konnten nicht für Gruppenstand hinzugefügt werden:', participantsError);
  }

  const standings = Array.from(stats.values());
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team, 'de', { sensitivity: 'base' });
  });

  return { standings, recordedGamesCount: recordedGamesCount + (snapshotCountsAsMatch ? 1 : 0) };
}

export function createStatsEntry(team) {
  return {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
    penalties: 0
  };
}

export function collectDistinctGroupLabels(games) {
  const labels = new Map();

  games.forEach((game) => {
    if (game.stage_type !== 'group') {
      return;
    }

    const raw = String(game.stage_label ?? '').trim();
    if (!raw) {
      return;
    }

    const canonical = canonicalGroupLabel(raw);
    if (!canonical) {
      return;
    }

    if (!labels.has(canonical)) {
      labels.set(canonical, raw);
    }
  });

  return labels;
}

export function normalizeKnockoutLabel(label) {
  return String(label ?? '').trim();
}

const KNOCKOUT_RANK = {
  F: 1,
  FINALE: 1,
  HALBFINALE: 2,
  VIERTELFINALE: 3,
  ACHTELFINALE: 4,
  SECHZEHNTELFINALE: 5,
  ZWEIUNDDREISSIGSTELFINALE: 6,
  VIERUNDSECHZIGSTELFINALE: 7
};

export function knockoutRank(label) {
  const upper = String(label ?? '').toUpperCase();
  if (KNOCKOUT_RANK[upper] !== undefined) {
    return KNOCKOUT_RANK[upper];
  }

  if (upper.startsWith('RUNDE')) {
    const match = upper.match(/RUNDE\s+(\d+)/);
    if (match) {
      return 100 + Number(match[1]);
    }
  }

  return 999;
}
