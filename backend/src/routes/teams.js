import express from 'express';
import { Team } from '../db.js';

const router = express.Router();

// GET all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.findAll();
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve teams' });
  }
});

// GET a specific team by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const team = await Team.findByPk(id);
    if (team) {
      res.json(team);
    } else {
      res.status(404).json({ message: 'Team not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve team' });
  }
});

// CREATE a new team
router.post('/', async (req, res) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// UPDATE an existing team
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Team.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedTeam = await Team.findByPk(id);
      return res.json(updatedTeam);
    } else {
      return res.status(404).json({ message: 'Team not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE a team
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Team.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Team not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;