import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTournamentSummary } from '../api.js';
import { REFRESH_INTERVAL_MS } from '../constants.js';

export function useTournamentSummary(selectedTournamentId) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const targetIdRef = useRef(null);

  const refresh = useCallback(
    async (explicitId) => {
      const targetId = explicitId ?? targetIdRef.current;
      if (!targetId) {
        setSummary(null);
        setError('');
        return;
      }

      targetIdRef.current = targetId;

      try {
        setLoading(true);
        const data = await fetchTournamentSummary(targetId);
        setSummary(data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Turnierübersicht konnte nicht geladen werden.');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    targetIdRef.current = selectedTournamentId || null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!selectedTournamentId) {
      setSummary(null);
      return undefined;
    }

    refresh(selectedTournamentId);
    intervalRef.current = window.setInterval(() => refresh(selectedTournamentId), REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedTournamentId, refresh]);

  return {
    summary,
    error,
    loading,
    refresh
  };
}
