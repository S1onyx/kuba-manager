export function mergeScheduleDrafts(drafts, previousServerValues, nextServerValues) {
  const merged = {};
  Object.entries(nextServerValues).forEach(([key, serverValue]) => {
    const hasDraft = Object.prototype.hasOwnProperty.call(drafts, key);
    const isDirty = hasDraft && drafts[key] !== (previousServerValues[key] ?? '');
    merged[key] = isDirty ? drafts[key] : serverValue;
  });
  return merged;
}

export function countUnsavedDrafts(drafts, serverValues) {
  return Object.entries(serverValues).filter(
    ([key, serverValue]) => Object.prototype.hasOwnProperty.call(drafts, key) && drafts[key] !== serverValue
  ).length;
}

export function interleaveGroupSlots(games) {
  const slots = games.map((game) => game.value).sort();
  const queues = new Map();
  [...games]
    .sort((a, b) => a.value.localeCompare(b.value))
    .forEach((game) => {
      if (!queues.has(game.group)) queues.set(game.group, []);
      queues.get(game.group).push(game);
    });
  const groupOrder = [...queues.keys()].sort((a, b) => a.localeCompare(b, 'de', { numeric: true }));
  const ordered = [];
  while (ordered.length < games.length) {
    groupOrder.forEach((group) => {
      const next = queues.get(group).shift();
      if (next) ordered.push(next);
    });
  }
  return Object.fromEntries(ordered.map((game, index) => [game.id, slots[index]]));
}
