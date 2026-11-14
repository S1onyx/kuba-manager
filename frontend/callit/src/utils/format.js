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

// Kompakter Countdown: "3 T 04 h" (lokalisiert über t), "1:05:09" oder "04:09".
export function formatCountdown(ms, t) {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  if (days > 0) return t ? t('time.daysHours', { days, hours: pad(hours) }) : `${days}d ${pad(hours)}h`;
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

export const MATCH_FILTERS = ['upcoming', 'open', 'results'];

// Liste kommt in Spielplan-Reihenfolge vom Server. Beendete Spiele nur unter "Ergebnisse", neueste zuerst.
export function filterMatches(matches, filter) {
  if (filter === 'results') return matches.filter((match) => match.status === 'finished').reverse();
  if (filter === 'open') return matches.filter((match) => match.status === 'open');
  return matches.filter((match) => match.status !== 'finished');
}

// Erstes Spiel in Spielplan-Reihenfolge, das weder läuft noch beendet ist.
export function nextMatch(matches) {
  return matches.find((match) => ['open', 'locked', 'pending'].includes(match.status)) ?? null;
}

const signed = (value) => (value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '±0');

// Wie weit der aktuelle Stand je Team vom Tipp entfernt ist (+ = fehlt noch, − = schon drüber).
export function liveTipGap(tip, result) {
  if (!tip || !result) return null;
  const home = tip.scoreHome - result.home;
  const away = tip.scoreAway - result.away;
  return { home: signed(home), away: signed(away), exact: home === 0 && away === 0 };
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

// Sonderwette Finale-Startzeit: Uhrzeit als Minuten seit Mitternacht, Ortszeit des Turniers.
const VENUE_TIME_ZONE = 'Europe/Berlin';

export function clockToMinutes(text) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(text ?? ''));
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function minutesToClock(minutes) {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) return '';
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function formatVenueClock(iso) {
  const time = Date.parse(iso ?? '');
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat('en-GB', { timeZone: VENUE_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(time);
}
