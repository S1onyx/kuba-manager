const DEFAULT_BASE_URL =
  typeof window !== 'undefined' && window.location?.origin?.startsWith('http')
    ? (() => {
        const { protocol, hostname, port } = window.location;
        const devPorts = new Set(['5173', '5174', '5175', '5176', '5177', '8081', '8082']);
        if (!port || port === '80' || port === '443') return `${protocol}//${hostname}`;
        if (devPorts.has(port)) return `${protocol}//${hostname}:3000`;
        return `${protocol}//${hostname}`;
      })()
    : 'http://localhost:3000';

export const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim().length > 0
    ? import.meta.env.VITE_BACKEND_URL
    : DEFAULT_BASE_URL;

const API_BASE = `${BACKEND_BASE_URL}/api/callit`;
const SESSION_KEY = 'callit-session';
export const AUTH_EXPIRED_EVENT = 'callit-auth-expired';

export function getStoredSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const session = getStoredSession();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (response.status === 401 && session?.token) {
    storeSession(null);
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  if (response.status === 204) return null;
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    const error = new Error(json?.message || `HTTP ${response.status}`);
    error.code = json?.code ?? null;
    error.status = response.status;
    throw error;
  }
  return json;
}

const tid = (id) => `/tournaments/${encodeURIComponent(id)}`;

export const api = {
  register: (nickname, password) => request('/auth/register', { method: 'POST', body: { nickname, password } }),
  login: (nickname, password) => request('/auth/login', { method: 'POST', body: { nickname, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/me'),
  changePassword: (currentPassword, newPassword) => request('/me/password', { method: 'POST', body: { currentPassword, newPassword } }),
  deleteAccount: () => request('/me', { method: 'DELETE' }),
  tournaments: () => request('/tournaments'),
  tournament: (id) => request(tid(id)),
  join: (id, joinCode) => request(`${tid(id)}/join`, { method: 'POST', body: { joinCode } }),
  matches: (id) => request(`${tid(id)}/matches`),
  saveTip: (id, code, tip) => request(`${tid(id)}/tips/${encodeURIComponent(code)}`, { method: 'PUT', body: tip }),
  deleteTip: (id, code) => request(`${tid(id)}/tips/${encodeURIComponent(code)}`, { method: 'DELETE' }),
  specials: (id) => request(`${tid(id)}/specials`),
  saveSpecial: (id, betKey, value) => request(`${tid(id)}/specials/${encodeURIComponent(betKey)}`, { method: 'PUT', body: { value } }),
  ranking: (id, category) => request(`${tid(id)}/ranking?category=${encodeURIComponent(category)}`),
  stats: (id) => request(`${tid(id)}/stats`),
  matchStats: (id, code) => request(`${tid(id)}/matches/${encodeURIComponent(code)}/stats`),
  profile: (id, userId) => request(`${tid(id)}/users/${encodeURIComponent(userId)}`)
};
