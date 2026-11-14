export const OVERTIME_PAUSE_SECONDS = 60;
export const KNOCKOUT_STAGES = ['knockout', 'placement'];

// Reglement 2.3: Verlängerung über die halbe Spieldauer.
export const overtimeDurationFor = (durationSeconds) => Math.max(1, Math.round((durationSeconds ?? 0) / 2));

// Spielzeit inkl. geplanter Nachspielzeit abgelaufen (oder Spiel beendet) und Uhr steht.
export function isClockOver(state) {
  if (state.isRunning || state.isHalftimeBreak) return false;
  if (state.isFinished) return true;
  return (state.remainingSeconds ?? 0) === 0 && (state.extraElapsedSeconds ?? 0) >= (state.extraSeconds ?? 0);
}
