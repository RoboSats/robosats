import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import HttpApi from 'i18next-http-backend';

// import translationEN from "../../static/locales/en.json";
// import translationES from "../../static/locales/es.json";
// import translationDE from "../../static/locales/de.json";
// import translationRU from "../../static/locales/ru.json";
// // import translationZH from "../../static/locales/zh.json";
// import translationPL from "../../static/locales/pl.json";
// import translationFR from "../../static/locales/fr.json";
// import translationCA from "../../static/locales/ca.json";
// import translationIT from "../../static/locales/it.json";
// import translationPT from "../../static/locales/pt.json";
// import translationEU from "../../static/locales/th.json";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
  // resources: {
  //   en: {translations: translationEN},
  //   es: {translations: translationES},
  //   ru: {translations: translationRU},
  //   de: {translations: translationDE},
  //   // zh: {translations: translationZH},
  //   pl: {translations: translationPL},
  //   fr: {translations: translationFR},
  //   ca: {translations: translationCA},
  //   it: {translations: translationIT},
  //   pt: {translations: translationPT},
  //   eu: {translations: translationEU},
  //   sv: {translations: translationSV},
  //   cs: {translations: translationCS},
  //   th: {translations: translationCS},
  // },
  
  backend:{
    loadPath: '/static/locales/{{lng}}.json',
    allowMultiLoading: false, // set loadPath: '/locales/resources.json?lng={{lng}}&ns={{ns}}' to adapt to multiLoading
    crossDomain: false,
    withCredentials: false,
    overrideMimeType: false,
    reloadInterval: false // can be used to reload resources in a specific interval (useful in server environments)
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
    useSuspense: false,
  }
});

export default i18n;