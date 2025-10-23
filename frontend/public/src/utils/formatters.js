export function formatGroupLabel(label) {
  if (!label) return 'Gruppenphase';
  const upper = label.toUpperCase();
  if (upper.startsWith('GRUPPE')) {
    return label;
  }
  return `Gruppe ${label}`;
}
