import express from 'express';
import { Tournament, TournamentType } from '../db.js';

const router = express.Router();

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.findAll({
      include: [{ model: TournamentType, as: 'TournamentType' }]
    });
    res.json(tournaments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve tournaments' });
  }
});

// GET a specific tournament by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const tournament = await Tournament.findByPk(id, {
      include: [{ model: TournamentType, as: 'TournamentType' }]
    });
    if (tournament) {
      res.json(tournament);
    } else {
      res.status(404).json({ message: 'Tournament not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve tournament' });
  }
});

// CREATE a new tournament
router.post('/', async (req, res) => {
  try {
    const tournament = await Tournament.create(req.body);
    res.status(201).json(tournament);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// UPDATE an existing tournament
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Tournament.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedTournament = await Tournament.findByPk(id);
      return res.json(updatedTournament);
    } else {
      return res.status(404).json({ message: 'Tournament not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// DELETE a tournament
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Tournament.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Tournament not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

export default router;