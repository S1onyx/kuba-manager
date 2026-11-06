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
