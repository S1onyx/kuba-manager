import express from 'express';
import multer from 'multer';
import { getScoreboardState } from '../scoreboard/index.js';
import {
  computeGroupStandings,
  getTournament,
  getTournamentSummary,
  getTournamentSchedule,
  getTournamentTeams,
  groupScheduleByPhase,
  listPublicTournaments
} from '../services/index.js';
import { getAudioFileById } from '../services/audio/index.js';
import { createRegistration, attachAudioFile } from '../services/registrations/index.js';
import { sendRegistrationConfirmation, sendRegistrationNotification } from '../services/mail/index.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

async function withPosterUrl(tournament) {
  if (!tournament || !tournament.poster_file_id) return tournament;
  const file = await getAudioFileById(tournament.poster_file_id);
  return {
    ...tournament,
    poster_url: file ? `/media/audio/${encodeURIComponent(file.file_name)}` : null,
    poster_mime_type: file?.mime_type ?? null
  };
}

const router = express.Router();

function sanitizeScoreboardState(state) {
  if (!state) {
    return null;
  }

  return {
    teamAName: state.teamAName,
    teamBName: state.teamBName,
    teamAId: state.teamAId,
    teamBId: state.teamBId,
    scoreA: state.scoreA,
    scoreB: state.scoreB,
    durationSeconds: state.durationSeconds,
    remainingSeconds: state.remainingSeconds,
    isRunning: state.isRunning,
    halftimeSeconds: state.halftimeSeconds,
    halftimePauseSeconds: state.halftimePauseSeconds,
    halftimePauseRemaining: state.halftimePauseRemaining,
    extraSeconds: state.extraSeconds,
    extraElapsedSeconds: state.extraElapsedSeconds,
    halftimeTriggered: state.halftimeTriggered,
    isHalftimeBreak: state.isHalftimeBreak,
    isExtraTime: state.isExtraTime,
    currentHalf: state.currentHalf,
    tournamentId: state.tournamentId,
    tournamentName: state.tournamentName,
    stageType: state.stageType,
    stageLabel: state.stageLabel,
    tournamentCompleted: state.tournamentCompleted,
    penalties: state.penalties,
    displayView: state.displayView,
    lastUpdated: state.lastUpdated,
    scheduleCode: state.scheduleCode,
    players: state.players,
    playerStats: state.playerStats,
    scoringLog: state.scoringLog,
    penaltyLog: state.penaltyLog
  };
}

router.get('/current', async (_req, res) => {
  const fallback = {
    scoreboard: null,
    currentGroupStandings: [],
    recordedGamesCount: 0,
    tournamentMeta: null
  };

  try {
    const rawState = getScoreboardState();
    const state = sanitizeScoreboardState(rawState);
    let scoreboard = state;
    let currentGroupStandings = [];
    let recordedGamesCount = 0;
    let tournamentMeta = null;

    if (scoreboard?.tournamentId) {
      const tournament = await getTournament(scoreboard.tournamentId);
      tournamentMeta = {
        id: scoreboard.tournamentId,
        name: scoreboard.tournamentName ?? tournament?.name ?? '',
        is_public: Boolean(tournament?.is_public)
      };

      if (!tournament || !tournament.is_public) {
        scoreboard = null;
      } else if (scoreboard.stageType === 'group' && scoreboard.stageLabel) {
        try {
          const result = await computeGroupStandings(scoreboard.tournamentId, scoreboard.stageLabel, {
            currentSnapshot: rawState
          });
          currentGroupStandings = result.standings ?? [];
          recordedGamesCount = result.recordedGamesCount ?? 0;
        } catch (standingsError) {
          console.error('Gruppenberechnung fehlgeschlagen:', standingsError);
        }
      }
    } else if (rawState?.tournamentId) {
      tournamentMeta = {
        id: rawState.tournamentId,
        name: rawState.tournamentName ?? '',
        is_public: false
      };
    }

    res.json({
      scoreboard,
      currentGroupStandings,
      recordedGamesCount,
      tournamentMeta
    });
  } catch (error) {
    console.error('Öffentliche Statusabfrage fehlgeschlagen:', error);
    res.json(fallback);
  }
});

router.get('/tournaments', async (_req, res) => {
  try {
    const tournaments = await listPublicTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Turnierliste konnte nicht geladen werden:', error);
    res.json([]);
  }
});

router.get('/tournaments/:id/detail', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }
  try {
    const tournament = await getTournament(id);
    if (!tournament || !tournament.is_public) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.json(await withPosterUrl(tournament));
  } catch (error) {
    res.status(500).json({ message: 'Turnier konnte nicht geladen werden.' });
  }
});

router.post('/tournaments/:id/register', upload.array('audio', 5), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }
  try {
    const tournament = await getTournament(id);
    if (!tournament || !tournament.is_public || tournament.status !== 'planned') {
      return res.status(404).json({ message: 'Turnier nicht gefunden oder nicht anmeldbar.' });
    }
    if (tournament.registration_closed) {
      return res.status(400).json({ message: 'Die Anmeldung für dieses Turnier ist geschlossen.' });
    }

    const { team_name, contact_name, contact_email, audio_notes } = req.body ?? {};
    let players = [];
    try { players = JSON.parse(req.body.players || '[]'); } catch {}

    if (!team_name?.trim() || !contact_name?.trim() || !contact_email?.trim()) {
      return res.status(400).json({ message: 'Teamname, Kontaktname und E-Mail sind Pflichtfelder.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      return res.status(400).json({ message: 'Ungültige E-Mail-Adresse.' });
    }

    const regId = await createRegistration({
      tournamentId: id,
      teamName: team_name.trim(),
      contactName: contact_name.trim(),
      contactEmail: contact_email.trim(),
      players,
      audioNotes: audio_notes ?? null
    });

    for (const file of req.files ?? []) {
      if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(mp3|ogg|wav|m4a)$/i)) {
        await attachAudioFile(regId, { buffer: file.buffer, originalName: file.originalname, label: file.originalname });
      }
    }

    // Fire-and-forget emails
    sendRegistrationConfirmation({ to: contact_email.trim(), tournamentName: tournament.name, teamName: team_name.trim(), contactName: contact_name.trim(), players }).catch(console.error);
    sendRegistrationNotification({ tournamentName: tournament.name, teamName: team_name.trim(), contactName: contact_name.trim(), contactEmail: contact_email.trim(), players }).catch(console.error);

    res.status(201).json({ id: regId, message: 'Anmeldung erfolgreich eingereicht.' });
  } catch (error) {
    console.error('Anmeldung fehlgeschlagen:', error);
    res.status(500).json({ message: 'Anmeldung konnte nicht gespeichert werden.' });
  }
});

router.get('/tournaments/:id/summary', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const summary = await getTournamentSummary(id);
    if (!summary) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }
    res.json(summary);
  } catch (error) {
    console.error('Turnierübersicht konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnierübersicht konnte nicht geladen werden.' });
  }
});

router.get('/tournaments/:id/schedule', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  try {
    const tournament = await getTournament(id);
    if (!tournament || !tournament.is_public) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }

    const participants = await getTournamentTeams(id);
    const scheduleEntries = await getTournamentSchedule(id);
    const schedule = groupScheduleByPhase(scheduleEntries);

    res.json({
      schedule,
      participants: participants.map((participant) => ({
        slot: participant.slot_number,
        name: participant.team_name,
        placeholder: participant.placeholder
      }))
    });
  } catch (error) {
    console.error('Spielplan konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Spielplan konnte nicht geladen werden.' });
  }
});

export default router;
