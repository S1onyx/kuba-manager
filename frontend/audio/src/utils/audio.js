export function describeAudioFile(file) {
  if (!file) {
    return '';
  }
  if (file.label && file.label.trim()) {
    return file.label.trim();
  }
  if (file.original_name) {
    return file.original_name;
  }
  return `Sound #${file.id ?? ''}`;
}

export function formatEventTime(timestamp) {
  if (!timestamp) {
    return '';
  }
  try {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}
