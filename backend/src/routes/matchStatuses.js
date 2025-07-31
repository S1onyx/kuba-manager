import express from 'express';
import { MatchStatus } from '../db.js';

const router = express.Router();

// GET all match statuses
router.get('/', async (req, res) => {
  try {
    const matchStatuses = await MatchStatus.findAll();
    res.json(matchStatuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve match statuses' });
  }
});

// GET a specific match status by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const matchStatus = await MatchStatus.findByPk(id);
    if (matchStatus) {
      res.json(matchStatus);
    } else {
      res.status(404).json({ message: 'Match status not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve match status' });
  }
});

// CREATE a new match status
router.post('/', async (req, res) => {
  try {
    const matchStatus = await MatchStatus.create(req.body);
    res.status(201).json(matchStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create match status' });
  }
});

// UPDATE an existing match status
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await MatchStatus.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedMatchStatus = await MatchStatus.findByPk(id);
      return res.json(updatedMatchStatus);
    } else {
      return res.status(404).json({ message: 'Match status not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update match status' });
  }
});

// DELETE a match status
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await MatchStatus.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Match status not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete match status' });
  }
});

export default router;