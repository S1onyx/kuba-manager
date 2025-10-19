import { registerScoreboardSocket } from './scoreboardState.js';

export default function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    registerScoreboardSocket(socket);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}
