const BASE = import.meta.env.VITE_BACKEND_URL;

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  return data.token;
}

export async function getMatches() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/matches`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Unauthorized');
  return await res.json();
}