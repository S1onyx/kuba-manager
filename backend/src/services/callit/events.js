let ioInstance = null;
const pending = new Map();
const versions = new Map();

// Zähler je Turnier – jede Änderung erhöht ihn, Caches vergleichen dagegen.
export function tournamentVersion(tournamentId) {
  return versions.get(Number(tournamentId)) ?? 0;
}
const THROTTLE_MS = 1000;

export function setCallitIo(io) {
  ioInstance = io;
}

// Nur ein Invalidierungs-Signal – Clients laden die Daten selbst nach, Tipps gehen nie über den Socket.
export function emitCallitUpdate(tournamentId, reason = 'update') {
  if (!tournamentId) return;
  const key = Number(tournamentId);
  versions.set(key, tournamentVersion(key) + 1);
  if (!ioInstance) return;
  if (pending.has(key)) {
    pending.get(key).reasons.add(reason);
    return;
  }
  const entry = { reasons: new Set([reason]) };
  pending.set(key, entry);
  entry.timer = setTimeout(() => {
    pending.delete(key);
    ioInstance?.emit('callit:update', { tournamentId: key, reasons: Array.from(entry.reasons), at: new Date().toISOString() });
  }, THROTTLE_MS);
  entry.timer.unref?.();
}
