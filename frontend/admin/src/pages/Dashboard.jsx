import { useCallback, useEffect, useMemo, useState } from 'react';
import socket from '../socket.js';
import {
  addPenalty,
  deleteHistoryGame,
  fetchHistory,
  fetchScoreboard,
  finishGame,
  mutateScore,
  pauseScoreboardTimer,
  removePenalty,
  resetScoreboard,
  setExtraTime,
  setHalftime,
  setHalftimePause,
  setScoreAbsolute,
  setScoreboardTimer,
  startNewGame,
  startScoreboardTimer,
  updateHistoryGame,
  updateTeams
} from '../utils/api.js';

const POINT_OPTIONS = [1, 2, 3];
const createPenaltyForms = () => ({
  a: { name: '', preset: '60', custom: '' },
  b: { name: '', preset: '60', custom: '' }
});

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

function parseTimerInput(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.includes(':')) {
    const [minPart, secPart = '0'] = trimmed.split(':');
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) {
      return null;
    }
    return Math.max(0, Math.trunc(minutes) * 60 + Math.trunc(seconds));
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.trunc(numeric));
}

export default function Dashboard() {
  const [scoreboard, setScoreboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [teamForm, setTeamForm] = useState({ teamAName: '', teamBName: '' });
  const [teamDirty, setTeamDirty] = useState(false);
  const [manualScores, setManualScores] = useState({ a: '', b: '' });
  const [manualDirty, setManualDirty] = useState({ a: false, b: false });
  const [timerInput, setTimerInput] = useState('');
  const [submittingTimer, setSubmittingTimer] = useState(false);
  const [penaltyForms, setPenaltyForms] = useState(() => createPenaltyForms());
  const [halftimeInput, setHalftimeInput] = useState('');
  const [extraTimeInput, setExtraTimeInput] = useState('');
  const [halftimeDirty, setHalftimeDirty] = useState(false);
  const [extraDirty, setExtraDirty] = useState(false);
  const [halftimePauseInput, setHalftimePauseInput] = useState('');
  const [halftimePauseDirty, setHalftimePauseDirty] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [activeTab, setActiveTab] = useState('control');
  const [editingGameId, setEditingGameId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    fetchHistory()
      .then((data) => {
        setHistory(data);
        setHistoryError('');
      })
      .catch(() => {
        setHistoryError('Historie konnte nicht geladen werden.');
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, []);

  useEffect(() => {
    let active = true;

    fetchScoreboard()
      .then((data) => {
        if (!active) return;
        setScoreboard(data);
        setTeamForm({ teamAName: data.teamAName ?? '', teamBName: data.teamBName ?? '' });
        setManualScores({
          a: String(data.scoreA ?? 0),
          b: String(data.scoreB ?? 0)
        });
        setManualDirty({ a: false, b: false });
        setPenaltyForms(createPenaltyForms());
        setHalftimeInput(formatTime(data.halftimeSeconds ?? 0));
        setHalftimePauseInput(formatTime(data.halftimePauseSeconds ?? 0));
        setHalftimePauseDirty(false);
        setExtraTimeInput(formatTime(data.extraSeconds ?? 0));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Scoreboard konnte nicht geladen werden.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleUpdate = (payload) => {
      setScoreboard(payload);
      if (!teamDirty) {
        setTeamForm({
          teamAName: payload.teamAName ?? '',
          teamBName: payload.teamBName ?? ''
        });
      }
      if (!halftimeDirty) {
        setHalftimeInput(formatTime(payload.halftimeSeconds ?? 0));
      }
      if (!halftimePauseDirty) {
        setHalftimePauseInput(formatTime(payload.halftimePauseSeconds ?? 0));
      }
      if (!extraDirty) {
        setExtraTimeInput(formatTime(payload.extraSeconds ?? 0));
      }
      setManualScores((prev) => {
        let next = prev;
        if (!manualDirty.a) {
          const target = String(payload.scoreA ?? 0);
          if (prev.a !== target) {
            next = next === prev ? { ...prev } : next;
            next.a = target;
          }
        }
        if (!manualDirty.b) {
          const target = String(payload.scoreB ?? 0);
          if (prev.b !== target) {
            next = next === prev ? { ...prev } : next;
            next.b = target;
          }
        }
        return next;
      });
    };

    socket.on('scoreboard:update', handleUpdate);

    return () => {
      socket.off('scoreboard:update', handleUpdate);
    };
  }, [teamDirty, halftimeDirty, halftimePauseDirty, extraDirty, manualDirty]);

  const formattedRemaining = useMemo(() => formatTime(scoreboard?.remainingSeconds ?? 0), [scoreboard?.remainingSeconds]);
  const statusLabel = useMemo(() => {
    if (scoreboard?.isHalftimeBreak) return 'Halbzeitpause';
    if (scoreboard?.isExtraTime) return scoreboard?.isRunning ? 'Nachspielzeit' : 'Nachspielzeit (Pause)';
    return scoreboard?.isRunning ? 'läuft' : 'pausiert';
  }, [scoreboard?.isHalftimeBreak, scoreboard?.isExtraTime, scoreboard?.isRunning]);

  function updateMessage(type, message) {
    if (type === 'error') {
      setError(message);
      setInfo('');
    } else {
      setInfo(message);
      setError('');
    }
  }

  function handleTeamInputChange(field, value) {
    setTeamDirty(true);
    setTeamForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleTeamSubmit(event) {
    event.preventDefault();

    const payload = {};
    if (teamForm.teamAName.trim()) {
      payload.teamAName = teamForm.teamAName;
    }
    if (teamForm.teamBName.trim()) {
      payload.teamBName = teamForm.teamBName;
    }

    if (Object.keys(payload).length === 0) {
      updateMessage('error', 'Bitte mindestens einen Teamnamen ausfüllen.');
      return;
    }

    try {
      await updateTeams(payload);
      setTeamDirty(false);
      updateMessage('info', 'Teamnamen aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Teamnamen konnten nicht gespeichert werden.');
    }
  }

  async function handleScore(team, points) {
    try {
      await mutateScore(team, points);
      updateMessage('info', `${points > 0 ? '+' : ''}${points} Punkte für Team ${team.toUpperCase()}.`);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Punkte konnten nicht aktualisiert werden.');
    }
  }

  function handleManualScoreChange(team, value) {
    setManualScores((prev) => ({ ...prev, [team]: value }));
    setManualDirty((prev) => ({ ...prev, [team]: true }));
  }

  async function handleManualScoreSubmit(event, team) {
    event.preventDefault();
    const rawValue = manualScores[team];
    const numeric = Number(rawValue);

    if (!Number.isFinite(numeric) || numeric < 0) {
      updateMessage('error', 'Bitte einen gültigen Wert (>= 0) eingeben.');
      return;
    }

    try {
      await setScoreAbsolute(team, Math.trunc(numeric));
      setManualDirty((prev) => ({ ...prev, [team]: false }));
      updateMessage('info', `Punktestand für Team ${team.toUpperCase()} gesetzt.`);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Punktestand konnte nicht gesetzt werden.');
    }
  }

  async function handleResetScores() {
    try {
      await resetScoreboard();
      setManualDirty({ a: false, b: false });
      updateMessage('info', 'Punktestand zurückgesetzt.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Punktestand konnte nicht zurückgesetzt werden.');
    }
  }

  function handlePenaltyFormChange(teamKey, field, value) {
    setPenaltyForms((prev) => ({
      ...prev,
      [teamKey]: { ...prev[teamKey], [field]: value }
    }));
  }

  function resolvePenaltyDuration(form) {
    if (form.preset === 'custom') {
      const seconds = parseTimerInput(form.custom);
      return seconds;
    }
    const presetSeconds = Number(form.preset);
    if (!Number.isFinite(presetSeconds) || presetSeconds <= 0) {
      return null;
    }
    return presetSeconds;
  }

  async function handlePenaltySubmit(event, teamKey) {
    event.preventDefault();
    const form = penaltyForms[teamKey];
    const seconds = resolvePenaltyDuration(form);

    if (seconds === null || seconds <= 0) {
      updateMessage('error', 'Bitte eine gültige Zeit für die Zeitstrafe angeben.');
      return;
    }

    try {
      await addPenalty(teamKey, form.name, seconds);
      setPenaltyForms((prev) => ({ ...prev, [teamKey]: { name: '', preset: '60', custom: '' } }));
      updateMessage('info', `Zeitstrafe für Team ${teamKey.toUpperCase()} hinzugefügt.`);
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Zeitstrafe konnte nicht hinzugefügt werden.');
    }
  }

  async function handlePenaltyRemove(id) {
    try {
      await removePenalty(id);
      updateMessage('info', 'Zeitstrafe entfernt.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Zeitstrafe konnte nicht entfernt werden.');
    }
  }

  async function handleHalftimeSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(halftimeInput);
    if (seconds === null || seconds < 0) {
      updateMessage('error', 'Bitte eine gültige Halbzeitzeit eingeben (z.B. 10:00 oder 600).');
      return;
    }

    try {
      await setHalftime(seconds);
      setHalftimeDirty(false);
      updateMessage('info', 'Halbzeit aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Halbzeit konnte nicht gespeichert werden.');
    }
  }

  async function handleHalftimePauseSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(halftimePauseInput);
    if (seconds === null || seconds < 0) {
      updateMessage('error', 'Bitte eine gültige Halbzeitpausen-Dauer eingeben (z.B. 05:00 oder 300).');
      return;
    }

    try {
      await setHalftimePause(seconds);
      setHalftimePauseDirty(false);
      updateMessage('info', 'Halbzeitpause aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Halbzeitpause konnte nicht gespeichert werden.');
    }
  }

  async function handleExtraTimeSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(extraTimeInput);
    if (seconds === null || seconds < 0) {
      updateMessage('error', 'Bitte eine gültige Nachspielzeit eingeben (z.B. 02:00 oder 120).');
      return;
    }

    try {
      await setExtraTime(seconds);
      setExtraDirty(false);
      updateMessage('info', 'Nachspielzeit aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Nachspielzeit konnte nicht gespeichert werden.');
    }
  }

  async function handleTimerSubmit(event) {
    event.preventDefault();
    const seconds = parseTimerInput(timerInput);
    if (seconds === null) {
      updateMessage('error', 'Bitte eine gültige Zeit eingeben (z.B. 10:00 oder 600).');
      return;
    }

    try {
      setSubmittingTimer(true);
      await setScoreboardTimer(seconds);
      setTimerInput('');
      updateMessage('info', 'Spielzeit aktualisiert.');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spielzeit konnte nicht gespeichert werden.');
    } finally {
      setSubmittingTimer(false);
    }
  }

  async function handleStart() {
    try {
      await startScoreboardTimer();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spielzeit konnte nicht gestartet werden.');
    }
  }

  async function handlePause() {
    try {
      await pauseScoreboardTimer();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spielzeit konnte nicht pausiert werden.');
    }
  }

  async function handleFinishGame() {
    if (!window.confirm('Spielstand speichern und Spiel beenden?')) {
      return;
    }

    try {
      await finishGame();
      setManualDirty({ a: false, b: false });
      updateMessage('info', 'Spiel gespeichert.');
      loadHistory();
      setActiveTab('history');
      cancelHistoryEdit();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht gespeichert werden.');
    }
  }

  async function handleNewGame() {
    try {
      await startNewGame();
      setTeamDirty(false);
      setManualDirty({ a: false, b: false });
      setPenaltyForms(createPenaltyForms());
      setHalftimeDirty(false);
      setHalftimePauseDirty(false);
      setExtraDirty(false);
      setTimerInput('');
      updateMessage('info', 'Neues Spiel vorbereitet.');
      loadHistory();
      setActiveTab('control');
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Neues Spiel konnte nicht gestartet werden.');
    }
  }

  function startHistoryEdit(game) {
    setEditingGameId(game.id);
    setEditForm({
      team_a: game.team_a,
      team_b: game.team_b,
      score_a: String(game.score_a),
      score_b: String(game.score_b),
      extra_seconds: game.extra_seconds ? formatTime(game.extra_seconds) : '',
      extra_elapsed_seconds: game.extra_elapsed_seconds ? formatTime(game.extra_elapsed_seconds) : '',
      penalty_count_a: String(game.penalties?.a?.length ?? 0),
      penalty_count_b: String(game.penalties?.b?.length ?? 0)
    });
  }

  function handleHistoryEditChange(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function cancelHistoryEdit() {
    setEditingGameId(null);
    setEditForm(null);
  }

  async function handleHistoryEditSubmit(event) {
    event.preventDefault();
    if (!editingGameId || !editForm) return;

    const payload = {};

    const teamA = editForm.team_a?.trim();
    if (!teamA) {
      updateMessage('error', 'Team A darf nicht leer sein.');
      return;
    }
    payload.team_a = teamA;

    const teamB = editForm.team_b?.trim();
    if (!teamB) {
      updateMessage('error', 'Team B darf nicht leer sein.');
      return;
    }
    payload.team_b = teamB;

    const scoreA = Number(editForm.score_a);
    if (!Number.isFinite(scoreA) || scoreA < 0) {
      updateMessage('error', 'Score Team A muss >= 0 sein.');
      return;
    }
    payload.score_a = Math.trunc(scoreA);

    const scoreB = Number(editForm.score_b);
    if (!Number.isFinite(scoreB) || scoreB < 0) {
      updateMessage('error', 'Score Team B muss >= 0 sein.');
      return;
    }
    payload.score_b = Math.trunc(scoreB);

    const extraSecondsInput = editForm.extra_seconds?.trim();
    if (extraSecondsInput) {
      const parsed = parseTimerInput(extraSecondsInput);
      if (parsed === null) {
        updateMessage('error', 'Nachspielzeit (geplant) ist ungültig.');
        return;
      }
      payload.extra_seconds = parsed;
    }

    const extraElapsedInput = editForm.extra_elapsed_seconds?.trim();
    if (extraElapsedInput) {
      const parsed = parseTimerInput(extraElapsedInput);
      if (parsed === null) {
        updateMessage('error', 'Nachspielzeit (gelaufen) ist ungültig.');
        return;
      }
      payload.extra_elapsed_seconds = parsed;
    }

    const penaltyCountA = Number(editForm.penalty_count_a);
    const penaltyCountB = Number(editForm.penalty_count_b);
    if (!Number.isFinite(penaltyCountA) || penaltyCountA < 0) {
      updateMessage('error', 'Strafen Team A muss >= 0 sein.');
      return;
    }
    if (!Number.isFinite(penaltyCountB) || penaltyCountB < 0) {
      updateMessage('error', 'Strafen Team B muss >= 0 sein.');
      return;
    }

    payload.penalties = {
      a: Array.from({ length: Math.trunc(penaltyCountA) }, (_, idx) => ({ id: `a-${idx}`, isExpired: true })),
      b: Array.from({ length: Math.trunc(penaltyCountB) }, (_, idx) => ({ id: `b-${idx}`, isExpired: true }))
    };

    try {
      await updateHistoryGame(editingGameId, payload);
      updateMessage('info', 'Spiel aktualisiert.');
      cancelHistoryEdit();
      loadHistory();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht gespeichert werden.');
    }
  }

  async function handleHistoryDelete(id) {
    if (!window.confirm('Gespeichertes Spiel wirklich löschen?')) {
      return;
    }

    try {
      await deleteHistoryGame(id);
      if (editingGameId === id) {
        cancelHistoryEdit();
      }
      updateMessage('info', 'Spiel gelöscht.');
      loadHistory();
    } catch (err) {
      console.error(err);
      updateMessage('error', 'Spiel konnte nicht gelöscht werden.');
    }
  }

  if (loading) {
    return <p>Lade Scoreboard...</p>;
  }

  if (!scoreboard) {
    return <p>Scoreboard-Daten nicht verfügbar.</p>;
  }

  const controlContent = (
    <>
      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Teamnamen</h3>
        <form onSubmit={handleTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label>
            Team A
            <input
              value={teamForm.teamAName}
              onChange={(event) => handleTeamInputChange('teamAName', event.target.value)}
              placeholder="Team A Name"
            />
          </label>
          <label>
            Team B
            <input
              value={teamForm.teamBName}
              onChange={(event) => handleTeamInputChange('teamBName', event.target.value)}
              placeholder="Team B Name"
            />
          </label>
          <button type="submit">Speichern</button>
        </form>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Punkte</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {['a', 'b'].map((teamKey) => {
            const isA = teamKey === 'a';
            const teamName = isA ? scoreboard.teamAName : scoreboard.teamBName;
            const score = isA ? scoreboard.scoreA : scoreboard.scoreB;
            return (
              <div key={teamKey}>
                <p style={{ marginBottom: '0.5rem' }}>{teamName}: {score}</p>
                {POINT_OPTIONS.map((value) => (
                  <button key={`${teamKey}-${value}`} onClick={() => handleScore(teamKey, value)} style={{ marginRight: '0.5rem' }}>
                    +{value}
                  </button>
                ))}
                <div style={{ marginTop: '0.5rem' }}>
                  {POINT_OPTIONS.map((value) => (
                    <button key={`${teamKey}-minus-${value}`} onClick={() => handleScore(teamKey, -value)} style={{ marginRight: '0.5rem' }}>
                      -{value}
                    </button>
                  ))}
                </div>
                <form onSubmit={(event) => handleManualScoreSubmit(event, teamKey)} style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={manualScores[teamKey]}
                    onChange={(event) => handleManualScoreChange(teamKey, event.target.value)}
                    style={{ width: '5rem' }}
                  />
                  <button type="submit">Setzen</button>
                </form>
              </div>
            );
          })}
        </div>
        <button onClick={handleResetScores} style={{ marginTop: '1rem' }}>Punkte zurücksetzen</button>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Spielzeit</h3>
        <p style={{ marginBottom: '0.5rem' }}>Restzeit: {formattedRemaining} ({statusLabel})</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleStart} disabled={scoreboard.isRunning}>Start</button>
          <button onClick={handlePause} disabled={!scoreboard.isRunning}>Pause</button>
        </div>
        <p style={{ marginTop: '0.5rem' }}>Aktuelle Halbzeit: {scoreboard.currentHalf ?? 1}</p>
        {scoreboard.isHalftimeBreak && (
          <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#b00020' }}>
            Halbzeitpause aktiv – {formatTime(scoreboard.halftimePauseRemaining ?? 0)}
          </p>
        )}
        {(scoreboard.extraSeconds ?? 0) > 0 || (scoreboard.extraElapsedSeconds ?? 0) > 0 ? (
          <div style={{ marginTop: '0.25rem' }}>
            <p>Nachspielzeit (geplant): {formatTime(scoreboard.extraSeconds ?? 0)}</p>
            <p>Nachspielzeit (Stopwatch): {formatTime(scoreboard.extraElapsedSeconds ?? 0)}</p>
          </div>
        ) : null}
        <form onSubmit={handleTimerSubmit} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            value={timerInput}
            onChange={(event) => setTimerInput(event.target.value)}
            placeholder="z.B. 10:00 oder 600"
          />
          <button type="submit" disabled={submittingTimer}>Zeit setzen</button>
        </form>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleFinishGame} style={{ background: '#d32f2f', color: '#fff' }}>
            Spiel beenden &amp; speichern
          </button>
          <button onClick={handleNewGame}>Neues Spiel vorbereiten</button>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleHalftimeSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>
              Halbzeit bei
              <input
                style={{ marginLeft: '0.5rem' }}
                value={halftimeInput}
                onChange={(event) => {
                  setHalftimeInput(event.target.value);
                  setHalftimeDirty(true);
                }}
                placeholder="z.B. 05:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>

          <form onSubmit={handleHalftimePauseSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>
              Halbzeitpause
              <input
                style={{ marginLeft: '0.5rem' }}
                value={halftimePauseInput}
                onChange={(event) => {
                  setHalftimePauseInput(event.target.value);
                  setHalftimePauseDirty(true);
                }}
                placeholder="z.B. 01:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>

          <form onSubmit={handleExtraTimeSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label>
              Nachspielzeit
              <input
                style={{ marginLeft: '0.5rem' }}
                value={extraTimeInput}
                onChange={(event) => {
                  setExtraTimeInput(event.target.value);
                  setExtraDirty(true);
                }}
                placeholder="z.B. 02:00"
              />
            </label>
            <button type="submit">Speichern</button>
          </form>
        </div>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h3>Zeitstrafen</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {['a', 'b'].map((teamKey) => {
            const penalties = scoreboard?.penalties?.[teamKey] ?? [];
            const form = penaltyForms[teamKey];
            const teamName = teamKey === 'a' ? scoreboard.teamAName : scoreboard.teamBName;

            return (
              <div key={teamKey} style={{ minWidth: '260px', flex: '1 1 260px' }}>
                <h4>{teamName}</h4>
                <form onSubmit={(event) => handlePenaltySubmit(event, teamKey)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    value={form.name}
                    onChange={(event) => handlePenaltyFormChange(teamKey, 'name', event.target.value)}
                    placeholder="Name (z.B. Jonas)"
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label>
                      Dauer
                      <select
                        style={{ marginLeft: '0.5rem' }}
                        value={form.preset}
                        onChange={(event) => handlePenaltyFormChange(teamKey, 'preset', event.target.value)}
                      >
                        <option value="60">1 Minute</option>
                        <option value="120">2 Minuten</option>
                        <option value="custom">Individuell</option>
                      </select>
                    </label>
                    {form.preset === 'custom' && (
                      <input
                        style={{ flex: '1 1 auto' }}
                        value={form.custom}
                        onChange={(event) => handlePenaltyFormChange(teamKey, 'custom', event.target.value)}
                        placeholder="MM:SS oder Sekunden"
                      />
                    )}
                  </div>
                  <button type="submit">Zeitstrafe hinzufügen</button>
                </form>

                <ul style={{ marginTop: '1rem', padding: 0, listStyle: 'none' }}>
                  {penalties.length === 0 && <li style={{ color: '#666' }}>Keine aktiven Zeitstrafen</li>}
                  {penalties.map((penalty) => (
                    <li
                      key={penalty.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.25rem 0',
                        opacity: penalty.isExpired ? 0.6 : 1
                      }}
                    >
                      <span>
                        {penalty.name} – {penalty.isExpired ? 'abgelaufen' : formatTime(penalty.remainingSeconds)}
                      </span>
                      <button type="button" onClick={() => handlePenaltyRemove(penalty.id)}>
                        Entfernen
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );

  const historyContent = (
    <section style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Historie</h3>
        <button type="button" onClick={loadHistory}>Aktualisieren</button>
      </div>
      {historyLoading ? (
        <p>Lade gespeicherte Spiele...</p>
      ) : historyError ? (
        <p style={{ color: 'crimson' }}>{historyError}</p>
      ) : history.length === 0 ? (
        <p>Noch keine Spiele gespeichert.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {history.map((game) => {
            const penalties = game.penalties ?? { a: [], b: [] };
            const plannedExtra = game.extra_seconds > 0 ? `+${formatTime(game.extra_seconds)}` : '—';
            const playedExtra = game.extra_elapsed_seconds > 0 ? formatTime(game.extra_elapsed_seconds) : '—';
            const isEditing = editingGameId === game.id;
            return (
              <article
                key={game.id}
                style={{
                  border: '1px solid rgba(0,0,0,0.15)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.02)'
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>#{game.id}</strong>
                  <span>{formatDateTime(game.created_at)}</span>
                </header>

                {isEditing && editForm ? (
                  <form onSubmit={handleHistoryEditSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Team A</label>
                      <input value={editForm.team_a} onChange={(event) => handleHistoryEditChange('team_a', event.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Team B</label>
                      <input value={editForm.team_b} onChange={(event) => handleHistoryEditChange('team_b', event.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Score Team A</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.score_a}
                        onChange={(event) => handleHistoryEditChange('score_a', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Score Team B</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.score_b}
                        onChange={(event) => handleHistoryEditChange('score_b', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Nachspielzeit (geplant)</label>
                      <input
                        value={editForm.extra_seconds}
                        onChange={(event) => handleHistoryEditChange('extra_seconds', event.target.value)}
                        placeholder="MM:SS oder Sekunden"
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Nachspielzeit (gelaufen)</label>
                      <input
                        value={editForm.extra_elapsed_seconds}
                        onChange={(event) => handleHistoryEditChange('extra_elapsed_seconds', event.target.value)}
                        placeholder="MM:SS oder Sekunden"
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Strafen Team A (Anzahl)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.penalty_count_a}
                        onChange={(event) => handleHistoryEditChange('penalty_count_a', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <label>Strafen Team B (Anzahl)</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.penalty_count_b}
                        onChange={(event) => handleHistoryEditChange('penalty_count_b', event.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit">Speichern</button>
                      <button type="button" onClick={cancelHistoryEdit}>Abbrechen</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {game.team_a} {game.score_a} : {game.score_b} {game.team_b}
                    </p>
                    <p style={{ margin: 0 }}>
                      Spielzeit: {formatTime(game.duration_seconds)} · Halbzeit bei {formatTime(game.halftime_seconds)} · Pause {formatTime(game.halftime_pause_seconds)}
                    </p>
                    <p style={{ margin: 0 }}>
                      Nachspielzeit geplant: {plannedExtra} · Gelaufen: {playedExtra}
                    </p>
                    <p style={{ margin: 0 }}>
                      Strafen – {game.team_a}: {penalties.a?.length ?? 0} · {game.team_b}: {penalties.b?.length ?? 0}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => startHistoryEdit(game)}>Bearbeiten</button>
                      <button type="button" onClick={() => handleHistoryDelete(game.id)} style={{ background: '#d32f2f', color: '#fff' }}>
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const tabs = [
    { id: 'control', label: 'Steuerung' },
    { id: 'history', label: 'Historie' }
  ];

  const tabButtonStyle = (active) => ({
    padding: '0.6rem 1.2rem',
    borderRadius: '999px',
    border: '1px solid #0b1a2b',
    background: active ? '#0b1a2b' : 'transparent',
    color: active ? '#fff' : '#0b1a2b',
    fontWeight: 600,
    cursor: 'pointer'
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h2 style={{ margin: 0, fontSize: '2rem' }}>Scoreboard</h2>
        {error && <p style={{ color: 'crimson', marginTop: '0.5rem' }}>{error}</p>}
        {info && <p style={{ color: 'green', marginTop: '0.5rem' }}>{info}</p>}
      </header>

      <nav style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={tabButtonStyle(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeTab === 'control' ? controlContent : historyContent}
      </div>
    </div>
  );
}
