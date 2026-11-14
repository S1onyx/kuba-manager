export const OVERTIME_PAUSE_SECONDS = 60;
export const KNOCKOUT_STAGES = ['knockout', 'placement'];

// Reglement 2.3: Verlängerung über die halbe Spieldauer.
export const overtimeDurationFor = (durationSeconds) => Math.max(1, Math.round((durationSeconds ?? 0) / 2));

// KO-Gleichstand am Ende der regulären Spielzeit: Verlängerung steht an (genau einmal pro Spiel).
export function needsOvertime(state) {
  return (
    KNOCKOUT_STAGES.includes(state.stageType) &&
    (state.scoreA ?? 0) === (state.scoreB ?? 0) &&
    !state.overtime &&
    !state.shootout
  );
}

// Spielzeit inkl. geplanter Nachspielzeit abgelaufen (oder Spiel beendet) und Uhr steht.
export function isClockOver(state) {
  if (state.isRunning || state.isHalftimeBreak) return false;
  if (state.isFinished) return true;
  return (state.remainingSeconds ?? 0) === 0 && (state.extraElapsedSeconds ?? 0) >= (state.extraSeconds ?? 0);
}
