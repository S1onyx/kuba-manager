import {
  insertTournament,
  listTournaments,
  getTournament,
  updateTournamentRecord,
  deleteTournamentCascade,
  listPublicTournaments
} from './base.js';
import {
  regenerateTournamentStructure,
  getTournamentTeams,
  setTournamentTeams,
  getTournamentStructureDetails,
  getTournamentSchedule,
  getTournamentStages,
  groupScheduleByPhase
} from './structure.js';
import { computeGroupStandings } from './standings.js';
import { getTournamentSummary } from './summary.js';

export async function createTournament(payload = {}) {
  const { id } = await insertTournament(payload);
  if (!id) {
    return null;
  }

  try {
    const tournament = await getTournament(id);
    if (tournament) {
      await regenerateTournamentStructure(tournament);
      return (await getTournament(id)) ?? tournament;
    }
    return null;
  } catch (error) {
    await deleteTournamentCascade(id);
    throw error;
  }
}

export { listTournaments, getTournament, listPublicTournaments };

export async function updateTournament(id, patch = {}) {
  const existing = await getTournament(id);
  if (!existing) {
    return null;
  }

  await updateTournamentRecord(id, patch, existing);
  const updated = await getTournament(id);

  if (
    updated &&
    (existing.group_count !== updated.group_count ||
      existing.knockout_rounds !== updated.knockout_rounds ||
      existing.team_count !== updated.team_count ||
      (existing.classification_mode ?? 'top4') !== (updated.classification_mode ?? 'top4'))
  ) {
    await regenerateTournamentStructure(updated);
    return getTournament(id);
  }

  return updated;
}

export async function deleteTournament(id) {
  return deleteTournamentCascade(id);
}

export {
  regenerateTournamentStructure,
  getTournamentTeams,
  setTournamentTeams,
  getTournamentStructureDetails,
  getTournamentSchedule,
  getTournamentStages,
  groupScheduleByPhase,
  computeGroupStandings,
  getTournamentSummary
};
