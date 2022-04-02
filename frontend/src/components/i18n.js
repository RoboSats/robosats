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
    en: {
      translations: translationEN
    },
    es: {
      translations: translationES
    },

    ru: {
      translations: {
        Introduction: "प्रस्तावना",
        "is an internationalization-framework which offers a complete solution to localize your product from web to mobile and desktop":
          "एक अंतर्राष्ट्रीयकरण - ढांचा है जो आपके उत्पाद को वेब से मोबाइल और डेस्कटॉप पर स्थानांतरित करने का एक संपूर्ण समाधान प्रदान करता है",
        "Plugins to detect the user language":
          "उपयोगकर्ता भाषा का पता लगाने के लिए प्लगइन्स",
        "Plugins to load translations": "अनुवाद लोड करने के लिए प्लगइन्स",
        "Optionally cache the translations": "वैकल्पिक रूप से अनुवाद कैश करें",
        Advantages: "लाभ",
        "Flexibility to use other packages":
          "अन्य पैकेजों का उपयोग करने के लिए लचीलापन"
      }
    },

    de: {
      translations: {
        Introduction: "Einführung",
        "is an internationalization-framework which offers a complete solution to localize your product from web to mobile and desktop":
          "ist ein Internationalisierungs-Framework, das eine Komplettlösung für die Lokalisierung Ihres Produkts vom Web auf das Handy und den Desktop bietet",
        "Plugins to detect the user language":
          "Plugins zur Erkennung der Benutzersprache",
        "Plugins to load translations": "Plugins zum Laden von Übersetzungen",
        "Optionally cache the translations":
          "Optional die Übersetzungen zwischenspeichern",
        Advantages: "Vorteile",
        "Flexibility to use other packages":
          "Flexibilität zur Verwendung anderer Pakete"
      }
    },
    cn: {
      translations: {
        Introduction: "Introduction",
        "is an internationalization-framework which offers a complete solution to localize your product from web to mobile and desktop":
          "est un cadre d'internationalisation qui offre une solution complète pour localiser votre produit du Web au mobile et au bureau",
        "Plugins to detect the user language":
          "Plugins pour détecter la langue de l'utilisateur",
        "Plugins to load translations": "Plugins pour charger les traductions",
        "Optionally cache the translations":
          "Cachez éventuellement les traductions",
        Advantages: "Les avantages",
        "Flexibility to use other packages":
          "Flexibilité d'utiliser d'autres packages"
      }
    }
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
    useSuspense: true
  }
});

export default i18n;