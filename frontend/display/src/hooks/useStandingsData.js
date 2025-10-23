import { useEffect, useRef, useState } from 'react';
import { fetchJson } from '../utils/api.js';

export default function useStandingsData(scoreboard) {
  const [standings, setStandings] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordedGamesCount, setRecordedGamesCount] = useState(0);
  const contextKeyRef = useRef(null);
  const lastFetchSignatureRef = useRef(null);

  useEffect(() => {
    const contextKey =
      scoreboard?.tournamentId && scoreboard?.stageType === 'group' && scoreboard?.stageLabel
        ? `${scoreboard.tournamentId}::${scoreboard.stageLabel}`
        : null;
    const scoreboardSignature = scoreboard
      ? `${scoreboard.scoreA ?? 0}|${scoreboard.scoreB ?? 0}|${scoreboard.lastUpdated ?? ''}`
      : null;

    if (!contextKey) {
      contextKeyRef.current = null;
      lastFetchSignatureRef.current = null;
      setStandings(null);
      setMeta(null);
      setError('');
      setLoading(false);
      setRecordedGamesCount(0);
      return;
    }

    const shouldFetch =
      contextKeyRef.current !== contextKey ||
      standings === null ||
      lastFetchSignatureRef.current !== scoreboardSignature;

    if (!shouldFetch || !scoreboardSignature) {
      return;
    }

    lastFetchSignatureRef.current = scoreboardSignature;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchJson('/scoreboard/standings');
        if (cancelled) return;

        contextKeyRef.current = contextKey;
        setStandings(data.standings ?? []);
        setMeta({
          tournamentName: data.tournamentName ?? scoreboard?.tournamentName ?? '',
          stageLabel: data.stageLabel ?? scoreboard?.stageLabel
        });
        setRecordedGamesCount(
          Number.isFinite(data.recordedGamesCount) ? Number(data.recordedGamesCount) : 0
        );
        setError('');
      } catch (err) {
        console.error(err);
        if (cancelled) return;
        setStandings(null);
        setMeta(null);
        setRecordedGamesCount(0);
        setError('Tabelle konnte nicht geladen werden.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    scoreboard?.tournamentId,
    scoreboard?.stageType,
    scoreboard?.stageLabel,
    scoreboard?.scoreA,
    scoreboard?.scoreB,
    scoreboard?.lastUpdated
  ]);

  return {
    standings,
    meta,
    error,
    loading,
    recordedGamesCount
  };
}
