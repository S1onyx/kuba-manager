const DEFAULT_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin?.startsWith('http')
    ? (() => {
        const { protocol, hostname, port } = window.location;
        const devPorts = new Set(['5173', '5174', '5175', '8081', '8082']);
        if (!port || port === '80' || port === '443') {
          return `${protocol}//${hostname}`;
        }
        if (devPorts.has(port)) {
          return `${protocol}//${hostname}:3000`;
        }
        return `${protocol}//${hostname}`;
      })()
    : 'http://localhost:3000';

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim().length > 0
  ? import.meta.env.VITE_BACKEND_URL
  : DEFAULT_BASE_URL;

const API_BASE = `${BACKEND_BASE_URL}/api/public`;

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request to ${path} failed`);
  }
  return response.json();
}

export function fetchCurrentStatus() {
  return request('/current');
}

export function fetchTournamentSummary(id) {
  return request(`/tournaments/${id}/summary`);
}

export function fetchPublicTournaments() {
  return request('/tournaments');
}
