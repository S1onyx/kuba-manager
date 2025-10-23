import { useEffect, useState } from 'react';
import socket from '../socket.js';
import { fetchJson } from '../utils/api.js';

export default function useScoreboardData() {
  const [scoreboard, setScoreboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchJson('/scoreboard')
      .then((data) => {
        if (cancelled) return;
        setScoreboard(data);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setError('Scoreboard konnte nicht geladen werden.');
        setScoreboard(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleUpdate = (payload) => {
      setScoreboard(payload);
      setError('');
    };

    socket.on('scoreboard:update', handleUpdate);
    return () => {
      socket.off('scoreboard:update', handleUpdate);
    };
  }, []);

  return { scoreboard, error, loading };
}
