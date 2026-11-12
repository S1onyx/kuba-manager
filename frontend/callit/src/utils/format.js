export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60
  };
}

const pad = (value) => String(value).padStart(2, '0');

// Kompakter Countdown: "3 T 04 h", "1:05:09" oder "04:09".
export function formatCountdown(ms) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  if (days > 0) return `${days} T ${pad(hours)} h`;
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatPoints(value, locale = 'de-DE') {
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(numeric);
}

export function formatQuote(value, locale = 'de-DE') {
  if (value === null || value === undefined) return '–';
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatPct(value, locale = 'de-DE') {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value ?? 0))} %`;
}

export function groupMatchesByStage(matches) {
  const groups = [];
  const byLabel = new Map();
  matches.forEach((match) => {
    const key = match.stageLabel || match.phase || '';
    if (!byLabel.has(key)) {
      const group = { key, phase: match.phase, stageLabelI18n: match.stageLabelI18n, label: match.stageLabel, matches: [] };
      byLabel.set(key, group);
      groups.push(group);
    }
    byLabel.get(key).matches.push(match);
  });
  return groups;
}

export function isKoDraw(match, draft) {
  return match.phase !== 'group' && draft.scoreHome !== null && draft.scoreHome === draft.scoreAway;
}

export function canSaveTip(match, draft) {
  if (!draft || draft.scoreHome === null || draft.scoreAway === null) return false;
  if (isKoDraw(match, draft)) return draft.advance === 'home' || draft.advance === 'away';
  return true;
}

export function clampScore(value) {
  return Math.min(99, Math.max(0, Math.trunc(Number(value) || 0)));
}

// Beim ersten Tippen wird die Gegenseite mit 0 vorbelegt, damit sofort gespeichert werden kann.
export function stepDraft(draft, side, delta) {
  const base = {
    scoreHome: draft.scoreHome ?? 0,
    scoreAway: draft.scoreAway ?? 0,
    advance: draft.advance ?? null,
    isJoker: Boolean(draft.isJoker)
  };
  const field = side === 'home' ? 'scoreHome' : 'scoreAway';
  const wasUnset = draft[field] === null || draft[field] === undefined;
  base[field] = clampScore(wasUnset && delta < 0 ? 0 : base[field] + delta);
  if (base.scoreHome !== base.scoreAway) base.advance = null;
  return base;
}

export function nextKickoff(matches, now) {
  const upcoming = matches
    .filter((match) => match.status === 'open' && match.scheduledAt && Date.parse(match.scheduledAt) > now)
    .sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  return upcoming[0] ?? null;
}

export function teamName(match, side) {
  return match[side]?.name || match[`${side}Label`] || '–';
}

export const RANKING_CATEGORIES = ['total', 'matches', 'specials', 'exact', 'underdog', 'group', 'ko'];

export function categoryValueSuffix(category) {
  if (category === 'exact' || category === 'underdog') return 'hits';
  return 'points';
}
