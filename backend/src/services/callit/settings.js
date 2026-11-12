export const SPECIAL_BET_TYPES = ['winner', 'top_scorer', 'most_penalty_seconds', 'group_winner', 'total_baskets'];

export const DEFAULT_SETTINGS = Object.freeze({
  points: { exact: 4, diff: 3, tendency: 2, koAdvance: 1 },
  multipliers: { group: 1, knockout: 1, placement: 1, final: 2 },
  joker: { enabled: true, perPhase: 1 },
  underdog: { enabled: true, thresholdPct: 25, minTips: 5, bonus: 1 },
  specials: {
    winner: { enabled: true, points: 10, deadline: null },
    top_scorer: { enabled: true, points: 6, deadline: null },
    most_penalty_seconds: { enabled: true, points: 6, deadline: null },
    group_winner: { enabled: true, points: 3, deadline: null },
    total_baskets: { enabled: true, points: 5, deadline: null }
  },
  locks: { atScheduledTime: false }
});

function num(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed * 100) / 100));
}

function int(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function bool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function deadline(value) {
  if (value === null || value === undefined || value === '') return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

// Unbekannte Felder werden verworfen, fehlende mit Defaults aufgefüllt.
export function normalizeSettings(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_SETTINGS;
  const points = source.points ?? {};
  const multipliers = source.multipliers ?? {};
  const joker = source.joker ?? {};
  const underdog = source.underdog ?? {};
  const specials = source.specials ?? {};
  const locks = source.locks ?? {};

  return {
    points: {
      exact: num(points.exact, d.points.exact, 0, 100),
      diff: num(points.diff, d.points.diff, 0, 100),
      tendency: num(points.tendency, d.points.tendency, 0, 100),
      koAdvance: num(points.koAdvance, d.points.koAdvance, 0, 100)
    },
    multipliers: {
      group: num(multipliers.group, d.multipliers.group, 0, 10),
      knockout: num(multipliers.knockout, d.multipliers.knockout, 0, 10),
      placement: num(multipliers.placement, d.multipliers.placement, 0, 10),
      final: num(multipliers.final, d.multipliers.final, 0, 10)
    },
    joker: {
      enabled: bool(joker.enabled, d.joker.enabled),
      perPhase: int(joker.perPhase, d.joker.perPhase, 0, 10)
    },
    underdog: {
      enabled: bool(underdog.enabled, d.underdog.enabled),
      thresholdPct: num(underdog.thresholdPct, d.underdog.thresholdPct, 1, 100),
      minTips: int(underdog.minTips, d.underdog.minTips, 1, 10000),
      bonus: num(underdog.bonus, d.underdog.bonus, 0, 100)
    },
    specials: Object.fromEntries(
      SPECIAL_BET_TYPES.map((type) => {
        const entry = specials[type] ?? {};
        return [
          type,
          {
            enabled: bool(entry.enabled, d.specials[type].enabled),
            points: num(entry.points, d.specials[type].points, 0, 1000),
            deadline: deadline(entry.deadline)
          }
        ];
      })
    ),
    locks: { atScheduledTime: bool(locks.atScheduledTime, d.locks.atScheduledTime) }
  };
}

export function specialTypeOf(betKey) {
  const key = String(betKey ?? '');
  if (key.startsWith('group_winner:')) return 'group_winner';
  return SPECIAL_BET_TYPES.includes(key) && key !== 'group_winner' ? key : null;
}
