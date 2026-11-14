import {
  getState,
  notifySubscribers,
  snapshotState,
  DISPLAY_VIEWS,
  DEFAULT_DISPLAY_VIEW,
  DISPLAY_SLOTS
} from './stateStore.js';

function displayError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Ansicht für genau ein Display (1–3); ohne Angabe Display 1.
export function setDisplayView(view, { display = '1', callitTournamentId } = {}) {
  const normalized = typeof view === 'string' ? view.toLowerCase().trim() : '';
  const target = DISPLAY_VIEWS.includes(normalized) ? normalized : null;
  if (!target) {
    throw displayError('INVALID_DISPLAY_VIEW', `Ungültiger Anzeige-Modus. Erlaubt: ${DISPLAY_VIEWS.join(', ')}`);
  }
  const slot = String(display ?? '1');
  if (!DISPLAY_SLOTS.includes(slot)) {
    throw displayError('INVALID_DISPLAY', `Ungültiges Display. Erlaubt: ${DISPLAY_SLOTS.join(', ')}`);
  }

  const state = getState();
  const numericTournamentId = Number(callitTournamentId);
  const nextCallitTournamentId =
    Number.isInteger(numericTournamentId) && numericTournamentId > 0
      ? numericTournamentId
      : state.displayCallitTournamentId ?? null;
  if (state.displays[slot] === target && state.displayCallitTournamentId === nextCallitTournamentId) {
    return snapshotState();
  }

  state.displays = { ...state.displays, [slot]: target };
  state.displayCallitTournamentId = nextCallitTournamentId;
  notifySubscribers();
  return snapshotState();
}

export function getDisplayView(display = '1') {
  return getState().displays?.[String(display)] ?? DEFAULT_DISPLAY_VIEW;
}

export { DISPLAY_VIEWS, DEFAULT_DISPLAY_VIEW };
