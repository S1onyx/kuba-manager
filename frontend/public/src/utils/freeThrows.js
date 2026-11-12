export const FREE_THROW_HIDE_DELAY_MS = 10000;

// Identifiziert eine Serie; doneSeenAt ist die lokale Zeit, zu der die fertige Serie zuerst gesehen wurde (keine Server-Uhr nötig).
export const freeThrowSeriesKey = (freeThrows) => (freeThrows ? `${freeThrows.team}-${freeThrows.startedAt}` : null);

export function isFreeThrowVisible(freeThrows, doneSeenAt, now) {
  if (!freeThrows) return false;
  if (!freeThrows.status?.done) return true;
  return doneSeenAt == null || now - doneSeenAt < FREE_THROW_HIDE_DELAY_MS;
}

export function formatFreeThrowPct(pct) {
  return pct === null || pct === undefined ? '—' : `${Math.round(pct * 100)} %`;
}
