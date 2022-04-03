import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import XHR from "i18next-xhr-backend";

import translationEN from "./locales/en/translation.json";
import translationES from "./locales/es/translation.json";
import translationDE from "./locales/de/translation.json";
import translationRU from "./locales/ru/translation.json";
import translationCN from "./locales/cn/translation.json";

i18n
  .use(XHR)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
  resources: {
    en: {translations: translationEN},
    'en-US': {translations: translationEN},
    es: {translations: translationES},
    ru: {translations: translationRU},
    de: {translations: translationDE},
    cn: {translations: translationCN},
  },
  
  fallbackLng: "en",
  debug: true,

  // have a common namespace used around the full app
  ns: ["translations"],
  defaultNS: "translations",

  keySeparator: false, // we use content as keys

  interpolation: {
    escapeValue: false,
    formatSeparator: ","
  },

  react: {
    wait: true,
    useSuspense: false,
  }
});

export default i18n;