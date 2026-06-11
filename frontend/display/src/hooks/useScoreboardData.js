import { useCallback, useEffect, useState } from 'react';
import socket from '../socket.js';
import { fetchJson } from '../utils/api.js';

export default function useScoreboardData() {
  const [scoreboard, setScoreboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchScoreboard = useCallback(() => {
    fetchJson('/scoreboard')
      .then((data) => {
        setScoreboard(data);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('Scoreboard konnte nicht geladen werden.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchScoreboard();
  }, [fetchScoreboard]);

  useEffect(() => {
    const handleUpdate = (payload) => {
      setScoreboard(payload);
      setError('');
      setLoading(false);
    };

    // Re-fetch full state on reconnect in case updates were missed while disconnected
    const handleReconnect = () => {
      fetchScoreboard();
    };

    socket.on('scoreboard:update', handleUpdate);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('scoreboard:update', handleUpdate);
      socket.off('reconnect', handleReconnect);
    };
  }, [fetchScoreboard]);

  return { scoreboard, error, loading };
}
