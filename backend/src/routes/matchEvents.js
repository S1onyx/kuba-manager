import express from 'express';
import { MatchEvent } from '../db.js';

const router = express.Router();

// GET all match events
router.get('/', async (req, res) => {
  try {
    const matchEvents = await MatchEvent.findAll();
    res.json(matchEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve match events' });
  }
});

// GET a specific match event by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const matchEvent = await MatchEvent.findByPk(id);
    if (matchEvent) {
      res.json(matchEvent);
    } else {
      res.status(404).json({ message: 'Match event not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve match event' });
  }
});

// CREATE a new match event
router.post('/', async (req, res) => {
  try {
    const matchEvent = await MatchEvent.create(req.body);
    res.status(201).json(matchEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create match event' });
  }
});

// UPDATE an existing match event
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await MatchEvent.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedMatchEvent = await MatchEvent.findByPk(id);
      return res.json(updatedMatchEvent);
    } else {
      return res.status(404).json({ message: 'Match event not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update match event' });
  }
});

// DELETE a match event
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await MatchEvent.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Match event not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete match event' });
  }
});

export default router;