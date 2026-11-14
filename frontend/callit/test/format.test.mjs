import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSaveTip,
  clockToMinutes,
  filterMatches,
  formatVenueClock,
  liveTipGap,
  minutesToClock,
  nextMatch,
  formatCountdown,
  formatQuote,
  nextKickoff,
  stepDraft
} from '../src/utils/format.js';

test('Countdown-Formate', () => {
  assert.equal(formatCountdown(65_000), '01:05');
  assert.equal(formatCountdown(3_725_000), '1:02:05');
  assert.equal(formatCountdown(2 * 86_400_000 + 3 * 3_600_000), '2d 03h');
  assert.equal(formatCountdown(2 * 86_400_000, (key, v) => `${key}:${v.days}:${v.hours}`), 'time.daysHours:2:00');
  assert.equal(formatCountdown(-5), '00:00');
});

test('Quote mit zwei Nachkommastellen, fehlend als Strich', () => {
  assert.equal(formatQuote(1.5, 'de-DE'), '1,50');
  assert.equal(formatQuote(null), '–');
});

test('Stepper: erster Tipp belegt Gegenseite mit 0, Grenzen 0–99', () => {
  const empty = { scoreHome: null, scoreAway: null };
  assert.deepEqual(stepDraft(empty, 'home', 1), { scoreHome: 1, scoreAway: 0, advance: null, isJoker: false });
  assert.deepEqual(stepDraft(empty, 'away', -1), { scoreHome: 0, scoreAway: 0, advance: null, isJoker: false });
  assert.equal(stepDraft({ scoreHome: 99, scoreAway: 0 }, 'home', 1).scoreHome, 99);
  assert.equal(stepDraft({ scoreHome: 2, scoreAway: 2, advance: 'home' }, 'home', 1).advance, null);
});

test('KO-Unentschieden braucht Weiterkommer', () => {
  const ko = { phase: 'knockout' };
  assert.equal(canSaveTip(ko, { scoreHome: 2, scoreAway: 2, advance: null }), false);
  assert.equal(canSaveTip(ko, { scoreHome: 2, scoreAway: 2, advance: 'away' }), true);
  assert.equal(canSaveTip({ phase: 'group' }, { scoreHome: 2, scoreAway: 2 }), true);
  assert.equal(canSaveTip(ko, { scoreHome: null, scoreAway: 1 }), false);
});

const schedule = [
  { code: '1', status: 'finished' },
  { code: '2', status: 'finished' },
  { code: '3', status: 'live' },
  { code: '4', status: 'locked' },
  { code: '5', status: 'open' },
  { code: '6', status: 'pending' }
];
const codes = (list) => list.map((match) => match.code);

test('Spielliste in Spielplan-Reihenfolge, Beendete nur unter Ergebnisse (neueste zuerst)', () => {
  assert.deepEqual(codes(filterMatches(schedule, 'upcoming')), ['3', '4', '5', '6']);
  assert.deepEqual(codes(filterMatches(schedule, 'open')), ['5']);
  assert.deepEqual(codes(filterMatches(schedule, 'results')), ['2', '1']);
});

test('Als Nächstes: erstes Spiel nach dem laufenden, das noch nicht begonnen hat', () => {
  assert.equal(nextMatch(schedule).code, '4');
  assert.equal(nextMatch(schedule.slice(0, 3)), null);
});

test('Live: Abstand zwischen aktuellem Stand und Tipp je Team', () => {
  assert.deepEqual(liveTipGap({ scoreHome: 5, scoreAway: 2 }, { home: 4, away: 3 }), { home: '+1', away: '−1', exact: false });
  assert.deepEqual(liveTipGap({ scoreHome: 4, scoreAway: 3 }, { home: 4, away: 3 }), { home: '±0', away: '±0', exact: true });
  assert.equal(liveTipGap(null, { home: 1, away: 0 }), null);
});

test('Nächster Anpfiff nur aus offenen, zukünftigen Spielen', () => {
  const now = Date.parse('2026-11-20T10:00:00Z');
  const next = nextKickoff(
    [
      { code: 'a', status: 'open', scheduledAt: '2026-11-20T09:00:00Z' },
      { code: 'b', status: 'locked', scheduledAt: '2026-11-20T10:30:00Z' },
      { code: 'c', status: 'open', scheduledAt: '2026-11-20T11:00:00Z' },
      { code: 'd', status: 'open', scheduledAt: '2026-11-20T10:15:00Z' }
    ],
    now
  );
  assert.equal(next.code, 'd');
});

test('Finale-Startzeit: HH:MM <-> Minuten, Spielplanzeit in Ortszeit', () => {
  assert.equal(clockToMinutes('17:05'), 17 * 60 + 5);
  assert.equal(clockToMinutes('24:00'), null);
  assert.equal(clockToMinutes(''), null);
  assert.equal(minutesToClock(17 * 60 + 5), '17:05');
  assert.equal(minutesToClock(undefined), '');
  assert.equal(formatVenueClock('2026-11-14T16:30:00.000Z'), '17:30');
  assert.equal(formatVenueClock(null), null);
});
