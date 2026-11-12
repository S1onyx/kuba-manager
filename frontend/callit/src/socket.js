import { io } from 'socket.io-client';
import { BACKEND_BASE_URL } from './api.js';

// Polling-Fallback für Hallen-WLANs, die WebSockets blocken
const socket = io(BACKEND_BASE_URL, { transports: ['websocket', 'polling'], tryAllTransports: true, query: { client: 'callit' } });

export default socket;
