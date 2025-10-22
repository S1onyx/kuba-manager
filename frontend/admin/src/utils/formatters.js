export function formatTime(seconds = 0) {
  const total = Math.max(0, Math.trunc(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function formatDateTimeLocalInput(isoString) {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function normalizeLocalDateTimeToISO(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export function parseTimerInput(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.includes(':')) {
    const [minPart, secPart = '0'] = trimmed.split(':');
    const minutes = Number(minPart);
    const seconds = Number(secPart);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) {
      return null;
    }
    return Math.max(0, Math.trunc(minutes) * 60 + Math.trunc(seconds));
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.trunc(numeric));
}

export function canonicalizeGroupLabel(label) {
  const raw = (label ?? '').toString().trim();
  if (!raw) {
    return '';
  }

  const upper = raw.toUpperCase();
  const match = upper.match(/^(GRUPPE|GROUP)\s+/);
  if (match) {
    return upper.slice(match[0].length).trim();
  }

  return upper.trim();
}
