import { useEffect, useState } from 'react';
import { fetchJson } from '../utils/api.js';

export default function useTournamentSummaryData(scoreboard) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cacheKey, setCacheKey] = useState({ tournamentId: null, version: null });

  useEffect(() => {
    if (!scoreboard?.tournamentCompleted || !scoreboard?.tournamentId) {
      setSummary(null);
      setError('');
      setLoading(false);
      setCacheKey({ tournamentId: null, version: null });
      return;
    }

    if (
      summary &&
      cacheKey.tournamentId === scoreboard.tournamentId &&
      cacheKey.version === scoreboard.scheduleVersion
    ) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchJson(`/public/tournaments/${scoreboard.tournamentId}/summary`)
      .then((data) => {
        if (cancelled) return;
        setSummary(data ?? null);
        setError('');
        setCacheKey({
          tournamentId: scoreboard.tournamentId,
          version: scoreboard.scheduleVersion ?? null
        });
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setSummary(null);
        setError('Turnierübersicht konnte nicht geladen werden.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [scoreboard?.tournamentCompleted, scoreboard?.tournamentId, scoreboard?.scheduleVersion]);

  return {
    summary,
    loading,
    error
  };
}
