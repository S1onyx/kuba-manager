import { useEffect, useState } from 'react';

function parseHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const match = hash.match(/^\/turnier\/(\d+)/);
  if (match) return { page: 'tournament-detail', id: Number(match[1]) };
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
