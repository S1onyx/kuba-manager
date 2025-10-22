const audioSockets = new Set();

export function registerAudioSocket(socket) {
  audioSockets.add(socket);
  socket.emit('audio:ready', {
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', () => {
    audioSockets.delete(socket);
  });
}

export function broadcastAudioEvent(payload) {
  audioSockets.forEach((socket) => {
    try {
      socket.emit('audio:play', payload);
    } catch (error) {
      console.error('Audio-Broadcast fehlgeschlagen:', error);
    }
  });
}
