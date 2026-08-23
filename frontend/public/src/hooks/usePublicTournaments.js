import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPublicTournaments } from '../api.js';
import i18n from '../i18n/index.js';
import { REFRESH_INTERVAL_MS } from '../constants.js';

export function usePublicTournaments() {
  const [publicTournaments, setPublicTournaments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }
    fetchingRef.current = true;

    if (!initializedRef.current) {
      setLoading(true);
    }

    try {
      const data = await fetchPublicTournaments();
      setPublicTournaments(Array.isArray(data) ? data : []);
      setError('');
      initializedRef.current = true;
    } catch (err) {
      console.error(err);
      setError(i18n.t('error.loadTournaments'));
    } finally {
      initializedRef.current = true;
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = window.setInterval(refresh, REFRESH_INTERVAL_MS * 2);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refresh]);

  return {
    publicTournaments,
    error,
    loading,
    refresh
  };
}
