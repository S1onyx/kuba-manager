import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import hu from './locales/hu.json';
import cs from './locales/cs.json';
import swg from './locales/swg.json';
import gsw from './locales/gsw.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'hu', 'cs', 'swg', 'gsw', 'zh', 'ja'];

export const DEFAULT_LANGUAGE = 'de';

const DATE_LOCALES = {
  de: 'de-DE',
  en: 'en-GB',
  fr: 'fr-FR',
  hu: 'hu-HU',
  cs: 'cs-CZ',
  swg: 'de-DE',
  gsw: 'de-CH',
  zh: 'zh-CN',
  ja: 'ja-JP'
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
      fr: { translation: fr },
      hu: { translation: hu },
      cs: { translation: cs },
      swg: { translation: swg },
      gsw: { translation: gsw },
      zh: { translation: zh },
      ja: { translation: ja }
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'kuba-lang',
      caches: ['localStorage']
    }
  });

export function resolveLanguage(language) {
  const code = String(language || '').split('-')[0].toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE;
}

export function useDateLocale() {
  const { i18n: instance } = useTranslation();
  return DATE_LOCALES[resolveLanguage(instance.resolvedLanguage ?? instance.language)] ?? DATE_LOCALES[DEFAULT_LANGUAGE];
}

export default i18n;
