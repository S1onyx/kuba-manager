import { registerScoreboardSocket } from './scoreboard/index.js';
import { registerAudioSocket } from './audio/socket.js';

export default function setupSocket(io) {
  io.on('connection', (socket) => {
    // Tippspiel-Clients brauchen nur `callit:update` – kein sekündlicher Scoreboard-Stream.
    if (socket.handshake?.query?.client === 'callit') {
      return;
    }
    console.log('Socket connected:', socket.id);
    registerScoreboardSocket(socket);
    registerAudioSocket(socket);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}
