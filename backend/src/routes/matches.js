import express from 'express';
import { Match, MatchEvent, EventType, sequelize, MatchStatus } from '../db.js';
import { publishMatchUpdate } from '../socket.js';
import { get, set, del } from '../redis.js';

const router = express.Router();

// Helper function to publish match updates via WebSocket
async function publishMatchState(matchId, io) {
  const match = await Match.findByPk(matchId);
  if (match) {
    publishMatchUpdate(io, matchId, match);
  }
}

// GET all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.findAll();
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve matches' });
  }
});

// GET a specific match by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const match = await Match.findByPk(id);
    if (match) {
      res.json(match);
    } else {
      res.status(404).json({ message: 'Match not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve match' });
  }
});

// CREATE a new match
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const match = await Match.create(req.body, { transaction: t });

    // Starte den Timer automatisch
    const durationSeconds = match.duration_seconds || 300; // Default 5 Minuten
    await set(`match:${match.id}:timer`, durationSeconds);

    // Setze den Match Status auf 'geplant'
    const plannedStatus = await MatchStatus.findOne({ where: { name: 'Scheduled' } });
    if (plannedStatus) {
      match.status_id = plannedStatus.id;
      await match.save({ transaction: t });
    }

    await t.commit();
    res.status(201).json(match);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// UPDATE an existing match
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Match.update(req.body, {
      where: { id: id }
    });
    if (updated) {
      const updatedMatch = await Match.findByPk(id);
      return res.json(updatedMatch);
    } else {
      return res.status(404).json({ message: 'Match not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// DELETE a match
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Match.destroy({
      where: { id: id }
    });
    if (deleted) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ message: 'Match not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Start a match
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Setze den Match Status auf 'läuft'
    const runningStatus = await MatchStatus.findOne({ where: { name: 'In Progress' } });
    if (runningStatus) {
      match.status_id = runningStatus.id;
      await match.save();
    }

    // Starte den Timer
    const durationSeconds = match.duration_seconds || 300; // Default 5 Minuten
    await set(`match:${match.id}:timer`, durationSeconds);

    // Veröffentliche die Match-Aktualisierung über WebSocket
    await publishMatchState(id, req.app.get('socketio'));

    res.json({ message: 'Match started' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to start match' });
  }
});

// Pause a match
router.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Setze den Match Status auf 'pausiert'
    const pausedStatus = await MatchStatus.findOne({ where: { name: 'pausiert' } });
    if (pausedStatus) {
      match.status_id = pausedStatus.id;
      await match.save();
    }

    // Veröffentliche die Match-Aktualisierung über WebSocket
    await publishMatchState(id, req.app.get('socketio'));

    res.json({ message: 'Match paused' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to pause match' });
  }
});

// Resume a match
router.post('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Setze den Match Status auf 'läuft'
    const runningStatus = await MatchStatus.findOne({ where: { name: 'In Progress' } });
    if (runningStatus) {
      match.status_id = runningStatus.id;
      await match.save();
    }

    // Veröffentliche die Match-Aktualisierung über WebSocket
    await publishMatchState(id, req.app.get('socketio'));

    res.json({ message: 'Match resumed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resume match' });
  }
});

// Stop a match
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Setze den Match Status auf 'abgebrochen'
    const abortedStatus = await MatchStatus.findOne({ where: { name: 'Postponed' } });
    if (abortedStatus) {
      match.status_id = abortedStatus.id;
      await match.save();
    }

    // Lösche den Timer aus Redis
    await del(`match:${match.id}:timer`);

    // Veröffentliche die Match-Aktualisierung über WebSocket
    await publishMatchState(id, req.app.get('socketio'));

    res.json({ message: 'Match stopped' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to stop match' });
  }
});

// Add score to a team
router.post('/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const { team, points } = req.body;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (team === 'a') {
      match.score_a = (match.score_a || 0) + points;
    } else if (team === 'b') {
      match.score_b = (match.score_b || 0) + points;
    } else {
      return res.status(400).json({ message: 'Invalid team' });
    }

    await match.save();

    // Logge das Match Event
    const scoreEvent = await EventType.findOne({ where: { name: 'korb' } });
    if (scoreEvent) {
      await MatchEvent.create({
        match_id: match.id,
        event_type_id: scoreEvent.id,
        timestamp: new Date(),
        team_id: team === 'a' ? match.team_a : match.team_b,
        points: points
      });
    }

    // Veröffentliche die Match-Aktualisierung über WebSocket
    await publishMatchState(id, req.app.get('socketio'));

    res.json({ message: 'Score updated', score_a: match.score_a, score_b: match.score_b });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update score' });
  }
});

// Adjust timer
router.post('/:id/timer', async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment } = req.body;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Hole die aktuelle Timer-Zeit aus Redis
    let remainingTime = await get(`match:${match.id}:timer`);
    if (!remainingTime) {
      remainingTime = match.duration_seconds || 300; // Default 5 Minuten
    }

    // Passe die Timer-Zeit an
    remainingTime = parseInt(remainingTime) + adjustment;

    // Stelle sicher, dass die Zeit nicht negativ wird
    if (remainingTime < 0) {
      remainingTime = 0;
    }

    // Speichere die aktualisierte Zeit in Redis
    await set(`match:${match.id}:timer`, remainingTime);

    // Veröffentliche die Match-Aktualisierung über WebSocket
    await publishMatchState(id, req.app.get('socketio'));

    res.json({ message: 'Timer adjusted', remainingTime: remainingTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to adjust timer' });
  }
});

export default router;