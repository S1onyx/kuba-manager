import {
  getState,
  notifySubscribers,
  snapshotState,
  DISPLAY_VIEWS,
  DEFAULT_DISPLAY_VIEW
} from './stateStore.js';

export function setDisplayView(view) {
  const normalized = typeof view === 'string' ? view.toLowerCase().trim() : '';
  const target = DISPLAY_VIEWS.includes(normalized) ? normalized : null;

  if (!target) {
    const allowed = DISPLAY_VIEWS.join(', ');
    const error = new Error(`Ungültiger Anzeige-Modus. Erlaubt: ${allowed}`);
    error.code = 'INVALID_DISPLAY_VIEW';
    throw error;
  }

  const state = getState();
  if (state.displayView === target) {
    return snapshotState();
  }

  state.displayView = target;
  notifySubscribers();
  return snapshotState();
}

export function getDisplayView() {
  const state = getState();
  return state.displayView ?? DEFAULT_DISPLAY_VIEW;
}

export { DISPLAY_VIEWS, DEFAULT_DISPLAY_VIEW };
