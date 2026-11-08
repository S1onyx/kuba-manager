const MINUTE_MS = 60 * 1000;
export const SCHEDULE_DELAY_THRESHOLD_MINUTES = 3;
const MAX_PLAUSIBLE_DELAY_MINUTES = 12 * 60;

function elapsedGameMs(liveMatch) {
  const duration = Number(liveMatch?.durationSeconds ?? 0);
  const remaining = Number(liveMatch?.remainingSeconds ?? duration);
  return Math.max(0, duration - remaining) * 1000;
}

export function computeScheduleProgress(entries, liveMatch, nowTs, { completed = false } = {}) {
  if (completed) {
    return { activeKey: null, nextKey: null, hasStarted: true, delayMinutes: null, expectedTimestamp: () => null };
  }
  const liveCode = String(liveMatch?.code ?? '').trim().toLowerCase();
  const activeIndex = liveCode
    ? entries.findIndex((entry) => !entry.result?.hasResult && (entry.code ?? '').toLowerCase() === liveCode)
    : -1;
  const activeEntry = activeIndex >= 0 ? entries[activeIndex] : null;
  const nextEntry =
    entries.slice(activeIndex + 1).find((entry) => !entry.result?.hasResult) ?? null;
  const hasStarted = Boolean(activeEntry) || entries.some((entry) => entry.result?.hasResult);

  let delayMinutes = null;
  if (activeEntry?.timestamp != null) {
    delayMinutes = Math.round((nowTs - activeEntry.timestamp - elapsedGameMs(liveMatch)) / MINUTE_MS);
  } else if (hasStarted && nextEntry?.timestamp != null) {
    delayMinutes = Math.max(0, Math.round((nowTs - nextEntry.timestamp) / MINUTE_MS));
  }

  if (delayMinutes !== null && Math.abs(delayMinutes) > MAX_PLAUSIBLE_DELAY_MINUTES) {
    delayMinutes = null;
  }

  const shift = delayMinutes !== null && Math.abs(delayMinutes) >= SCHEDULE_DELAY_THRESHOLD_MINUTES ? delayMinutes : 0;
  const firstUpcomingIndex = nextEntry ? entries.indexOf(nextEntry) : -1;

  return {
    activeKey: activeEntry?.key ?? null,
    nextKey: nextEntry?.key ?? null,
    hasStarted,
    delayMinutes,
    expectedTimestamp(entry) {
      if (!shift || entry.timestamp == null || entry.result?.hasResult || entry.key === activeEntry?.key) {
        return null;
      }
      return entries.indexOf(entry) >= firstUpcomingIndex && firstUpcomingIndex >= 0
        ? entry.timestamp + shift * MINUTE_MS
        : null;
    }
  };
}

export function isMatchLive(scoreboard, entries, tournamentId) {
  if (!scoreboard || scoreboard.tournamentId !== tournamentId || scoreboard.tournamentCompleted) {
    return false;
  }
  const code = String(scoreboard.scheduleCode ?? '').trim().toLowerCase();
  if (code) {
    const entry = entries.find((candidate) => (candidate.code ?? '').toLowerCase() === code);
    return !entry?.result?.hasResult;
  }
  const hasTeams = Boolean(scoreboard.teamAId || scoreboard.teamBId);
  const hasProgress =
    Boolean(scoreboard.isRunning) ||
    (scoreboard.scoreA ?? 0) + (scoreboard.scoreB ?? 0) > 0 ||
    (scoreboard.remainingSeconds ?? 0) < (scoreboard.durationSeconds ?? 0);
  return hasTeams && hasProgress;
}
