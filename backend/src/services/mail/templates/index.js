import * as de from './de.js';
import * as en from './en.js';
import * as fr from './fr.js';
import * as hu from './hu.js';
import * as cs from './cs.js';

export const SUPPORTED_MAIL_LANGUAGES = ['de', 'en', 'fr', 'hu', 'cs'];
export const DEFAULT_MAIL_LANGUAGE = 'de';

const TEMPLATES = { de, en, fr, hu, cs };

// Akzeptiert auch Region-Formen wie 'en-US' oder 'fr-CH'; unbekannte Sprachen
// fallen auf Deutsch zurueck.
export function normalizeLanguage(lang) {
  const normalized = String(lang ?? '')
    .trim()
    .toLowerCase()
    .split('-')[0];
  return Object.prototype.hasOwnProperty.call(TEMPLATES, normalized)
    ? normalized
    : DEFAULT_MAIL_LANGUAGE;
}

// name: 'registrationSubmitted' | 'registrationApproved' | 'registrationRejected' | 'adminNotification'
// Rueckgabe: { subject, text, html }
export function renderTemplate(name, lang, vars) {
  const bundle = TEMPLATES[normalizeLanguage(lang)] ?? TEMPLATES[DEFAULT_MAIL_LANGUAGE];
  const templateFn = bundle[name];
  if (typeof templateFn !== 'function') {
    throw new Error(`Unbekanntes Mail-Template: ${name}`);
  }
  return templateFn(vars);
}
