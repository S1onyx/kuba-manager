import i18n from '../i18n/index.js';

// Übersetzt API-Fehler anhand des vom Backend gelieferten Codes ({ code, message }).
// Fallback-Reihenfolge: t('error.' + code) → deutsche Backend-message → fallbackKey → error.generic.
export function formatApiError(error, t, fallbackKey) {
  const code = error?.code;
  if (code) {
    const key = `error.${code}`;
    if (i18n.exists(key)) {
      return t(key);
    }
  }

  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (message && !message.startsWith('{') && message !== 'Request failed') {
    return message;
  }

  return fallbackKey ? t(fallbackKey) : t('error.generic');
}
