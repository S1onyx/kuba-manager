const KNOCKOUT_PHASES = ['knockout', 'placement'];

const isKnockoutDraw = (scoreboard) =>
  KNOCKOUT_PHASES.includes(scoreboard.stageType) && (scoreboard.scoreA ?? 0) === (scoreboard.scoreB ?? 0);

// Spielzeit inkl. geplanter Nachspielzeit abgelaufen (oder Spiel beendet) und Uhr steht – wie Backend overtimeRules.
function isClockOver(scoreboard) {
  if (scoreboard.isRunning || scoreboard.isHalftimeBreak) return false;
  if (scoreboard.isFinished) return true;
  return (scoreboard.remainingSeconds ?? 0) === 0 && (scoreboard.extraElapsedSeconds ?? 0) >= (scoreboard.extraSeconds ?? 0);
}

export function canStartOvertime(scoreboard) {
  return Boolean(scoreboard) && !scoreboard.overtime && !scoreboard.shootout && isKnockoutDraw(scoreboard) && isClockOver(scoreboard);
}

export function isOvertimeBreak(scoreboard) {
  return Boolean(scoreboard?.overtime && scoreboard.isHalftimeBreak);
}

export function canStartShootout(scoreboard) {
  return Boolean(scoreboard?.overtime) && !scoreboard.shootout && isKnockoutDraw(scoreboard) && isClockOver(scoreboard);
}

export function getSaveStatus(scoreboard) {
  if (!scoreboard) return 'none';
  const hasMatch =
    Boolean(scoreboard.teamAId || scoreboard.teamBId || scoreboard.scheduleCode) ||
    (scoreboard.scoreA ?? 0) + (scoreboard.scoreB ?? 0) > 0;
  if (!hasMatch) return 'none';
  if (scoreboard.saveState === 'saved') return 'saved';
  if (scoreboard.saveState === 'changed') return 'changed';
  const ended = Boolean(scoreboard.isFinished) || ((scoreboard.remainingSeconds ?? 1) === 0 && !scoreboard.isRunning);
  if (!ended) return 'running';
  const shootoutOpen = scoreboard.shootout && !scoreboard.shootout.status?.decided;
  if (scoreboard.freeThrows && !scoreboard.freeThrows.status?.done) return 'freeThrowsOpen';
  if (shootoutOpen || isKnockoutDraw(scoreboard)) return 'blocked';
  return 'needsSave';
}
