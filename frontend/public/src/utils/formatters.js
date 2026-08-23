export function formatGroupLabel(label, t) {
  if (!label) return t('groupStandings.groupStage');
  const upper = label.toUpperCase();
  if (upper.startsWith('GRUPPE')) {
    return label;
  }
  return t('groupStandings.groupLabel', { label });
}
