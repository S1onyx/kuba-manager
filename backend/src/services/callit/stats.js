import { CallitError } from './db.js';
import { computeRanking, listSpecialsForUser } from './index.js';
import { scoreMatchTip, tendency, tipLevel, validTipsByMatch } from './scoring.js';

const round = (value, digits = 2) => Math.round(value * 10 ** digits) / 10 ** digits;
const quote = (share) => (share > 0 ? round(1 / share) : null);

function matchLabel(match) {
  return `${match.home?.name ?? match.homeLabel} – ${match.away?.name ?? match.awayLabel}`;
}

function describeMatchStats(match, tips, shares, settings, nicknames) {
  const scoreCounts = new Map();
  tips.forEach((tip) => {
    const key = `${tip.scoreHome}:${tip.scoreAway}`;
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1);
  });
  const count = tips.length;
  const topScores = Array.from(scoreCounts.entries())
    .map(([score, n]) => {
      const [home, away] = score.split(':').map(Number);
      return { home, away, count: n, pct: round((n / count) * 100, 1) };
    })
    .sort((a, b) => b.count - a.count || a.home + a.away - (b.home + b.away))
    .slice(0, 6);
  const heatmap = Array.from(scoreCounts.entries()).map(([score, n]) => {
    const [home, away] = score.split(':').map(Number);
    return { home, away, count: n };
  });
  const average = count
    ? { home: round(tips.reduce((sum, tip) => sum + tip.scoreHome, 0) / count, 1), away: round(tips.reduce((sum, tip) => sum + tip.scoreAway, 0) / count, 1) }
    : null;
  const advance = { home: 0, away: 0 };
  tips.forEach((tip) => {
    if (tip.advance) advance[tip.advance] += 1;
  });
  const jokers = tips.filter((tip) => tip.isJoker).length;

  let hits = null;
  let exactNicknames = [];
  let rarity = null;
  if (match.result) {
    hits = { exact: 0, diff: 0, tendency: 0, miss: 0 };
    tips.forEach((tip) => {
      hits[tipLevel(tip, match.result)] += 1;
    });
    exactNicknames = tips.filter((tip) => tipLevel(tip, match.result) === 'exact').map((tip) => nicknames.get(tip.userId)).filter(Boolean);
    const winnerTendency = tendency(match.result.home, match.result.away);
    rarity = count ? round(shares[winnerTendency] * 100, 1) : null;
    const points = tips.map((tip) => scoreMatchTip(tip, match, { settings, shares })?.total ?? 0);
    hits.avgPoints = count ? round(points.reduce((sum, value) => sum + value, 0) / count, 2) : 0;
  }

  return {
    code: match.code,
    label: matchLabel(match),
    home: match.home?.name ?? match.homeLabel,
    away: match.away?.name ?? match.awayLabel,
    tipCount: count,
    counts: shares.counts,
    shares: { home: round(shares.home * 100, 1), draw: round(shares.draw * 100, 1), away: round(shares.away * 100, 1) },
    quotes: { home: quote(shares.home), draw: quote(shares.draw), away: quote(shares.away) },
    topScores,
    heatmap,
    average,
    advance,
    jokers,
    hits,
    exactNicknames,
    correctTendencyPct: rarity
  };
}

export async function getMatchStats(tournamentId, code) {
  const { state, tips, participants } = await computeRanking(tournamentId, 'total');
  const match = state.matches.find((entry) => entry.code === code);
  if (!match) throw new CallitError('CALLIT_MATCH_NOT_FOUND', 'Spiel nicht gefunden.', 404);
  const activeIds = new Set(participants.map((participant) => participant.userId));
  const bucket = validTipsByMatch([match], tips, activeIds).get(code);
  if (!match.locked) return { code, label: matchLabel(match), home: match.home?.name ?? match.homeLabel, away: match.away?.name ?? match.awayLabel, hidden: true, tipCount: bucket.tips.length };
  const nicknames = new Map(participants.map((participant) => [participant.userId, participant.nickname]));
  return {
    ...describeMatchStats(match, bucket.tips, bucket.shares, state.settings, nicknames),
    hidden: false,
    status: match.status,
    result: match.result ? { home: match.result.home, away: match.result.away, winner: match.result.winner, live: match.result.live } : null
  };
}

export async function getOverviewStats(tournamentId) {
  const ranking = await computeRanking(tournamentId, 'total');
  const { state, tips, specialTips, participants } = ranking;
  const activeIds = new Set(participants.map((participant) => participant.userId));
  const nicknames = new Map(participants.map((participant) => [participant.userId, participant.nickname]));
  const buckets = validTipsByMatch(state.matches, tips, activeIds);

  const perUser = new Map(participants.map((participant) => [participant.userId, { scored: 0, tendencyHits: 0, bias: 0 }]));
  const matchSummaries = [];
  buckets.forEach(({ match, tips: matchTips, shares }) => {
    if (!match.locked) return;
    const summary = describeMatchStats(match, matchTips, shares, state.settings, nicknames);
    matchSummaries.push({ ...summary, status: match.status, scheduledAt: match.scheduledAt });
    if (!match.result || match.result.live) return;
    matchTips.forEach((tip) => {
      const entry = perUser.get(tip.userId);
      entry.scored += 1;
      if (tipLevel(tip, match.result) !== 'miss') entry.tendencyHits += 1;
      entry.bias += tip.scoreHome + tip.scoreAway - (match.result.home + match.result.away);
    });
  });

  const users = Array.from(perUser.entries())
    .filter(([, entry]) => entry.scored > 0)
    .map(([userId, entry]) => ({
      userId,
      nickname: nicknames.get(userId),
      scored: entry.scored,
      hitRate: round((entry.tendencyHits / entry.scored) * 100, 1),
      bias: round(entry.bias / entry.scored, 2)
    }));
  const byHitRate = users.slice().sort((a, b) => b.hitRate - a.hitRate || b.scored - a.scored).slice(0, 5);
  const optimists = users.filter((user) => user.bias > 0).sort((a, b) => b.bias - a.bias).slice(0, 3);
  const pessimists = users.filter((user) => user.bias < 0).sort((a, b) => a.bias - b.bias).slice(0, 3);

  const finished = matchSummaries.filter((summary) => summary.hits);
  const totalScored = finished.reduce((sum, summary) => sum + summary.tipCount, 0);
  const crowdHitRate = totalScored
    ? round((finished.reduce((sum, summary) => sum + summary.tipCount - summary.hits.miss, 0) / totalScored) * 100, 1)
    : null;
  const surprises = finished
    .filter((summary) => summary.correctTendencyPct !== null)
    .sort((a, b) => a.correctTendencyPct - b.correctTendencyPct)
    .slice(0, 3)
    .map(({ code, label, correctTendencyPct, result }) => ({ code, label, correctTendencyPct, result }));

  const specials = (await listSpecialsForUser(tournamentId, null)).map((bet) => {
    if (!bet.locked) {
      return { betKey: bet.betKey, type: bet.type, groupLabel: bet.groupLabel, hidden: true, tipCount: specialTips.filter((tip) => tip.betKey === bet.betKey && activeIds.has(tip.userId)).length };
    }
    const betTips = specialTips.filter((tip) => tip.betKey === bet.betKey && activeIds.has(tip.userId));
    const counts = new Map();
    betTips.forEach((tip) => {
      const key = bet.type === 'total_baskets' ? String(tip.value?.value) : String(tip.value?.key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    const distribution = Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        label: bet.type === 'total_baskets' ? key : bet.options.find((option) => option.key === key)?.label ?? key,
        count,
        pct: round((count / betTips.length) * 100, 1),
        quote: quote(count / betTips.length)
      }))
      .sort((a, b) => b.count - a.count);
    const values = betTips.map((tip) => Number(tip.value?.value)).filter(Number.isFinite);
    return {
      betKey: bet.betKey,
      type: bet.type,
      groupLabel: bet.groupLabel,
      hidden: false,
      tipCount: betTips.length,
      distribution: bet.type === 'total_baskets' ? distribution.slice(0, 10) : distribution,
      average: bet.type === 'total_baskets' && values.length ? round(values.reduce((s, v) => s + v, 0) / values.length, 1) : null,
      outcome: bet.outcome
    };
  });

  return {
    participantCount: participants.length,
    tipsTotal: Array.from(buckets.values()).reduce((sum, bucket) => sum + bucket.tips.length, 0),
    matchesTotal: state.matches.length,
    matchesFinished: state.matches.filter((match) => match.result?.saved).length,
    crowdHitRate,
    leaders: {
      hitRate: byHitRate,
      exact: ranking.rows.filter((row) => row.exact > 0).sort((a, b) => b.exact - a.exact).slice(0, 5).map(({ userId, nickname, exact }) => ({ userId, nickname, exact })),
      underdog: ranking.rows.filter((row) => row.underdogHits > 0).sort((a, b) => b.underdogHits - a.underdogHits).slice(0, 5).map(({ userId, nickname, underdogHits }) => ({ userId, nickname, underdogHits })),
      optimists,
      pessimists
    },
    surprises,
    matches: matchSummaries.sort((a, b) => (Date.parse(b.scheduledAt ?? 0) || 0) - (Date.parse(a.scheduledAt ?? 0) || 0)),
    specials
  };
}

export async function getProfile(tournamentId, userId, viewer) {
  const ranking = await computeRanking(tournamentId, 'total');
  const { state, tips, specialTips, participants } = ranking;
  const participant = participants.find((entry) => entry.userId === userId);
  if (!participant) throw new CallitError('CALLIT_USER_NOT_FOUND', 'Tipper nicht gefunden.', 404);
  const isSelf = viewer?.id === userId;
  const activeIds = new Set(participants.map((entry) => entry.userId));
  const buckets = validTipsByMatch(state.matches, tips, activeIds);
  const ordered = state.matches.slice().sort((a, b) => {
    const ta = a.result?.finishedAt ? Date.parse(a.result.finishedAt) : a.scheduledAt ? Date.parse(a.scheduledAt) : Infinity;
    const tb = b.result?.finishedAt ? Date.parse(b.result.finishedAt) : b.scheduledAt ? Date.parse(b.scheduledAt) : Infinity;
    return ta - tb;
  });

  let cumulative = 0;
  const timeline = [];
  const tipList = [];
  ordered.forEach((match) => {
    const bucket = buckets.get(match.code);
    const tip = bucket.tips.find((entry) => entry.userId === userId);
    const score = tip && match.result ? scoreMatchTip(tip, match, { settings: state.settings, shares: bucket.shares }) : null;
    if (match.result && !match.result.live) {
      cumulative = round(cumulative + (score?.total ?? 0), 1);
      timeline.push({ code: match.code, label: matchLabel(match), points: score?.total ?? 0, cumulative });
    }
    if (tip && (match.locked || isSelf)) {
      tipList.push({
        code: match.code,
        label: matchLabel(match),
        stageLabel: match.stageLabel,
        status: match.status,
        scoreHome: tip.scoreHome,
        scoreAway: tip.scoreAway,
        advance: tip.advance,
        isJoker: tip.isJoker,
        result: match.result ? { home: match.result.home, away: match.result.away, live: match.result.live } : null,
        points: score
      });
    }
  });

  const specials = (await listSpecialsForUser(tournamentId, { id: userId }))
    .filter((bet) => bet.locked || isSelf)
    .map((bet) => ({ betKey: bet.betKey, type: bet.type, groupLabel: bet.groupLabel, myLabel: bet.myLabel, myPoints: bet.myPoints, outcome: bet.outcome }));

  return {
    user: { id: userId, nickname: participant.nickname },
    isSelf,
    row: ranking.rows.find((row) => row.userId === userId) ?? null,
    participantCount: participants.length,
    timeline,
    tips: tipList,
    specials,
    specialTipsCount: specialTips.filter((tip) => tip.userId === userId).length
  };
}
