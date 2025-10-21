import { addSubscriber, removeSubscriber, snapshotState } from './stateStore.js';

export function registerScoreboardSocket(socket) {
  const sendUpdate = (payload) => socket.emit('scoreboard:update', payload);

  addSubscriber(sendUpdate);
  sendUpdate(snapshotState());

  socket.on('disconnect', () => {
    removeSubscriber(sendUpdate);
  });
}
