import { specialTypeOf } from './settings.js';

const round1 = (value) => Math.round(value * 10) / 10;

export function tendency(home, away) {
  if (home > away) return 'home';
  if (home < away) return 'away';
  return 'draw';
}

export function phaseGroupOf(match) {
  return match?.phase === 'group' ? 'group' : 'ko';
}

export function matchMultiplier(match, settings) {
  if (match?.isFinal) return settings.multipliers.final;
  return settings.multipliers[match?.phase] ?? 1;
}

// Ein Tipp zählt nur für die Paarung, auf die er abgegeben wurde.
export function isTipValidForMatch(tip, match) {
  return Boolean(
    tip && match?.home && match?.away && tip.homeKey === match.home.key && tip.awayKey === match.away.key
  );
}

export function tipLevel(tip, result) {
  if (tip.scoreHome === result.home && tip.scoreAway === result.away) return 'exact';
  if (tip.scoreHome - tip.scoreAway === result.home - result.away) return 'diff';
  if (tendency(tip.scoreHome, tip.scoreAway) === tendency(result.home, result.away)) return 'tendency';
  return 'miss';
}

export function tendencyShares(tips) {
  const counts = { home: 0, draw: 0, away: 0 };
  tips.forEach((tip) => {
    counts[tendency(tip.scoreHome, tip.scoreAway)] += 1;
  });
  const count = tips.length;
  const share = (n) => (count > 0 ? n / count : 0);
  return { count, counts, home: share(counts.home), draw: share(counts.draw), away: share(counts.away) };
}

export function scoreMatchTip(tip, match, { settings, shares }) {
  const result = match?.result;
  if (!result) return null;
  const level = tipLevel(tip, result);
  const base = level === 'miss' ? 0 : settings.points[level];
  const tipTendency = tendency(tip.scoreHome, tip.scoreAway);
  const koBonus =
    match.phase !== 'group' && level !== 'miss' && tipTendency === 'draw' && tip.advance && tip.advance === result.winner
      ? settings.points.koAdvance
      : 0;
  const multiplier = matchMultiplier(match, settings);
  const joker = settings.joker.enabled && tip.isJoker ? 2 : 1;
  const { underdog: u } = settings;
  const underdog =
    u.enabled && level !== 'miss' && (shares?.count ?? 0) >= u.minTips && shares[tipTendency] <= u.thresholdPct / 100
      ? u.bonus
      : 0;
  return {
    level,
    base,
    koBonus,
    multiplier,
    joker,
    underdog,
    total: round1((base + koBonus) * multiplier * joker + underdog)
  };
}

function normalizeSpecialValue(type, value) {
  if (!value || typeof value !== 'object') return null;
  if (type === 'total_baskets') {
    const numeric = Number(value.value);
    return Number.isInteger(numeric) ? numeric : null;
  }
  return value.key === undefined || value.key === null ? null : String(value.key);
}

// Liefert je Nutzer die Punkte aus Sonderwetten; vorläufige Ergebnisse werden getrennt ausgewiesen.
export function scoreSpecials(specialTips, outcomes, settings) {
  const perUser = new Map();
  const ensure = (userId) => {
    if (!perUser.has(userId)) perUser.set(userId, { final: 0, provisional: 0, bets: {} });
    return perUser.get(userId);
  };

  const nearestByBet = new Map();
  specialTips.forEach((tip) => {
    if (specialTypeOf(tip.betKey) !== 'total_baskets') return;
    const outcome = outcomes.get(tip.betKey);
    const guess = normalizeSpecialValue('total_baskets', tip.value);
    if (!outcome || guess === null) return;
    const distance = Math.abs(guess - outcome.value);
    nearestByBet.set(tip.betKey, Math.min(nearestByBet.get(tip.betKey) ?? Infinity, distance));
  });

  specialTips.forEach((tip) => {
    const type = specialTypeOf(tip.betKey);
    const config = type ? settings.specials[type] : null;
    const outcome = outcomes.get(tip.betKey);
    const value = type ? normalizeSpecialValue(type, tip.value) : null;
    if (!config?.enabled || !outcome || value === null) return;
    const hit =
      type === 'total_baskets'
        ? Math.abs(value - outcome.value) === nearestByBet.get(tip.betKey)
        : (outcome.keys ?? []).map(String).includes(value);
    const points = hit ? config.points : 0;
    const entry = ensure(tip.userId);
    entry.bets[tip.betKey] = { points, final: Boolean(outcome.final) };
    if (outcome.final) entry.final += points;
    else entry.provisional += points;
  });

  return perUser;
}

function emptyRow(participant) {
  return {
    userId: participant.userId,
    nickname: participant.nickname,
    total: 0,
    matchPoints: 0,
    specialPoints: 0,
    specialPointsProvisional: 0,
    exact: 0,
    diff: 0,
    tendency: 0,
    miss: 0,
    underdogHits: 0,
    jokerPoints: 0,
    tipsCount: 0,
    livePoints: 0,
    phasePoints: { group: 0, ko: 0 }
  };
}

// Gültige Tipps je Spiel inkl. Tendenzverteilung (Basis für Underdog-Bonus und Statistiken).
export function validTipsByMatch(matches, tips, activeUserIds) {
  const byCode = new Map();
  matches.forEach((match) => byCode.set(match.code, { match, tips: [] }));
  tips.forEach((tip) => {
    const bucket = byCode.get(tip.code);
    if (bucket && activeUserIds.has(tip.userId) && isTipValidForMatch(tip, bucket.match)) {
      bucket.tips.push(tip);
    }
  });
  byCode.forEach((bucket) => {
    bucket.shares = tendencyShares(bucket.tips);
  });
  return byCode;
}

export function computeStandings({ participants, matches, tips, specialTips, specialOutcomes, settings, excludeCodes }) {
  const rows = new Map(participants.map((participant) => [participant.userId, emptyRow(participant)]));
  const activeUserIds = new Set(rows.keys());
  const excluded = excludeCodes ?? new Set();
  const buckets = validTipsByMatch(
    matches.filter((match) => !excluded.has(match.code)),
    tips,
    activeUserIds
  );

  buckets.forEach(({ match, tips: matchTips, shares }) => {
    matchTips.forEach((tip) => {
      const row = rows.get(tip.userId);
      row.tipsCount += 1;
      const score = scoreMatchTip(tip, match, { settings, shares });
      if (!score) return;
      row[score.level] += 1;
      if (score.underdog > 0) row.underdogHits += 1;
      row.matchPoints = round1(row.matchPoints + score.total);
      row.phasePoints[phaseGroupOf(match)] = round1(row.phasePoints[phaseGroupOf(match)] + score.total);
      if (score.joker > 1) row.jokerPoints = round1(row.jokerPoints + (score.total - score.underdog) / 2);
      if (match.result.live) row.livePoints = round1(row.livePoints + score.total);
    });
  });

  const specials = scoreSpecials(
    specialTips.filter((tip) => activeUserIds.has(tip.userId)),
    specialOutcomes,
    settings
  );
  specials.forEach((entry, userId) => {
    const row = rows.get(userId);
    row.specialPoints = round1(entry.final);
    row.specialPointsProvisional = round1(entry.provisional);
  });

  rows.forEach((row) => {
    row.total = round1(row.matchPoints + row.specialPoints);
  });

  return Array.from(rows.values());
}

export const RANKING_CATEGORIES = {
  total: ['total', 'exact', 'diff', 'tendency', 'specialPoints'],
  matches: ['matchPoints', 'exact', 'diff', 'tendency'],
  specials: ['specialPoints', 'total'],
  exact: ['exact', 'total'],
  underdog: ['underdogHits', 'total'],
  group: ['phase:group', 'total'],
  ko: ['phase:ko', 'total']
};

const sortValue = (row, key) => (key.startsWith('phase:') ? row.phasePoints[key.slice(6)] : row[key]);

export function rankRows(rows, category = 'total') {
  const keys = RANKING_CATEGORIES[category] ?? RANKING_CATEGORIES.total;
  const compare = (a, b) => {
    for (const key of keys) {
      const diff = sortValue(b, key) - sortValue(a, key);
      if (diff !== 0) return diff;
    }
    return 0;
  };
  const sorted = rows
    .slice()
    .sort((a, b) => compare(a, b) || a.nickname.localeCompare(b.nickname, 'de', { sensitivity: 'base' }));
  let rank = 0;
  return sorted.map((row, index) => {
    if (index === 0 || compare(sorted[index - 1], row) !== 0) rank = index + 1;
    return { ...row, rank, value: sortValue(row, keys[0]) };
  });
}
