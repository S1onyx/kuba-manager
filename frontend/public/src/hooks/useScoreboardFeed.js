import { useCallback, useEffect, useRef, useState } from 'react';
import socket from '../socket.js';
import { fetchCurrentStatus } from '../api.js';
import { REFRESH_INTERVAL_MS } from '../constants.js';

export function useScoreboardFeed({ onScoreboardEvent } = {}) {
  const [scoreboard, setScoreboard] = useState(null);
  const [currentGroupStandings, setCurrentGroupStandings] = useState([]);
  const [recordedGamesCount, setRecordedGamesCount] = useState(0);
  const [currentTournamentMeta, setCurrentTournamentMeta] = useState(null);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCurrentStatus();
      setScoreboard(data.scoreboard ?? null);
      setCurrentGroupStandings(data.currentGroupStandings ?? []);
      setRecordedGamesCount(data.recordedGamesCount ?? 0);
      setCurrentTournamentMeta(data.tournamentMeta ?? null);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Aktueller Spielstand konnte nicht geladen werden.');
      setCurrentTournamentMeta(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refresh]);

  useEffect(() => {
    const handleUpdate = (payload) => {
      setScoreboard((prev) => ({ ...(prev ?? {}), ...(payload ?? {}) }));
      refresh();
      if (typeof onScoreboardEvent === 'function') {
        onScoreboardEvent(payload);
      }
    };

    socket.on('scoreboard:update', handleUpdate);
    return () => {
      socket.off('scoreboard:update', handleUpdate);
    };
  }, [refresh, onScoreboardEvent]);

  return {
    scoreboard,
    currentGroupStandings,
    recordedGamesCount,
    currentTournamentMeta,
    error,
    refresh
  };
}
