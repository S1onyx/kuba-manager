import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIO } from 'socket.io';
import dotenv from 'dotenv';
import scoreboardRoutes from './routes/scoreboard.js';
import setupSocket from './socket.js';
import tournamentRoutes from './routes/tournaments.js';
import publicRoutes from './routes/public.js';
import teamRoutes from './routes/teams.js';
import playerRoutes from './routes/players.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: { origin: '*' }
});

setupSocket(io);

app.use(cors());
app.use(express.json());

app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend ready on port ${PORT}`);
});
