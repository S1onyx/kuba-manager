import express from 'express';
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
