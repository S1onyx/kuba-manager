import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSaveTip,
  formatCountdown,
  formatQuote,
  groupMatchesByStage,
  nextKickoff,
  stepDraft
} from '../src/utils/format.js';

test('Countdown-Formate', () => {
  assert.equal(formatCountdown(65_000), '01:05');
  assert.equal(formatCountdown(3_725_000), '1:02:05');
  assert.equal(formatCountdown(2 * 86_400_000 + 3 * 3_600_000), '2 T 03 h');
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

test('Spiele nach Runde gruppieren, Reihenfolge bleibt', () => {
  const groups = groupMatchesByStage([
    { code: '1', stageLabel: 'Gruppe A' },
    { code: '2', stageLabel: 'Finale' },
    { code: '3', stageLabel: 'Gruppe A' }
  ]);
  assert.deepEqual(groups.map((group) => [group.label, group.matches.map((m) => m.code)]), [
    ['Gruppe A', ['1', '3']],
    ['Finale', ['2']]
  ]);
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
