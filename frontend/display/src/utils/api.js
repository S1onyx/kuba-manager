import { BACKEND_URL } from '../config.js';

export const API_BASE = `${BACKEND_URL}/api`;

export async function fetchJson(endpoint, options) {
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
