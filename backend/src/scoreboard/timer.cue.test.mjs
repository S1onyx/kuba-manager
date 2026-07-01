import assert from 'node:assert';
import { classifyCue } from './timer.js';

const cfg = { warningSeconds: 15, countdownFrom: 5 };

// Simulate a countdown to a boundary and collect the beep-second markers.
function beepSeconds(total) {
  const beeps = [];
  for (let left = total; left >= 0; left--) {
    if (classifyCue(left, cfg) === 'timer_countdown_beep') beeps.push(left);
  }
  return beeps;
}

// Beeps only in the last 5s, and NEVER at/after the boundary (0) → no endless beeping.
assert.deepStrictEqual(beepSeconds(60), [5, 4, 3, 2, 1]);
assert.strictEqual(classifyCue(0, cfg), null);
assert.strictEqual(classifyCue(-3, cfg), null);

// Warning fires once, exactly at 15s before the boundary.
assert.strictEqual(classifyCue(15, cfg), 'timer_warning');
assert.strictEqual(classifyCue(16, cfg), null);

// Nachspielzeit: end boundary = remaining(0) + extra(10). Warning/beeps line up on the true end.
const extra = 10;
assert.strictEqual(classifyCue(extra, cfg), null); // 10s left → nothing yet
assert.strictEqual(classifyCue(5, cfg), 'timer_countdown_beep'); // beeps into the real end
assert.strictEqual(classifyCue(0, cfg), null); // boundary → game_end, no beep

// Disabled cues stay silent.
assert.strictEqual(classifyCue(3, { warningSeconds: 0, countdownFrom: 0 }), null);

console.log('classifyCue: all assertions passed');
