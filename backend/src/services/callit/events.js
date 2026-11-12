let ioInstance = null;
const pending = new Map();
const THROTTLE_MS = 1000;

export function setCallitIo(io) {
  ioInstance = io;
}

// Nur ein Invalidierungs-Signal – Clients laden die Daten selbst nach, Tipps gehen nie über den Socket.
export function emitCallitUpdate(tournamentId, reason = 'update') {
  if (!ioInstance || !tournamentId) return;
  const key = Number(tournamentId);
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
