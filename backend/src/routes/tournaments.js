import express from 'express';
import {
  createTournament,
  deleteTournament,
  getTournament,
  getTournamentSchedule,
  getTournamentStages,
  getTournamentTeams,
  getTournamentStructureDetails,
  groupScheduleByPhase,
  listTournaments,
  setTournamentTeams,
  updateTournament,
  updateTournamentScheduleEntry
} from '../services/index.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const tournaments = await listTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Turniere konnten nicht geladen werden:', error);
    res.status(500).json({ message: 'Turniere konnten nicht geladen werden.' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const tournament = await getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.json(tournament);
  } catch (error) {
    console.error('Turnier konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnier konnte nicht geladen werden.' });
  }
});

router.post('/', async (req, res) => {
  const { name, group_count, knockout_rounds, is_public, team_count, classification_mode } = req.body ?? {};
  try {
    const tournament = await createTournament({
      name,
      group_count,
      knockout_rounds,
      is_public,
      team_count,
      classification_mode
    });
    res.status(201).json(tournament);
  } catch (error) {
    console.error('Turnier konnte nicht erstellt werden:', error);
    res.status(400).json({ message: 'Turnier konnte nicht erstellt werden.', detail: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const updated = await updateTournament(id, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Turnier konnte nicht aktualisiert werden:', error);
    res.status(400).json({ message: 'Turnier konnte nicht aktualisiert werden.', detail: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const deleted = await deleteTournament(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Turnier konnte nicht gelöscht werden:', error);
    res.status(500).json({ message: 'Turnier konnte nicht gelöscht werden.' });
  }
});

router.get('/:id/stages', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const stages = await getTournamentStages(id);
    res.json(stages);
  } catch (error) {
    console.error('Turnierphasen konnten nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnierphasen konnten nicht geladen werden.' });
  }
});

router.get('/:id/schedule', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const scheduleEntries = await getTournamentSchedule(id);
    const participants = await getTournamentTeams(id);
    res.json({
      schedule: groupScheduleByPhase(scheduleEntries),
      raw: scheduleEntries,
      participants
    });
  } catch (error) {
    console.error('Turnier-Spielplan konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnier-Spielplan konnte nicht geladen werden.' });
  }
});

router.put('/:id/schedule/:scheduleId', async (req, res) => {
  const tournamentId = Number(req.params.id);
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  const scheduleId = Number(req.params.scheduleId);
  if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
    return res.status(400).json({ message: 'Ungültige Spielplan-ID.' });
  }

  try {
    const updated = await updateTournamentScheduleEntry(tournamentId, scheduleId, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ message: 'Spielplan-Eintrag nicht gefunden.' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Spielplan-Eintrag konnte nicht aktualisiert werden:', error);
    const detail = error?.message ?? '';
    const status =
      typeof detail === 'string' && detail.includes('Ungültiger Zeitpunkt')
        ? 400
        : 500;
    res.status(status).json({
      message: 'Spielplan-Eintrag konnte nicht aktualisiert werden.',
      detail: error.message
    });
  }
});

router.get('/:id/structure', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const structure = await getTournamentStructureDetails(id);
    if (!structure) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.json(structure);
  } catch (error) {
    console.error('Turnierstruktur konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnierstruktur konnte nicht geladen werden.' });
  }
});

router.put('/:id/teams', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  const payload = req.body ?? {};
  const assignments = Array.isArray(payload.assignments)
    ? payload.assignments
    : Array.isArray(payload.teams)
      ? payload.teams
      : null;

  if (!assignments) {
    return res.status(400).json({ message: 'Bitte eine Liste von Teamzuweisungen bereitstellen (assignments).' });
  }

  try {
    const structure = await setTournamentTeams(id, assignments);
    res.json(structure);
  } catch (error) {
    console.error('Teamzuweisungen konnten nicht gespeichert werden:', error);
    const status = String(error?.message || '').includes('Slot') || String(error?.message || '').includes('Team')
      ? 400
      : 500;
    res.status(status).json({
      message: 'Teamzuweisungen konnten nicht gespeichert werden.',
      detail: error.message
    });
  }
});

export default router;
