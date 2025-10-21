import express from 'express';
import {
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  updateTeam
} from '../services/index.js';
import { getScoreboardState, setTeams } from '../scoreboard/index.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const teams = await listTeams();
    res.json(teams);
  } catch (error) {
    console.error('Teams konnten nicht geladen werden:', error);
    res.status(500).json({ message: 'Teams konnten nicht geladen werden.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body ?? {};
    const team = await createTeam({ name });
    res.status(201).json(team);
  } catch (error) {
    console.error('Team konnte nicht erstellt werden:', error);
    if (String(error?.message || '').includes('unique') || String(error?.message || '').includes('Unique')) {
      res.status(409).json({ message: 'Teamname bereits vergeben.' });
    } else {
      res.status(400).json({ message: 'Team konnte nicht erstellt werden.', detail: error.message });
    }
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Team-ID.' });
  }

  try {
    const updated = await updateTeam(id, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ message: 'Team nicht gefunden.' });
    }

    const scoreboard = getScoreboardState();
    const patch = {};
    if (scoreboard.teamAId === updated.id) {
      patch.teamAId = updated.id;
      patch.teamAName = updated.name;
    }
    if (scoreboard.teamBId === updated.id) {
      patch.teamBId = updated.id;
      patch.teamBName = updated.name;
    }
    if (Object.keys(patch).length > 0) {
      setTeams(patch);
    }

    res.json(updated);
  } catch (error) {
    console.error('Team konnte nicht aktualisiert werden:', error);
    if (String(error?.message || '').includes('unique') || String(error?.message || '').includes('Unique')) {
      res.status(409).json({ message: 'Teamname bereits vergeben.' });
    } else {
      res.status(400).json({ message: 'Team konnte nicht aktualisiert werden.', detail: error.message });
    }
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Team-ID.' });
  }

  try {
    const existing = await getTeam(id);
    if (!existing) {
      return res.status(404).json({ message: 'Team nicht gefunden.' });
    }

    const deleted = await deleteTeam(id);
    if (!deleted) {
      return res.status(500).json({ message: 'Team konnte nicht gelöscht werden.' });
    }

    const scoreboard = getScoreboardState();
    const patch = {};
    if (scoreboard.teamAId === existing.id) {
      patch.teamAId = null;
      patch.teamAName = scoreboard.teamAName;
    }
    if (scoreboard.teamBId === existing.id) {
      patch.teamBId = null;
      patch.teamBName = scoreboard.teamBName;
    }
    if (Object.keys(patch).length > 0) {
      setTeams(patch);
    }

    res.status(204).end();
  } catch (error) {
    console.error('Team konnte nicht gelöscht werden:', error);
    res.status(500).json({ message: 'Team konnte nicht gelöscht werden.' });
  }
});

export default router;
