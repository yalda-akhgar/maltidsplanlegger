import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '@/data/types'

/** The current UI language as one of the supported codes. */
export function useLanguage(): Language {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? i18n.language
  return (LANGUAGES as readonly string[]).includes(current) ? (current as Language) : 'nb'
}
