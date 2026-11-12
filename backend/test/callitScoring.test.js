import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS, normalizeSettings, specialTypeOf } from '../src/services/callit/settings.js';
import {
  computeStandings,
  rankRows,
  scoreMatchTip,
  scoreSpecials,
  tendencyShares,
  tipLevel
} from '../src/services/callit/scoring.js';

const settings = normalizeSettings({});
const home = { key: 'id:1', name: 'A' };
const away = { key: 'id:2', name: 'B' };
const match = (overrides = {}) => ({
  code: 'M1',
  phase: 'group',
  isFinal: false,
  home,
  away,
  result: { home: 4, away: 2, winner: 'home', live: false },
  ...overrides
});
const tip = (scoreHome, scoreAway, extra = {}) => ({
  userId: 1,
  code: 'M1',
  scoreHome,
  scoreAway,
  advance: null,
  isJoker: false,
  homeKey: 'id:1',
  awayKey: 'id:2',
  ...extra
});
const noShares = { count: 0, home: 0, draw: 0, away: 0 };

test('Defaults entsprechen der Spezifikation', () => {
  assert.deepEqual(settings.points, { exact: 4, diff: 3, tendency: 2, koAdvance: 1 });
  assert.equal(settings.multipliers.final, 2);
  assert.equal(settings.joker.perPhase, 1);
  assert.deepEqual(
    Object.fromEntries(Object.entries(settings.specials).map(([k, v]) => [k, v.points])),
    { winner: 10, top_scorer: 6, most_penalty_seconds: 6, group_winner: 3, total_baskets: 5 }
  );
  assert.equal(settings.locks.atScheduledTime, false);
  assert.deepEqual(normalizeSettings(DEFAULT_SETTINGS), settings);
});

test('Settings werden begrenzt und unbekannte Felder verworfen', () => {
  const normalized = normalizeSettings({ points: { exact: -3, diff: 'x' }, hack: 1, underdog: { thresholdPct: 500 } });
  assert.equal(normalized.points.exact, 0);
  assert.equal(normalized.points.diff, 3);
  assert.equal(normalized.underdog.thresholdPct, 100);
  assert.equal('hack' in normalized, false);
  assert.equal(normalizeSettings({ points: { exact: '' }, multipliers: { final: null } }).points.exact, 4);
  assert.equal(normalizeSettings({ multipliers: { final: null } }).multipliers.final, 2);
});

test('specialTypeOf erkennt Gruppensieger-Keys', () => {
  assert.equal(specialTypeOf('group_winner:A'), 'group_winner');
  assert.equal(specialTypeOf('group_winner'), null);
  assert.equal(specialTypeOf('winner'), 'winner');
  assert.equal(specialTypeOf('drop table'), null);
});

test('Stufen: exakt, Differenz, Tendenz, falsch', () => {
  const result = { home: 4, away: 2 };
  assert.equal(tipLevel(tip(4, 2), result), 'exact');
  assert.equal(tipLevel(tip(2, 0), result), 'diff');
  assert.equal(tipLevel(tip(6, 0), result), 'tendency');
  assert.equal(tipLevel(tip(0, 2), result), 'miss');
  assert.equal(tipLevel(tip(1, 1), { home: 0, away: 0 }), 'diff');
});

test('Punkte je Stufe mit Defaults 4/3/2/0', () => {
  const ctx = { settings, shares: noShares };
  assert.equal(scoreMatchTip(tip(4, 2), match(), ctx).total, 4);
  assert.equal(scoreMatchTip(tip(2, 0), match(), ctx).total, 3);
  assert.equal(scoreMatchTip(tip(9, 1), match(), ctx).total, 2);
  assert.equal(scoreMatchTip(tip(0, 0), match(), ctx).total, 0);
  assert.equal(scoreMatchTip(tip(0, 0), match({ result: null }), ctx), null);
});

test('KO-Weiterkommer gibt +1 nur bei Unentschieden-Tipp', () => {
  const ko = match({ phase: 'knockout', result: { home: 2, away: 2, winner: 'away', live: false } });
  const ctx = { settings, shares: noShares };
  assert.equal(scoreMatchTip(tip(2, 2, { advance: 'away' }), ko, ctx).total, 5);
  assert.equal(scoreMatchTip(tip(2, 2, { advance: 'home' }), ko, ctx).total, 4);
  assert.equal(scoreMatchTip(tip(0, 0, { advance: 'away' }), ko, ctx).total, 4);
  assert.equal(scoreMatchTip(tip(2, 2, { advance: 'away' }), match({ result: ko.result }), ctx).total, 4);
  const notDraw = match({ phase: 'knockout', result: { home: 5, away: 3, winner: 'home', live: false } });
  assert.equal(scoreMatchTip(tip(2, 2, { advance: 'home' }), notDraw, ctx).total, 0);
});

test('Finale ×2 und Joker ×2 multiplizieren, Underdog nicht', () => {
  const final = match({ phase: 'knockout', isFinal: true });
  const shares = { count: 10, home: 0.2, draw: 0.3, away: 0.5 };
  const score = scoreMatchTip(tip(4, 2, { isJoker: true }), final, { settings, shares });
  assert.equal(score.multiplier, 2);
  assert.equal(score.joker, 2);
  assert.equal(score.underdog, 1);
  assert.equal(score.total, 4 * 2 * 2 + 1);
});

test('Joker wirkt nicht, wenn deaktiviert', () => {
  const off = normalizeSettings({ joker: { enabled: false } });
  assert.equal(scoreMatchTip(tip(4, 2, { isJoker: true }), match(), { settings: off, shares: noShares }).total, 4);
});

test('Underdog: Schwelle 25 % inklusive, mindestens 5 Tipps', () => {
  const at = { count: 8, home: 0.25, draw: 0.25, away: 0.5 };
  const above = { count: 8, home: 0.26, draw: 0.24, away: 0.5 };
  const few = { count: 4, home: 0.25, draw: 0.25, away: 0.5 };
  assert.equal(scoreMatchTip(tip(9, 1), match(), { settings, shares: at }).underdog, 1);
  assert.equal(scoreMatchTip(tip(9, 1), match(), { settings, shares: above }).underdog, 0);
  assert.equal(scoreMatchTip(tip(9, 1), match(), { settings, shares: few }).underdog, 0);
  assert.equal(scoreMatchTip(tip(0, 3), match(), { settings, shares: at }).underdog, 0);
});

test('tendencyShares zählt Anteile', () => {
  const shares = tendencyShares([tip(1, 0), tip(2, 0), tip(0, 0), tip(0, 1)]);
  assert.deepEqual(shares.counts, { home: 2, draw: 1, away: 1 });
  assert.equal(shares.home, 0.5);
});

test('Sonderwetten: Gleichstand mehrerer Topscorer gibt allen Treffern Punkte', () => {
  const outcomes = new Map([
    ['top_scorer', { keys: ['7', '9'], final: true }],
    ['winner', { keys: ['id:1'], final: true }]
  ]);
  const result = scoreSpecials(
    [
      { userId: 1, betKey: 'top_scorer', value: { key: '7' } },
      { userId: 2, betKey: 'top_scorer', value: { key: 9 } },
      { userId: 3, betKey: 'top_scorer', value: { key: '1' } },
      { userId: 1, betKey: 'winner', value: { key: 'id:1' } }
    ],
    outcomes,
    settings
  );
  assert.equal(result.get(1).final, 16);
  assert.equal(result.get(2).final, 6);
  assert.equal(result.get(3).final, 0);
});

test('Gesamtkörbe: nächster Wert gewinnt, Gleichstand für alle', () => {
  const outcomes = new Map([['total_baskets', { value: 100, final: true }]]);
  const result = scoreSpecials(
    [
      { userId: 1, betKey: 'total_baskets', value: { value: 95 } },
      { userId: 2, betKey: 'total_baskets', value: { value: 105 } },
      { userId: 3, betKey: 'total_baskets', value: { value: 120 } }
    ],
    outcomes,
    settings
  );
  assert.equal(result.get(1).final, 5);
  assert.equal(result.get(2).final, 5);
  assert.equal(result.get(3).final, 0);
});

test('Vorläufige Sonderwetten zählen nicht in die Gesamtpunkte', () => {
  const outcomes = new Map([['group_winner:A', { keys: ['id:1'], final: false }]]);
  const result = scoreSpecials([{ userId: 1, betKey: 'group_winner:A', value: { key: 'id:1' } }], outcomes, settings);
  assert.deepEqual([result.get(1).final, result.get(1).provisional], [0, 3]);
});

test('Deaktivierte Sonderwette bringt keine Punkte', () => {
  const off = normalizeSettings({ specials: { winner: { enabled: false } } });
  const result = scoreSpecials(
    [{ userId: 1, betKey: 'winner', value: { key: 'id:1' } }],
    new Map([['winner', { keys: ['id:1'], final: true }]]),
    off
  );
  assert.equal(result.get(1), undefined);
});

test('Tipp auf alte Paarung zählt nicht', () => {
  const rows = computeStandings({
    participants: [{ userId: 1, nickname: 'a' }],
    matches: [match({ away: { key: 'id:3', name: 'C' } })],
    tips: [tip(4, 2)],
    specialTips: [],
    specialOutcomes: new Map(),
    settings
  });
  assert.equal(rows[0].total, 0);
  assert.equal(rows[0].tipsCount, 0);
});

test('Standings + Ranking: Tiebreak exakt vor Differenz, geteilte Plätze', () => {
  const matches = [match(), match({ code: 'M2', result: { home: 1, away: 0, winner: 'home', live: false } })];
  const tips = [
    tip(4, 2, { userId: 1 }),
    tip(5, 0, { userId: 1, code: 'M2' }),
    tip(2, 0, { userId: 2 }),
    tip(2, 1, { userId: 2, code: 'M2' }),
    tip(2, 0, { userId: 3 }),
    tip(2, 1, { userId: 3, code: 'M2' }),
    tip(0, 5, { userId: 4 })
  ];
  const participants = [1, 2, 3, 4, 5].map((userId) => ({ userId, nickname: `u${userId}` }));
  const rows = computeStandings({ participants, matches, tips, specialTips: [], specialOutcomes: new Map(), settings });
  const ranked = rankRows(rows, 'total');
  assert.deepEqual(
    ranked.map((row) => [row.nickname, row.total, row.rank]),
    [
      ['u1', 6, 1],
      ['u2', 6, 2],
      ['u3', 6, 2],
      ['u4', 0, 4],
      ['u5', 0, 4]
    ]
  );
  assert.equal(rankRows(rows, 'exact')[0].nickname, 'u1');
});

test('Disqualifizierte (nicht in participants) zählen nicht für Underdog-Anteile', () => {
  const tips = [
    tip(0, 1, { userId: 1 }),
    ...[2, 3, 4, 5].map((userId) => tip(9, 1, { userId }))
  ];
  const participants = [1, 2, 3, 4, 5, 6, 7, 8].map((userId) => ({ userId, nickname: `u${userId}` }));
  const result = { home: 0, away: 2, winner: 'away', live: false };
  const rows = computeStandings({
    participants: participants.filter((p) => p.userId !== 2),
    matches: [match({ result })],
    tips,
    specialTips: [],
    specialOutcomes: new Map(),
    settings
  });
  const u1 = rows.find((row) => row.userId === 1);
  assert.equal(u1.total, 2);
  assert.equal(u1.underdogHits, 0);
});

test('Live-Punkte werden separat mitgezählt', () => {
  const rows = computeStandings({
    participants: [{ userId: 1, nickname: 'a' }],
    matches: [match({ result: { home: 4, away: 2, winner: 'home', live: true } })],
    tips: [tip(4, 2)],
    specialTips: [],
    specialOutcomes: new Map(),
    settings
  });
  assert.equal(rows[0].livePoints, 4);
  assert.equal(rows[0].total, 4);
});
