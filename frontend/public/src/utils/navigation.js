function normalizeInput(value) {
  if (typeof value !== 'string') {
    return '/';
  }
  let cleaned = value.trim();
  if (cleaned === '') {
    return '/';
  }
  if (cleaned.startsWith('#')) {
    cleaned = cleaned.slice(1);
  }
  if (!cleaned.startsWith('/')) {
    cleaned = `/${cleaned}`;
  }
  const [pathOnly] = cleaned.split(/[?#]/);
  if (pathOnly === '/reglement' || pathOnly === '/reglement/') {
    return '/reglement/';
  }
  return '/';
}

export function normalizeRoute(value) {
  return normalizeInput(value);
}

export function resolveInitialRoute() {
  if (typeof window === 'undefined' || !window.location) {
    return '/';
  }
  const { hash, pathname } = window.location;
  if (hash && hash.startsWith('#/')) {
    const normalized = normalizeInput(hash);
    try {
      if (window.history && normalized !== normalizeInput(pathname)) {
        window.history.replaceState({ path: normalized }, '', normalized);
      }
    } catch {
      // history.replaceState might throw in restricted contexts; ignore gracefully
    }
    return normalized;
  }
  return normalizeInput(pathname);
}
