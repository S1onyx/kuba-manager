import express from 'express';
import { Player } from '../db.js';

const router = express.Router();

// GET all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.findAll();
    res.json(players);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve players' });
  }
});

// GET a specific player by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const player = await Player.findByPk(id);
    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ message: 'Player not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve player' });
  }
});

// CREATE a new player
router.post('/', async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.status(201).json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// UPDATE an existing player
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Player.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedPlayer = await Player.findByPk(id);
      return res.json(updatedPlayer);
    } else {
      return res.status(404).json({ message: 'Player not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE a player
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Player.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Player not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

export default router;