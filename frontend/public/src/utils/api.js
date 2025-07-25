const BASE = import.meta.env.VITE_BACKEND_URL;

export async function getMatches() {
  const res = await fetch(`${BASE}/matches`);
  if (!res.ok) throw new Error('Fehler beim Laden der Spiele');
  return await res.json();
}