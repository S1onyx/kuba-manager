import express from 'express';
import { EventType } from '../db.js';

const router = express.Router();

// GET all event types
router.get('/', async (req, res) => {
  try {
    const eventTypes = await EventType.findAll();
    res.json(eventTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve event types' });
  }
});

// GET a specific event type by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const eventType = await EventType.findByPk(id);
    if (eventType) {
      res.json(eventType);
    } else {
      res.status(404).json({ message: 'Event type not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve event type' });
  }
});

// CREATE a new event type
router.post('/', async (req, res) => {
  try {
    const eventType = await EventType.create(req.body);
    res.status(201).json(eventType);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create event type' });
  }
});

// UPDATE an existing event type
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await EventType.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedEventType = await EventType.findByPk(id);
      return res.json(updatedEventType);
    } else {
      return res.status(404).json({ message: 'Event type not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update event type' });
  }
});

// DELETE a event type
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await EventType.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Event type not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete event type' });
  }
});

export default router;