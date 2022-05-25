import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import HttpApi from 'i18next-http-backend';

import translationEN from "../locales/en.json";
import translationES from "../locales/es.json";
import translationDE from "../locales/de.json";
import translationRU from "../locales/ru.json";
// import translationZH from "../locales/zh.json";
import translationPL from "../locales/pl.json";
import translationFR from "../locales/fr.json";
import translationCA from "../locales/ca.json";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
  resources: {
    en: {translations: translationEN},
    es: {translations: translationES},
    ru: {translations: translationRU},
    de: {translations: translationDE},
    // zh: {translations: translationZH},
    pl: {translations: translationPL},
    fr: {translations: translationFR},
    ca: {translations: translationCA},
  },
  
  fallbackLng: "en",
  debug: false,

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