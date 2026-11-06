import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseContentWidth } from '../src/utils/fitWidth.js';

const reflowingContent = (area) => (width) => area / width;

test('Breitbild: wählt breites Layout statt schmaler Spalte mit kleiner Skalierung', () => {
  const { width, scale } = chooseContentWidth({ availableWidth: 1920, availableHeight: 1080, measureHeight: reflowingContent(1200 * 2400) });
  assert.ok(width > 1500, `Breite ${width}`);
  assert.ok(scale > 0.6, `Skalierung ${scale}`);
});

test('Ergebnis ist mindestens so gut wie die alte feste Breite 1200px', () => {
  const measureHeight = reflowingContent(1200 * 2400);
  const old = Math.min(1920 / 1200, 1080 / measureHeight(1200));
  const { scale } = chooseContentWidth({ availableWidth: 1920, availableHeight: 1080, measureHeight });
  assert.ok(scale >= old, `${scale} < ${old}`);
});

test('Schmaler Bildschirm: nutzt verfügbare Breite', () => {
  const { width } = chooseContentWidth({ availableWidth: 375, availableHeight: 700, measureHeight: () => 600 });
  assert.equal(width, 375);
});

test('Maximale Skalierung wird respektiert', () => {
  const { scale } = chooseContentWidth({ availableWidth: 3840, availableHeight: 2160, measureHeight: () => 200, maxScale: 2.2 });
  assert.ok(scale <= 2.2);
});
