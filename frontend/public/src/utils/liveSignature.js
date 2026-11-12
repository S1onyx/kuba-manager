// Ändert sich bei allem, was Tabellen oder Statistiken beeinflusst – nicht bei jedem Uhr-Tick.
export function liveSignature(scoreboard) {
  if (!scoreboard) return null;
  return [
    scoreboard.tournamentId,
    scoreboard.stageType,
    scoreboard.stageLabel,
    scoreboard.scheduleCode,
    scoreboard.teamAName,
    scoreboard.teamBName,
    scoreboard.scoreA ?? 0,
    scoreboard.scoreB ?? 0,
    scoreboard.penalties?.a?.length ?? 0,
    scoreboard.penalties?.b?.length ?? 0,
    scoreboard.scoringLog?.length ?? 0,
    scoreboard.penaltyLog?.length ?? 0,
    scoreboard.shootout?.attempts?.length ?? 0,
    scoreboard.freeThrows?.attempts?.length ?? 0,
    (scoreboard.remainingSeconds ?? 0) !== (scoreboard.durationSeconds ?? 0),
    Boolean(scoreboard.isFinished),
    scoreboard.savedGameId ?? null,
    scoreboard.scheduleVersion ?? 0,
    Boolean(scoreboard.tournamentCompleted)
  ].join('|');
}
