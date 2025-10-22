import { io } from 'socket.io-client';
import { BACKEND_URL } from './config.js';

const socket = io(BACKEND_URL, {
  transports: ['websocket']
});

export default socket;
