import { useEffect, useRef, useState } from 'react';
import i18n from '../i18n/index.js';
import { fetchJson } from '../utils/api.js';
import { standingsSignature } from '../utils/standingsSignature.js';

export default function useStandingsData(scoreboard) {
  const [standings, setStandings] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recordedGamesCount, setRecordedGamesCount] = useState(0);
  const contextKeyRef = useRef(null);
  const lastFetchSignatureRef = useRef(null);
  const scoreboardSignature = standingsSignature(scoreboard);

  useEffect(() => {
    const contextKey =
      scoreboard?.tournamentId && scoreboard?.stageType === 'group' && scoreboard?.stageLabel
        ? `${scoreboard.tournamentId}::${scoreboard.stageLabel}`
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

    const hasStandings = standings !== null;
    const contextChanged = contextKeyRef.current !== contextKey;
    const signatureChanged = lastFetchSignatureRef.current !== scoreboardSignature;
    const shouldFetch = contextChanged || !hasStandings || signatureChanged;

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
        setError(i18n.t('errors.loadStandings'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scoreboardSignature]);

  return {
    standings,
    meta,
    error,
    loading,
    recordedGamesCount
  };
}
