const KNOCKOUT_PHASES = ['knockout', 'placement'];

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
  const tied = (scoreboard.scoreA ?? 0) === (scoreboard.scoreB ?? 0);
  const shootoutOpen = scoreboard.shootout && !scoreboard.shootout.status?.decided;
  if (scoreboard.freeThrows && !scoreboard.freeThrows.status?.done) return 'freeThrowsOpen';
  if (shootoutOpen || (KNOCKOUT_PHASES.includes(scoreboard.stageType) && tied)) return 'blocked';
  return 'needsSave';
}
