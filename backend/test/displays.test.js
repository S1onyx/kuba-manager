import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState, getState } from '../src/scoreboard/stateStore.js';
import { setDisplayView } from '../src/scoreboard/display.js';
import { clearGame } from '../src/scoreboard/reset.js';

test('Drei Displays mit eigener Ansicht, Standard: Spielstand, Turnierbaum, Tippspiel', () => {
  assert.deepEqual(createDefaultState().displays, { 1: 'scoreboard', 2: 'bracket', 3: 'callit' });
  assert.deepEqual(createDefaultState({ displays: { 1: 'callit', 2: 'quatsch' } }).displays, { 1: 'callit', 2: 'bracket', 3: 'callit' });
});

test('Ansicht wird pro Display gesetzt, ohne Angabe gilt Display 1', () => {
  clearGame();
  let state = setDisplayView('callit', { display: 2, callitTournamentId: 5 });
  assert.deepEqual(state.displays, { 1: 'scoreboard', 2: 'callit', 3: 'callit' });
  assert.equal(state.displayCallitTournamentId, 5);
  state = setDisplayView('bracket');
  assert.equal(state.displays[1], 'bracket');
  assert.throws(() => setDisplayView('bracket', { display: 4 }), { code: 'INVALID_DISPLAY' });
  assert.throws(() => setDisplayView('kino', { display: 1 }), { code: 'INVALID_DISPLAY_VIEW' });
  assert.equal('displayView' in getState(), false);
});
