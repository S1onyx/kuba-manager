export function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatGroupLabel(label) {
  if (!label) {
    return '';
  }

  const upper = label.toUpperCase();
  if (upper.startsWith('GRUPPE')) {
    return label;
  }
  return `Gruppe ${label}`;
}

export function formatStageDescription(stageType, stageLabel) {
  if (!stageLabel) {
    return '';
  }

  switch (stageType) {
    case 'group':
      return `Gruppenphase · ${formatGroupLabel(stageLabel)}`;
    case 'knockout':
      return `KO-Runde · ${stageLabel}`;
    case 'placement':
      return `Platzierung · ${stageLabel}`;
    default:
      return stageLabel;
  }
}
