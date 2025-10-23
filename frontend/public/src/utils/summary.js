export function scorecardHasGroup(scoreboard, recordedGamesCount, standings, scoreboardPublic) {
  if (!scoreboardPublic) return false;
  if (!scoreboard) return false;
  if (scoreboard.stageType !== 'group') return false;
  return Array.isArray(standings) && standings.length > 0;
}
