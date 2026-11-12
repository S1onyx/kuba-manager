import { useCallback, useEffect, useRef, useState } from 'react';
import socket from '../socket.js';

const FALLBACK_REFRESH_MS = 30000;

// Lädt Daten und lädt bei `callit:update` für das Turnier (gedrosselt), bei Rückkehr in den Tab und periodisch neu.
export default function useCallitData(loader, tournamentId, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const timerRef = useRef(null);

  const seqRef = useRef(0);

  // Nur die zuletzt gestartete Anfrage darf den Zustand setzen (Kategorie-Wechsel, Socket + Intervall).
  const reload = useCallback(async () => {
    const seq = ++seqRef.current;
    try {
      const data = await loaderRef.current();
      if (seq === seqRef.current) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (seq === seqRef.current) setState((prev) => ({ data: prev.data, error, loading: false }));
      return null;
    }
  }, []);

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: true }));
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, reload, ...deps]);

  useEffect(() => {
    const schedule = () => {
      if (timerRef.current) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        reload();
      }, 400 + Math.random() * 600);
    };
    const onUpdate = (payload) => {
      if (tournamentId ? Number(payload?.tournamentId) === Number(tournamentId) : payload?.reasons?.some((reason) => reason !== 'live' && reason !== 'tips')) {
        schedule();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    socket.on('callit:update', onUpdate);
    socket.on('connect', schedule);
    document.addEventListener('visibilitychange', onVisible);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, FALLBACK_REFRESH_MS);
    return () => {
      socket.off('callit:update', onUpdate);
      socket.off('connect', schedule);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [tournamentId, reload]);

  return { ...state, reload, setData: (updater) => setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater })) };
}
