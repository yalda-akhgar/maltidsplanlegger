import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { repository } from '@/data/repository'
import de from './locales/de.json'
import en from './locales/en.json'
import nb from './locales/nb.json'

// Norwegian (bokmål) is the default and the fallback for any missing key.
// To add a language: create locales/<code>.json and add it here and to
// LANGUAGES in src/data/types.ts.
void i18n.use(initReactI18next).init({
  resources: {
    nb: { translation: nb },
    de: { translation: de },
    en: { translation: en },
  },
  lng: repository.getLanguageSync(),
  fallbackLng: 'nb',
  interpolation: { escapeValue: false },
})

document.documentElement.lang = i18n.language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n
