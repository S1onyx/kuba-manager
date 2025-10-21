import { io } from 'socket.io-client';
import { BACKEND_BASE_URL } from './api.js';

const socket = io(BACKEND_BASE_URL, {
  transports: ['websocket']
});

export default socket;
