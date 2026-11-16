import { LANGUAGES, type Language, type LocalizedText } from './types'

/**
 * Picks the text in the wanted language. Falls back to Norwegian (the app's
 * default), then to any language that has a value (#65).
 */
export function localize(text: LocalizedText | undefined, language: Language): string {
  if (!text) return ''
  return text[language] ?? text.nb ?? LANGUAGES.map((l) => text[l]).find(Boolean) ?? ''
}

/** All non-empty values, e.g. for matching exclusions in every language (#68). */
export function allTranslations(text: LocalizedText | undefined): string[] {
  if (!text) return []
  return LANGUAGES.map((l) => text[l]).filter((v): v is string => Boolean(v))
}
