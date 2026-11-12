// Ändert sich nur, wenn sich etwas tabellenrelevantes tut – nicht bei jedem Uhr-Tick.
export function standingsSignature(scoreboard) {
  if (!scoreboard) return null;
  return [
    scoreboard.tournamentId,
    scoreboard.stageType,
    scoreboard.stageLabel,
    scoreboard.teamAName,
    scoreboard.teamBName,
    scoreboard.scoreA ?? 0,
    scoreboard.scoreB ?? 0,
    scoreboard.penalties?.a?.length ?? 0,
    scoreboard.penalties?.b?.length ?? 0,
    (scoreboard.remainingSeconds ?? 0) !== (scoreboard.durationSeconds ?? 0),
    scoreboard.savedGameId ?? null,
    scoreboard.scheduleVersion ?? 0
  ].join('|');
}
