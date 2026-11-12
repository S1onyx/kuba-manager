import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, AUTH_EXPIRED_EVENT, getStoredSession, storeSession } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());

  useEffect(() => {
    const onExpired = () => setSession(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    if (!session?.token) return;
    api
      .me()
      .then(({ user }) => {
        const next = { ...getStoredSession(), user };
        storeSession(next);
        setSession(next);
      })
      .catch(() => {});
    // nur beim Start prüfen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySession = useCallback((result) => {
    const next = { token: result.token, expiresAt: result.expiresAt, user: result.user };
    storeSession(next);
    setSession(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isLoggedIn: Boolean(session?.token),
      login: async (nickname, password) => applySession(await api.login(nickname, password)),
      register: async (nickname, password) => applySession(await api.register(nickname, password)),
      logout: async () => {
        try {
          await api.logout();
        } finally {
          storeSession(null);
          setSession(null);
        }
      },
      clear: () => {
        storeSession(null);
        setSession(null);
      }
    }),
    [session, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
