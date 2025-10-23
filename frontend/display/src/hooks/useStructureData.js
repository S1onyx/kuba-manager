import { useEffect, useRef, useState } from 'react';
import { fetchJson } from '../utils/api.js';

export default function useStructureData(scoreboard, displayView) {
  const [structure, setStructure] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const contextRef = useRef({ tournamentId: null });

  useEffect(() => {
    if (displayView !== 'bracket' || !scoreboard?.tournamentId) {
      contextRef.current = { tournamentId: null };
      setStructure(null);
      setError('');
      setLoading(false);
      return;
    }

    const activeTournamentId = scoreboard.tournamentId;
    if (contextRef.current.tournamentId === activeTournamentId && structure) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchJson('/scoreboard/structure')
      .then((data) => {
        if (cancelled) return;
        setStructure(data?.structure ?? null);
        setError('');
        contextRef.current = { tournamentId: activeTournamentId };
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
  }, [displayView, scoreboard?.tournamentId, structure]);

  return {
    structure,
    error,
    loading
  };
}
