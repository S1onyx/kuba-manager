import { evaluateShootout } from '../../scoreboard/shootoutRules.js';

export function shootoutSummary(snapshot) {
  const shootout = snapshot?.shootout;
  if (!shootout || !Array.isArray(shootout.attempts) || shootout.attempts.length === 0) {
    return null;
  }
  const { hits } = evaluateShootout(shootout);
  return {
    regularScoreA: shootout.regularScoreA ?? 0,
    regularScoreB: shootout.regularScoreB ?? 0,
    hitsA: hits.a,
    hitsB: hits.b
  };
}

export function overtimeSummary(snapshot) {
  const overtime = snapshot?.overtime;
  if (!overtime) {
    return null;
  }
  return {
    regularScoreA: overtime.regularScoreA ?? 0,
    regularScoreB: overtime.regularScoreB ?? 0
  };
}

// Kennzeichnung am Ergebnis: Stechen schlägt Verlängerung (ein Stechen folgt immer auf eine Verlängerung).
export function resultSuffix(snapshot) {
  if (shootoutSummary(snapshot)) return ' n.F.';
  return overtimeSummary(snapshot) ? ' n.V.' : '';
}
