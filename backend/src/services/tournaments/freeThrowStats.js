const MIN_ATTEMPTS_FOR_RANKING = 2;
const LEADERBOARD_SIZE = 15;

export function freeThrowPct(made, attempted) {
  const attempts = Number(attempted) || 0;
  return attempts > 0 ? (Number(made) || 0) / attempts : null;
}

export function rankFreeThrowShooters(players) {
  return players
    .filter((entry) => (entry.freeThrowsAttempted ?? 0) >= MIN_ATTEMPTS_FOR_RANKING)
    .map((entry) => ({ ...entry, freeThrowPct: freeThrowPct(entry.freeThrowsMade, entry.freeThrowsAttempted) }))
    .sort((a, b) => {
      if (b.freeThrowPct !== a.freeThrowPct) return b.freeThrowPct - a.freeThrowPct;
      if ((b.freeThrowsMade ?? 0) !== (a.freeThrowsMade ?? 0)) return (b.freeThrowsMade ?? 0) - (a.freeThrowsMade ?? 0);
      return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'de', { sensitivity: 'base' });
    })
    .slice(0, LEADERBOARD_SIZE);
}

// Teamsummen kommen aus dem Team-Gesamt-Eintrag der gespeicherten Spieler-Stats (Schlüssel: Teamname wie in overallStats).
export function collectTeamFreeThrows(games) {
  const totals = new Map();
  const add = (teamName, stats) => {
    if (!teamName) return;
    const entry = totals.get(teamName) ?? { freeThrowsAttempted: 0, freeThrowsMade: 0 };
    const teamTotal = Array.isArray(stats) ? stats.find((stat) => stat?.isTeamTotal) : null;
    entry.freeThrowsAttempted += teamTotal?.freeThrowsAttempted ?? 0;
    entry.freeThrowsMade += teamTotal?.freeThrowsMade ?? 0;
    totals.set(teamName, entry);
  };
  games.forEach((game) => {
    add(game.team_a, game.snapshot?.playerStats?.a);
    add(game.team_b, game.snapshot?.playerStats?.b);
  });
  return totals;
}
