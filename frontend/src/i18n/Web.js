import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

const config = {
  backend: {
    loadPath: '/static/locales/{{lng}}.json',
    allowMultiLoading: false, // set loadPath: '/locales/resources.json?lng={{lng}}&ns={{ns}}' to adapt to multiLoading
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    reloadInterval: false, // can be used to reload resources in a specific interval (useful in server environments)
  },
  fallbackLng: 'en',
  debug: false,

  // have a common namespace used around the full app
  ns: ['translations'],
  defaultNS: 'translations',
  keySeparator: false, // we use content as keys
  interpolation: {
    escapeValue: false,
    formatSeparator: ',',
  },
  react: {
    useSuspense: false,
  },
};

await i18n.use(HttpApi).use(LanguageDetector).use(initReactI18next).init(config);

export default i18n;
