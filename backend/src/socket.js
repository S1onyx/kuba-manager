import { Match, MatchEvent } from './db.js';

export default function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('match:start', async (data) => {
      console.log('Match Start:', data);
      const { matchId, startTime, durationSeconds } = data;

      // Match starten (Status ändern)
      try {
        const match = await Match.findByPk(matchId);
        if (!match) {
          console.log('Match not found');
          return;
        }

        match.status_id = 1; // Angenommen 1 bedeutet "running"
        await match.save();

        io.emit('match:start', { matchId, startTime, durationSeconds });

        // Timer starten (vereinfacht)
        startTimer(io, matchId, durationSeconds);
      } catch (error) {
        console.error('Fehler beim Starten des Matches:', error);
      }
    });

    socket.on('match:pause', (data) => {
      console.log('Match Pause:', data);
      io.emit('match:pause', data);
      // Hier sollte die Logik zum Pausieren des Timers implementiert werden
    });

    socket.on('match:resume', (data) => {
      console.log('Match Resume:', data);
      io.emit('match:resume', data);
      // Hier sollte die Logik zum Fortsetzen des Timers implementiert werden
    });

    socket.on('match:stop', (data) => {
      console.log('Match Stop:', data);
      io.emit('match:stop', data);
      // Hier sollte die Logik zum Stoppen des Timers implementiert werden
    });

    socket.on('score:update', (data) => {
      console.log('Score Update:', data);
      io.emit('score:update', data);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

function startTimer(io, matchId, durationSeconds) {
  let remainingTime = durationSeconds;

  const timer = setInterval(() => {
    remainingTime--;
    io.emit('timer:update', { matchId: matchId, remainingTime: remainingTime });

    if (remainingTime <= 0) {
      clearInterval(timer);
      console.log('Timer abgelaufen für Match:', matchId);
      // Hier kann die Logik für das automatische Stoppen des Matches eingefügt werden
    }
  }, 1000);
}