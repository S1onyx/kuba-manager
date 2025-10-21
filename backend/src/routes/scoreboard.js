import express from 'express';
import {
  addPenalty,
  addPoints,
  getScoreboardState,
  pauseTimer,
  clearScoreboardTicker,
  removePenalty,
  resetGame,
  resetScores,
  setExtraSeconds,
  setHalftimeSeconds,
  setHalftimePauseSeconds,
  setScoreAbsolute,
  setRemainingSeconds,
  setTeams,
  setMatchContext,
  applyScheduleMatchSelection,
  startTimer,
  normalizeGroupStageLabel,
  setDisplayView
} from '../scoreboard/index.js';
import {
  computeGroupStandings,
  deleteGame,
  getGame,
  getTeam,
  getTournament,
  getTournamentSchedule,
  getTournamentStructureDetails,
  listGames,
  saveGame,
  updateGame
} from '../services/index.js';

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(getScoreboardState());
});

router.post('/teams', async (req, res) => {
  try {
    const {
      teamAName,
      teamBName,
      teamAId,
      teamBId
    } = req.body ?? {};

    const payload = {};
    let provided = false;

    if (teamAId !== undefined && teamAId !== null && teamAId !== '') {
      const numeric = Number(teamAId);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        return res.status(400).json({ message: 'Ungültige Team-ID für Team A.' });
      }
      const team = await getTeam(numeric);
      if (!team) {
        return res.status(404).json({ message: 'Team A wurde nicht gefunden.' });
      }
      payload.teamAId = team.id;
      payload.teamAName = team.name;
      provided = true;
    } else if (typeof teamAName === 'string' && teamAName.trim().length > 0) {
      payload.teamAName = teamAName;
      payload.teamAId = null;
      provided = true;
    }

    if (teamBId !== undefined && teamBId !== null && teamBId !== '') {
      const numeric = Number(teamBId);
      if (!Number.isInteger(numeric) || numeric <= 0) {
        return res.status(400).json({ message: 'Ungültige Team-ID für Team B.' });
      }
      const team = await getTeam(numeric);
      if (!team) {
        return res.status(404).json({ message: 'Team B wurde nicht gefunden.' });
      }
      payload.teamBId = team.id;
      payload.teamBName = team.name;
      provided = true;
    } else if (typeof teamBName === 'string' && teamBName.trim().length > 0) {
      payload.teamBName = teamBName;
      payload.teamBId = null;
      provided = true;
    }

    if (!provided) {
      return res.status(400).json({ message: 'Bitte mindestens ein Team setzen.' });
    }

    const nextState = setTeams(payload);
    res.json(nextState);
  } catch (error) {
    console.error('Teamnamen konnten nicht gesetzt werden:', error);
    res.status(500).json({ message: 'Teamnamen konnten nicht gesetzt werden.' });
  }
});

router.post('/score', (req, res) => {
  const { team, points } = req.body ?? {};

  if (!team || !['a', 'b', 'A', 'B'].includes(team)) {
    return res.status(400).json({ message: 'Ungültiges Team. Erlaubt sind \"A\" oder \"B\".' });
  }

  const numericPoints = Number(points);
  if (!Number.isFinite(numericPoints) || ![1, 2, 3].includes(Math.abs(Math.trunc(numericPoints)))) {
    return res.status(400).json({ message: 'Punkte müssen 1, 2 oder 3 sein.' });
  }

  const signedPoints = Math.sign(numericPoints || 1) * Math.abs(Math.trunc(numericPoints));
  const nextState = addPoints(team, signedPoints);
  res.json(nextState);
});

router.post('/score/set', (req, res) => {
  const { team, score } = req.body ?? {};

  if (!team || !['a', 'b', 'A', 'B'].includes(team)) {
    return res.status(400).json({ message: 'Ungültiges Team. Erlaubt sind \"A\" oder \"B\".' });
  }

  if (!Number.isFinite(Number(score)) || Number(score) < 0) {
    return res.status(400).json({ message: 'score muss eine nicht-negative Zahl sein.' });
  }

  const nextState = setScoreAbsolute(team, Number(score));
  res.json(nextState);
});

router.post('/score/reset', (_req, res) => {
  const nextState = resetScores();
  res.json(nextState);
});

router.post('/start', (_req, res) => {
  const nextState = startTimer();
  res.json(nextState);
});

router.post('/pause', (_req, res) => {
  const nextState = pauseTimer();
  res.json(nextState);
});

router.post('/timer', (req, res) => {
  const { seconds } = req.body ?? {};

  if (!Number.isFinite(Number(seconds))) {
    return res.status(400).json({ message: 'seconds muss eine Zahl sein.' });
  }

  const nextState = setRemainingSeconds(Number(seconds));
  res.json(nextState);
});

router.post('/context', async (req, res) => {
  try {
    const { tournamentId, stageType, stageLabel } = req.body ?? {};
    let resolvedTournamentId = null;
    let resolvedTournamentName = '';

    if (tournamentId !== null && tournamentId !== undefined && tournamentId !== '') {
      const parsedId = Number(tournamentId);
      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
      }

      const tournament = await getTournament(parsedId);
      if (!tournament) {
        return res.status(404).json({ message: 'Turnier nicht gefunden.' });
      }

      resolvedTournamentId = tournament.id;
      resolvedTournamentName = tournament.name;
    }

    if (stageType) {
      const normalizedStageType = String(stageType);
      if (!['group', 'knockout', 'placement'].includes(normalizedStageType)) {
        return res.status(400).json({ message: 'Ungültiger Phasentyp.' });
      }

      const label = String(stageLabel ?? '').trim();
      if (!label) {
        return res.status(400).json({ message: 'Phasenbezeichnung darf nicht leer sein.' });
      }

      const normalizedLabel = normalizedStageType === 'group'
        ? normalizeGroupStageLabel(label)
        : label;

      if (normalizedStageType === 'group' && !normalizedLabel) {
        return res.status(400).json({ message: 'Ungültige Gruppenbezeichnung.' });
      }

      setMatchContext({
        tournamentId: resolvedTournamentId,
        tournamentName: resolvedTournamentName,
        stageType: normalizedStageType,
        stageLabel: normalizedLabel
      });
    } else {
      setMatchContext({
        tournamentId: resolvedTournamentId,
        tournamentName: resolvedTournamentName,
        stageType: null,
        stageLabel: ''
      });
    }

    res.json(getScoreboardState());
  } catch (error) {
    console.error('Match-Kontext konnte nicht gesetzt werden:', error);
    res.status(500).json({ message: 'Match-Kontext konnte nicht gesetzt werden.' });
  }
});

router.post('/display', (req, res) => {
  const { view } = req.body ?? {};
  try {
    const nextState = setDisplayView(view);
    res.json(nextState);
  } catch (error) {
    if (error?.code === 'INVALID_DISPLAY_VIEW') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Anzeige-Modus konnte nicht gesetzt werden:', error);
    res.status(500).json({ message: 'Anzeige-Modus konnte nicht gesetzt werden.' });
  }
});

router.post('/schedule/select', async (req, res) => {
  const { tournamentId, scheduleCode } = req.body ?? {};

  const numericId = Number(tournamentId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return res.status(400).json({ message: 'Ungültige Turnier-ID.' });
  }

  const code = String(scheduleCode ?? '').trim();
  if (!code) {
    return res.status(400).json({ message: 'Ungültiger Spielcode.' });
  }

  try {
    const tournament = await getTournament(numericId);
    if (!tournament) {
      return res.status(404).json({ message: 'Turnier nicht gefunden.' });
    }

    const scheduleEntries = await getTournamentSchedule(tournament.id);
    const match = scheduleEntries.find((entry) => entry.code === code);

    if (!match) {
      return res.status(404).json({ message: 'Spiel konnte im Spielplan nicht gefunden werden.' });
    }

    clearScoreboardTicker();
    const nextState = applyScheduleMatchSelection({
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      phase: match.phase,
      stageLabel: match.stage_label,
      scheduleCode: match.code,
      home: match.home,
      away: match.away
    });

    res.json({
      scoreboard: nextState,
      match: {
        code: match.code,
        phase: match.phase,
        stage_label: match.stage_label,
        result: match.result,
        home: match.home,
        away: match.away
      }
    });
  } catch (error) {
    console.error('Spielplan-Match konnte nicht ausgewählt werden:', error);
    res.status(500).json({ message: 'Spielplan-Match konnte nicht ausgewählt werden.' });
  }
});

router.get('/standings', async (_req, res) => {
  try {
    const snapshot = getScoreboardState();
    if (!snapshot.tournamentId || snapshot.stageType !== 'group' || !snapshot.stageLabel) {
      return res.json({
        standings: [],
        tournamentId: snapshot.tournamentId,
        tournamentName: snapshot.tournamentName,
        stageLabel: snapshot.stageLabel,
        recordedGamesCount: 0
      });
    }

    const { standings, recordedGamesCount } = await computeGroupStandings(snapshot.tournamentId, snapshot.stageLabel, { currentSnapshot: snapshot });
    res.json({
      standings,
      tournamentId: snapshot.tournamentId,
      tournamentName: snapshot.tournamentName,
      stageLabel: snapshot.stageLabel,
      recordedGamesCount
    });
  } catch (error) {
    console.error('Tabelle konnte nicht berechnet werden:', error);
    res.status(500).json({ message: 'Tabelle konnte nicht berechnet werden.' });
  }
});

router.get('/structure', async (_req, res) => {
  try {
    const snapshot = getScoreboardState();
    if (!snapshot.tournamentId) {
      return res.json({
        tournamentId: null,
        tournamentName: snapshot.tournamentName ?? '',
        structure: null
      });
    }

    const structure = await getTournamentStructureDetails(snapshot.tournamentId);
    if (!structure) {
      return res.status(404).json({ message: 'Turnierstruktur nicht gefunden.' });
    }

    res.json({
      tournamentId: snapshot.tournamentId,
      tournamentName: snapshot.tournamentName || structure.tournament?.name || '',
      structure
    });
  } catch (error) {
    console.error('Turnierstruktur konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Turnierstruktur konnte nicht geladen werden.' });
  }
});

router.post('/finish', async (_req, res) => {
  try {
    pauseTimer();
    clearScoreboardTicker();
    const snapshot = getScoreboardState();
    const savedGame = await saveGame(snapshot);
    res.json(savedGame);
  } catch (error) {
    console.error('Spiel konnte nicht gespeichert werden:', error);
    res.status(500).json({ message: 'Spiel konnte nicht gespeichert werden.' });
  }
});

router.post('/game/new', (_req, res) => {
  try {
    const freshState = resetGame();
    res.json(freshState);
  } catch (error) {
    console.error('Neues Spiel konnte nicht vorbereitet werden:', error);
    res.status(500).json({ message: 'Neues Spiel konnte nicht vorbereitet werden.' });
  }
});

router.get('/history', async (_req, res) => {
  try {
    const games = await listGames();
    res.json(games);
  } catch (error) {
    console.error('Historie konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Historie konnte nicht geladen werden.' });
  }
});

router.get('/history/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Spiel-ID.' });
  }

  try {
    const game = await getGame(id);
    if (!game) {
      return res.status(404).json({ message: 'Spiel nicht gefunden.' });
    }
    res.json(game);
  } catch (error) {
    console.error('Spiel konnte nicht geladen werden:', error);
    res.status(500).json({ message: 'Spiel konnte nicht geladen werden.' });
  }
});

router.put('/history/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Spiel-ID.' });
  }

  const {
    team_a,
    team_b,
    score_a,
    score_b,
    extra_seconds,
    extra_elapsed_seconds,
    penalties
  } = req.body ?? {};

  const patch = {};

  if (team_a !== undefined) {
    const trimmed = String(team_a).trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'team_a darf nicht leer sein.' });
    }
    patch.team_a = trimmed;
  }

  if (team_b !== undefined) {
    const trimmed = String(team_b).trim();
    if (!trimmed) {
      return res.status(400).json({ message: 'team_b darf nicht leer sein.' });
    }
    patch.team_b = trimmed;
  }

  if (score_a !== undefined) {
    const numeric = Number(score_a);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return res.status(400).json({ message: 'score_a muss >= 0 sein.' });
    }
    patch.score_a = Math.trunc(numeric);
  }

  if (score_b !== undefined) {
    const numeric = Number(score_b);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return res.status(400).json({ message: 'score_b muss >= 0 sein.' });
    }
    patch.score_b = Math.trunc(numeric);
  }

  if (extra_seconds !== undefined) {
    const numeric = Number(extra_seconds);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return res.status(400).json({ message: 'extra_seconds muss >= 0 sein.' });
    }
    patch.extra_seconds = Math.trunc(numeric);
  }

  if (extra_elapsed_seconds !== undefined) {
    const numeric = Number(extra_elapsed_seconds);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return res.status(400).json({ message: 'extra_elapsed_seconds muss >= 0 sein.' });
    }
    patch.extra_elapsed_seconds = Math.trunc(numeric);
  }

  if (penalties !== undefined) {
    if (typeof penalties !== 'object' || penalties === null) {
      return res.status(400).json({ message: 'penalties muss ein Objekt sein.' });
    }
    patch.penalties = penalties;
  }

  try {
    const updatedGame = await updateGame(id, patch);
    if (!updatedGame) {
      return res.status(404).json({ message: 'Spiel nicht gefunden.' });
    }
    res.json(updatedGame);
  } catch (error) {
    console.error('Spiel konnte nicht aktualisiert werden:', error);
    res.status(500).json({ message: 'Spiel konnte nicht aktualisiert werden.' });
  }
});

router.delete('/history/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Ungültige Spiel-ID.' });
  }

  try {
    const deleted = await deleteGame(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Spiel nicht gefunden.' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Spiel konnte nicht gelöscht werden:', error);
    res.status(500).json({ message: 'Spiel konnte nicht gelöscht werden.' });
  }
});

router.post('/penalties', (req, res) => {
  const { team, name, seconds } = req.body ?? {};

  if (!team || !['a', 'b', 'A', 'B'].includes(team)) {
    return res.status(400).json({ message: 'Ungültiges Team. Erlaubt sind \"A\" oder \"B\".' });
  }

  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) {
    return res.status(400).json({ message: 'seconds muss größer als 0 sein.' });
  }

  const nextState = addPenalty(team, name, Number(seconds));
  res.json(nextState);
});

router.delete('/penalties/:id', (req, res) => {
  const { id } = req.params;
  const nextState = removePenalty(id);
  res.json(nextState);
});

router.post('/halftime', (req, res) => {
  const { seconds } = req.body ?? {};

  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) {
    return res.status(400).json({ message: 'seconds muss >= 0 sein.' });
  }

  const nextState = setHalftimeSeconds(Number(seconds));
  res.json(nextState);
});

router.post('/extra-time', (req, res) => {
  const { seconds } = req.body ?? {};

  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) {
    return res.status(400).json({ message: 'seconds muss >= 0 sein.' });
  }

  const nextState = setExtraSeconds(Number(seconds));
  res.json(nextState);
});

router.post('/halftime/pause', (req, res) => {
  const { seconds } = req.body ?? {};

  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) {
    return res.status(400).json({ message: 'seconds muss >= 0 sein.' });
  }

  const nextState = setHalftimePauseSeconds(Number(seconds));
  res.json(nextState);
});

export default router;
