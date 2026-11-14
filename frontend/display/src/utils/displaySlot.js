// Jeder Bildschirm ist Display 1, 2 oder 3 und zeigt die im Admin dafür gewählte Ansicht.
export const DISPLAY_SLOTS = ['1', '2', '3'];
const VIEWS = ['scoreboard', 'bracket', 'callit'];

// Reihenfolge: URL ?display=N, dann im Browser gespeichert, dann alter Spiegel-Modus (= Display 2).
export function resolveDisplaySlot({ search = '', stored = null, legacyMirror = null } = {}) {
  const fromUrl = new URLSearchParams(search).get('display');
  if (DISPLAY_SLOTS.includes(fromUrl)) return fromUrl;
  if (DISPLAY_SLOTS.includes(stored)) return stored;
  return legacyMirror === '1' ? '2' : '1';
}

export const nextDisplaySlot = (slot) => DISPLAY_SLOTS[(DISPLAY_SLOTS.indexOf(slot) + 1) % DISPLAY_SLOTS.length];

export function viewForDisplay(scoreboard, slot) {
  const view = scoreboard?.displays?.[slot];
  return VIEWS.includes(view) ? view : 'scoreboard';
}
