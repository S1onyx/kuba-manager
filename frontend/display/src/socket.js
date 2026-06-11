import { io } from 'socket.io-client';
import { BACKEND_URL } from './config.js';

const socket = io(BACKEND_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000
});

export default socket;
