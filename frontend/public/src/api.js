const DEFAULT_BASE_URL = window?.location?.origin?.startsWith('http')
  ? `${window.location.protocol}//${window.location.hostname}:3000`
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
