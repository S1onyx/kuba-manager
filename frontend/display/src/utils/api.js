import { BACKEND_URL } from '../config.js';

export const API_BASE = `${BACKEND_URL}/api`;

export async function fetchJson(endpoint, options) {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function updateDisplayView(view) {
  return fetchJson('/scoreboard/display', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ view })
  });
}
