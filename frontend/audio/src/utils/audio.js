export function describeAudioFile(file, fallback = '') {
  if (!file) {
    return '';
  }
  if (file.label && file.label.trim()) {
    return file.label.trim();
  }
  if (file.original_name) {
    return file.original_name;
  }
  return fallback;
}

export function formatEventTime(timestamp, locale = 'de-DE') {
  if (!timestamp) {
    return '';
  }
  try {
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}
