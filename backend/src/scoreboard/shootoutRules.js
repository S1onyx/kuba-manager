export const SHOOTOUT_ATTEMPTS_PER_TEAM = 5;

export function evaluateShootout(shootout) {
  const attempts = Array.isArray(shootout?.attempts) ? shootout.attempts : [];
  const firstTeam = shootout?.firstTeam === 'b' ? 'b' : 'a';
  const secondTeam = firstTeam === 'a' ? 'b' : 'a';
  const taken = { a: 0, b: 0 };
  const hits = { a: 0, b: 0 };
  attempts.forEach((attempt) => {
    const team = attempt.team === 'b' ? 'b' : 'a';
    taken[team] += 1;
    if (attempt.hit) hits[team] += 1;
  });

  const regulationDone = taken.a >= SHOOTOUT_ATTEMPTS_PER_TEAM && taken.b >= SHOOTOUT_ATTEMPTS_PER_TEAM;
  let winner = null;
  if (!regulationDone) {
    const remaining = {
      a: Math.max(0, SHOOTOUT_ATTEMPTS_PER_TEAM - taken.a),
      b: Math.max(0, SHOOTOUT_ATTEMPTS_PER_TEAM - taken.b)
    };
    if (hits.a > hits.b + remaining.b) winner = 'a';
    else if (hits.b > hits.a + remaining.a) winner = 'b';
  } else if (taken.a === taken.b && hits.a !== hits.b) {
    winner = hits.a > hits.b ? 'a' : 'b';
  }

  const decidedInRegulation = taken.a === SHOOTOUT_ATTEMPTS_PER_TEAM && taken.b === SHOOTOUT_ATTEMPTS_PER_TEAM && winner !== null;
  const decided = winner !== null;
  return {
    hits,
    taken,
    decided,
    winner,
    suddenDeath: regulationDone && !decidedInRegulation,
    nextTeam: decided ? null : taken[firstTeam] > taken[secondTeam] ? secondTeam : firstTeam
  };
}
