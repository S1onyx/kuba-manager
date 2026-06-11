import { useEffect, useState } from 'react';

function parseHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const detailMatch = hash.match(/^\/turnier\/(\d+)$/);
  if (detailMatch) return { page: 'tournament-detail', id: Number(detailMatch[1]) };
  const registerMatch = hash.match(/^\/anmelden\/(\d+)$/);
  if (registerMatch) return { page: 'tournament-register', id: Number(registerMatch[1]) };
  return { page: 'home' };
}

export default function useHashRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return route;
}

export function navigateTo(path) {
  window.location.hash = path;
}
