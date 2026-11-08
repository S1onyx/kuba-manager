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
