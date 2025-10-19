import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIO } from 'socket.io';
import dotenv from 'dotenv';
import scoreboardRoutes from './routes/scoreboard.js';
import setupSocket from './socket.js';

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend ready on port ${PORT}`);
});
