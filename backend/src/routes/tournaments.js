import express from 'express';
import multer from 'multer';
import { listRegistrations, confirmRegistration, rejectRegistration, updateRegistrationStatus } from '../services/registrations/index.js';
import { sendRegistrationApproved, sendRegistrationRejected } from '../services/mail/index.js';
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
  updateTournamentScheduleEntry,
  setTournamentCompletionStatus,
  storePosterUpload
} from '../services/index.js';
import { getAudioFileById } from '../services/audio/index.js';
import { getScoreboardState, setTournamentCompleted } from '../scoreboard/index.js';

async function withPosterUrl(tournament) {
  if (!tournament || !tournament.poster_file_id) return tournament;
  const file = await getAudioFileById(tournament.poster_file_id);
  return { ...tournament, poster_url: file ? `/media/audio/${encodeURIComponent(file.file_name)}` : null };
}

async function withPosterUrls(tournaments) {
  return Promise.all(tournaments.map(withPosterUrl));
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const tournaments = await withPosterUrls(await listTournaments());
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
    res.json(await withPosterUrl(tournament));
  } catch (error) {
    console.error('Turnier konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnier konnte nicht geladen werden.' });
  }
});

router.post('/', async (req, res) => {
  const { name, group_count, knockout_rounds, is_public, team_count, classification_mode, status, planned_at, description, location, links } = req.body ?? {};
  try {
    const tournament = await createTournament({
      name,
      group_count,
      knockout_rounds,
      is_public,
      team_count,
      classification_mode,
      status,
      planned_at,
      description,
      location,
      links
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

  const { name, group_count, knockout_rounds, is_public, team_count, classification_mode, status, planned_at, description, location, schedule_info, travel_info, contact_email, registration_url, registration_deadline, links } = req.body ?? {};
  try {
    const updated = await updateTournament(id, {
      name,
      group_count,
      knockout_rounds,
      is_public,
      team_count,
      classification_mode,
      status,
      planned_at,
      description,
      location,
      schedule_info,
      travel_info,
      contact_email,
      registration_url,
      registration_deadline,
      links
    });
    if (!updated) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.json(await withPosterUrl(updated));
  } catch (error) {
    console.error('Turnier konnte nicht aktualisiert werden:', error);
    res.status(400).json({ message: 'Turnier konnte nicht aktualisiert werden.', detail: error.message });
  }
});

router.post('/:id/poster', upload.single('file'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: 'Bitte eine Bilddatei hochladen.' });
  }

  if (!file.mimetype.startsWith('image/')) {
    return res.status(400).json({ message: 'Es werden nur Bilddateien unterstützt.' });
  }

  try {
    const tournament = await getTournament(id);
    if (!tournament) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }

    const record = await storePosterUpload({
      buffer: file.buffer,
      originalName: file.originalname || 'poster',
      mimeType: file.mimetype,
      label: tournament.name
    });

    const updated = await updateTournament(id, { poster_file_id: record.id });
    res.json(await withPosterUrl(updated));
  } catch (error) {
    console.error('Turnier-Poster konnte nicht gespeichert werden:', error);
    res.status(400).json({ message: error.message || 'Turnier-Poster konnte nicht gespeichert werden.' });
  }
});

router.post('/:id/completion', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  const { completed } = req.body ?? {};
  const desired = completed === undefined ? true : Boolean(completed);

  try {
    const updated = await setTournamentCompletionStatus(id, desired);
    if (!updated) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }

    const snapshot = getScoreboardState();
    if (snapshot.tournamentId === id) {
      setTournamentCompleted(desired);
    }

    res.json(updated);
  } catch (error) {
    console.error('Turnierstatus konnte nicht aktualisiert werden:', error);
    res.status(500).json({ message: 'Turnierstatus konnte nicht aktualisiert werden.' });
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

router.post('/:id/registration-closed', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  const { closed } = req.body ?? {};
  try {
    const conn = await import('../db/connection.js');
    const { SQL, db } = await conn.getConnection();
    db.run('UPDATE tournaments SET registration_closed = ? WHERE id = ?', [closed ? 1 : 0, id]);
    conn.persistDatabase(db, SQL);
    res.json({ ok: true, registration_closed: Boolean(closed) });
  } catch (error) {
    res.status(500).json({ message: 'Konnte Anmeldestatus nicht ändern.' });
  }
});

router.post('/:id/activate', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }
  try {
    const tournament = await getTournament(id);
    if (!tournament) return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    if (tournament.status !== 'planned') return res.status(400).json({ message: 'Turnier ist nicht im Status "geplant".' });

    const { group_count, knockout_rounds, teams: teamsPayload } = req.body ?? {};
    const conn = await import('../db/connection.js');
    const { SQL, db } = await conn.getConnection();

    // Apply team slot assignments from payload
    // teamsPayload: [{ slot_number, team_id, name }]
    if (Array.isArray(teamsPayload) && teamsPayload.length > 0) {
      // Clear existing slots
      db.run('DELETE FROM tournament_teams WHERE tournament_id = ?', [id]);
      for (const t of teamsPayload) {
        const slot = Number(t.slot_number);
        const teamName = String(t.name || '').trim();
        if (!slot || !teamName) continue;
        let teamId = t.team_id ? Number(t.team_id) : null;
        if (!teamId && teamName) {
          // Upsert team by name
          db.run('INSERT INTO teams (name) VALUES (?) ON CONFLICT(name) DO UPDATE SET name = excluded.name', [teamName]);
          const r = db.exec('SELECT id FROM teams WHERE name = ?', [teamName]);
          teamId = r[0]?.values[0][0] ?? null;
        }
        db.run(
          'INSERT OR REPLACE INTO tournament_teams (tournament_id, slot_number, team_id, placeholder) VALUES (?, ?, ?, ?)',
          [id, slot, teamId, teamName]
        );
      }
      conn.persistDatabase(db, SQL);
    }

    const finalTeamCount = db.exec('SELECT COUNT(*) FROM tournament_teams WHERE tournament_id = ?', [id])[0]?.values[0][0] ?? 0;
    if (finalTeamCount < 2) {
      return res.status(400).json({ message: `Mindestens 2 Teams nötig (aktuell: ${finalTeamCount}).` });
    }

    const updated = await updateTournament(id, {
      ...tournament,
      status: 'active',
      team_count: finalTeamCount,
      group_count: group_count ? Number(group_count) : (tournament.group_count || 1),
      knockout_rounds: knockout_rounds !== undefined ? Number(knockout_rounds) : (tournament.knockout_rounds || 0)
    });

    res.json(await withPosterUrl(updated));
  } catch (error) {
    console.error('Turnier konnte nicht aktiviert werden:', error);
    res.status(500).json({ message: error.message || 'Turnier konnte nicht aktiviert werden.' });
  }
});

router.get('/:id/registrations', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }
  try {
    const registrations = await listRegistrations(id);
    res.json(registrations);
  } catch (error) {
    console.error('Anmeldungen konnten nicht geladen werden:', error);
    res.status(500).json({ message: 'Anmeldungen konnten nicht geladen werden.' });
  }
});

router.patch('/:id/registrations/:regId', async (req, res) => {
  const tournamentId = Number(req.params.id);
  const regId = Number(req.params.regId);
  const { status } = req.body ?? {};
  if (!Number.isInteger(regId) || regId <= 0) {
    return res.status(400).json({ message: 'Ungültige Anmeldungs-ID.' });
  }
  const allowed = ['pending', 'confirmed', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Ungültiger Status.' });
  }
  try {
    const tournament = await getTournament(tournamentId);

    if (status === 'confirmed') {
      const reg = await confirmRegistration(regId);
      sendRegistrationApproved({ to: reg.contactEmail, tournamentName: tournament?.name ?? '', teamName: reg.teamName, contactName: reg.contactName }).catch(console.error);
    } else if (status === 'rejected') {
      const reg = await rejectRegistration(regId);
      sendRegistrationRejected({ to: reg.contactEmail, tournamentName: tournament?.name ?? '', teamName: reg.teamName, contactName: reg.contactName }).catch(console.error);
    } else {
      await updateRegistrationStatus(regId, status);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Status konnte nicht aktualisiert werden:', error);
    res.status(500).json({ message: error.message || 'Status konnte nicht aktualisiert werden.' });
  }
});

export default router;
