import { hasLiveGameStarted } from './standings.js';

// Baut aus dem Live-Scoreboard einen Eintrag im Format gespeicherter Spiele (für Statistiken).
export function liveGameFromSnapshot(snapshot, tournamentId) {
  if (!snapshot || snapshot.tournamentId !== tournamentId || !hasLiveGameStarted(snapshot)) {
    return null;
  }
  return {
    id: snapshot.savedGameId ?? 'live',
    isLive: true,
    team_a: snapshot.teamAName,
    team_b: snapshot.teamBName,
    team_a_id: snapshot.teamAId ?? null,
    team_b_id: snapshot.teamBId ?? null,
    score_a: snapshot.scoreA ?? 0,
    score_b: snapshot.scoreB ?? 0,
    penalties: snapshot.penalties ?? { a: [], b: [] },
    snapshot,
    stage_type: snapshot.stageType ?? null,
    stage_label: snapshot.stageLabel ?? ''
  };
}

// Gespeicherte Spiele plus laufendes Spiel; ein bereits gespeichertes Exemplar wird durch den Live-Stand ersetzt.
export function withLiveGame(games, snapshot, tournamentId) {
  const live = liveGameFromSnapshot(snapshot, tournamentId);
  if (!live) return games;
  return [...games.filter((game) => game.id !== snapshot.savedGameId), live];
}
