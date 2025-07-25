import express from 'express';
import withAuth from '../middleware/withAuth.js';
const router = express.Router();

// Dummy GET
router.get('/', (req, res) => {
  res.json([{ id: 1, teamA: 'Red', teamB: 'Blue', score: '12:9' }]);
});

// Geschützte Route
router.post('/', withAuth, (req, res) => {
  const data = req.body;
  res.status(201).json({ message: 'Match created', data });
});

export default router;