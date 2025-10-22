import express from 'express';
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  getTeam,
  listPlayers,
  listPlayersByTeam,
  movePlayer,
  updatePlayer
} from '../services/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { teamId } = req.query ?? {};
  try {
    if (teamId) {
      const players = await listPlayersByTeam(teamId);
      return res.json(players);
    }
    const players = await listPlayers();
    res.json(players);
  } catch (error) {
    console.error('Players konnten nicht geladen werden:', error);
    res.status(500).json({ message: 'Players konnten nicht geladen werden.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body ?? {};
    const { teamId } = payload;
    if (teamId === undefined || teamId === null || teamId === '') {
      return res.status(400).json({ message: 'teamId ist erforderlich.' });
    }
    const team = await getTeam(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team wurde nicht gefunden.' });
    }
    const player = await createPlayer(payload);
    res.status(201).json(player);
  } catch (error) {
    console.error('Player konnte nicht erstellt werden:', error);
    res.status(400).json({ message: 'Player konnte nicht erstellt werden.', detail: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Player-ID.' });
  }

  try {
    const existing = await getPlayer(id);
    if (!existing) {
      return res.status(404).json({ message: 'Player wurde nicht gefunden.' });
    }

    if (req.body?.teamId && Number(req.body.teamId) !== existing.team_id) {
      const targetTeam = await getTeam(req.body.teamId);
      if (!targetTeam) {
        return res.status(404).json({ message: 'Ziel-Team wurde nicht gefunden.' });
      }
      await movePlayer(id, targetTeam.id);
    }

    const player = await updatePlayer(id, req.body ?? {});
    res.json(player);
  } catch (error) {
    console.error('Player konnte nicht aktualisiert werden:', error);
    res.status(400).json({ message: 'Player konnte nicht aktualisiert werden.', detail: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Player-ID.' });
  }

  try {
    const existing = await getPlayer(id);
    if (!existing) {
      return res.status(404).json({ message: 'Player wurde nicht gefunden.' });
    }

    await deletePlayer(id);
    res.status(204).end();
  } catch (error) {
    console.error('Player konnte nicht gelöscht werden:', error);
    res.status(500).json({ message: 'Player konnte nicht gelöscht werden.' });
  }
});

export default router;
