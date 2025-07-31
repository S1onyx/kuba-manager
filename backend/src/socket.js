import { Match, MatchEvent, EventType } from './db.js';
import { get } from './redis.js';

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Starte den Timer für alle laufenden Matches
    startTimers(io);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

export async function publishMatchUpdate(io, matchId, match) {
  // Lade alle Match Events
  const matchEvents = await MatchEvent.findAll({ where: { match_id: matchId } });

  io.emit(`match:${matchId}:update`, {
    match: match,
    events: matchEvents
  });
}

async function startTimers(io) {
  const matches = await Match.findAll();

  matches.forEach(async (match) => {
    if (match.status_id === 2) { // Angenommen 2 bedeutet "läuft"
      startTimer(io, match.id, match.duration_seconds);
    }
  });
}

async function startTimer(io, matchId, durationSeconds) {
  let remainingTime = await get(`match:${matchId}:timer`);
  if (!remainingTime) {
    remainingTime = durationSeconds || 300;
  } else {
    remainingTime = parseInt(remainingTime);
  }

  const timer = setInterval(async () => {
    remainingTime--;

    await get(`match:${matchId}:timer`, remainingTime);
    io.emit(`match:${matchId}:timer:update`, { remainingTime });

    if (remainingTime <= 0) {
      clearInterval(timer);
      console.log('Timer abgelaufen für Match:', matchId);

      // Hier kann die Logik für das automatische Stoppen des Matches eingefügt werden
      const match = await Match.findByPk(matchId);
      match.status_id = 4; // Angenommen 4 bedeutet "abgebrochen"
      await match.save();

      publishMatchUpdate(io, matchId, match);
    }
  }, 1000);
}

export default setupSocket;