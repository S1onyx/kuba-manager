import { useEffect, useRef, useState } from 'react';
import { fetchJson } from '../utils/api.js';

export default function useStructureData(scoreboard, displayView) {
  const [structure, setStructure] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const contextRef = useRef({ tournamentId: null, version: null });

  const activeTournamentId = scoreboard?.tournamentId ?? null;
  const scheduleVersion = Number.isFinite(Number(scoreboard?.scheduleVersion))
    ? Number(scoreboard.scheduleVersion)
    : 0;

  useEffect(() => {
    if (displayView !== 'bracket' || !activeTournamentId) {
      contextRef.current = { tournamentId: null, version: null };
      setStructure(null);
      setError('');
      setLoading(false);
      return;
    }

    const alreadyLoaded =
      structure &&
      contextRef.current.tournamentId === activeTournamentId &&
      contextRef.current.version === scheduleVersion;
    if (alreadyLoaded) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchJson('/scoreboard/structure')
      .then((data) => {
        if (cancelled) return;
        setStructure(data?.structure ?? null);
        setError('');
        contextRef.current = { tournamentId: activeTournamentId, version: scheduleVersion };
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setStructure(null);
        setError('Turnierstruktur konnte nicht geladen werden.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [displayView, activeTournamentId, scheduleVersion, structure]);

  return {
    structure,
    error,
    loading
  };
}
