export function resolveInitialRoute() {
  if (typeof window === 'undefined' || !window.location) {
    return '#/';
  }
  const { hash } = window.location;
  return hash && hash.startsWith('#/') ? hash : '#/';
}
