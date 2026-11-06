import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server as SocketIO } from 'socket.io';
import dotenv from 'dotenv';
import scoreboardRoutes from './routes/scoreboard.js';
import setupSocket from './socket.js';
import tournamentRoutes from './routes/tournaments.js';
import publicRoutes from './routes/public.js';
import teamRoutes from './routes/teams.js';
import playerRoutes from './routes/players.js';
import audioRoutes from './routes/audio.js';
import inboundRoutes from './routes/inbound.js';
import authRoutes from './routes/auth.js';
import { getAuthConfig, requireAdmin, requireAdminExcept } from './auth/index.js';
import { getAudioStorageDirectory, initTimerCueSettings } from './services/index.js';
import { getRegistrationAudioDir } from './services/registrations/index.js';

dotenv.config({ quiet: true });

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: { origin: '*' }
});

setupSocket(io);

app.use(cors());
app.use(express.json());

app.use(
  '/media/audio',
  express.static(getAudioStorageDirectory(), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  })
);

app.use(
  '/media/reg-audio',
  express.static(getRegistrationAudioDir(), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  })
);

const displayScoreboardRoutes = [
  ['GET', '/'],
  ['GET', '/standings'],
  ['GET', '/structure'],
  ['POST', '/display']
];

app.use('/api/auth', authRoutes);
app.use('/api/scoreboard', requireAdminExcept(displayScoreboardRoutes), scoreboardRoutes);
app.use('/api/tournaments', requireAdmin, tournamentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/teams', requireAdmin, teamRoutes);
app.use('/api/players', requireAdmin, playerRoutes);
app.use('/api/audio', requireAdmin, audioRoutes);
app.use('/api/inbound', inboundRoutes);

const authConfig = getAuthConfig();
if (!authConfig.passwordHash) {
  console.warn(
    authConfig.devFallback
      ? '[auth] ADMIN_PASSWORD_HASH nicht gesetzt – Entwicklungs-Login mit Standardpasswort aktiv.'
      : '[auth] ADMIN_PASSWORD_HASH nicht gesetzt – Admin-Login ist deaktiviert.'
  );
}

initTimerCueSettings().catch((err) => console.error('Timer-Cue-Einstellungen konnten nicht geladen werden:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Backend ready on port ${PORT}`);
});
