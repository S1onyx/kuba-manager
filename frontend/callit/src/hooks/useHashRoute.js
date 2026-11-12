import { useEffect, useState } from 'react';

export function parseHash(hash) {
  const [path, query = ''] = String(hash ?? '').replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'login') return { page: 'login', next: params.get('next') || '' };
  if (parts[0] === 't' && /^\d+$/.test(parts[1] ?? '')) {
    const id = Number(parts[1]);
    if (parts[2] === 'stats' && parts[3]) return { page: 'tournament', id, tab: 'match', code: decodeURIComponent(parts[3]) };
    if (parts[2] === 'user' && /^\d+$/.test(parts[3] ?? '')) return { page: 'tournament', id, tab: 'user', userId: Number(parts[3]) };
    const tab = ['tippen', 'ranking', 'stats', 'ich', 'regeln'].includes(parts[2]) ? parts[2] : 'tippen';
    return { page: 'tournament', id, tab };
  }
  return { page: 'home' };
}

export default function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const handler = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

export function navigate(path) {
  window.location.hash = path;
}

export function currentHash() {
  return window.location.hash.replace(/^#/, '') || '/';
}
