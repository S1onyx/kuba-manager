import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIO } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import matchStatusRoutes from './routes/matchStatuses.js';
import eventTypeRoutes from './routes/eventTypes.js';
import playerRoutes from './routes/playsers.js'; // Korrigierter Import
import teamRoutes from './routes/teams.js';
import tournamentRoutes from './routes/tournaments.js';
import matchEventRoutes from './routes/matchEvents.js';
import setupSocket, { publishMatchUpdate } from './socket.js';
import { initDatabase } from './db.js'; // Import initDatabase
import { seedDatabase } from './seedData.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: { origin: '*' }
});

setupSocket(io);

// Store the io instance in the app to access it in routes
app.set('socketio', io);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/match-statuses', matchStatusRoutes);
app.use('/api/event-types', eventTypeRoutes);
app.use('/api/players', playerRoutes); // Korrigierte Route
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/match-events', matchEventRoutes);

const PORT = process.env.PORT || 3000;

// Initialisiere die Datenbank
initDatabase().then(() => {
  console.log('Datenbank initialisiert. Starte Seed...');
  return seedDatabase(); // Wichtig: Rückgabe des Promises von seedDatabase()
}).then(() => {
  server.listen(PORT, () => {
    console.log(`Backend ready on port ${PORT}`);
  });
}).catch(err => {
  console.error('Fehler beim Initialisieren oder Seed der Datenbank:', err);
});

export { publishMatchUpdate };