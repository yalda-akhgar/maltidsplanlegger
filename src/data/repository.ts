/**
 * Data access layer.
 *
 * ALL reads and writes of app data go through this module, so the storage
 * backend can be swapped (localStorage now, Supabase in phase 5) without
 * touching the screens. Screens must never call localStorage directly.
 *
 * Note: the colour theme is stored by `next-themes` itself (key `mp:theme`),
 * because it must be applied before React renders to avoid a flash.
 */

const PREFIX = 'mp:'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    // Storage can be unavailable (private mode, blocked site data) – never crash.
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Ignore: the app keeps working for this session without persistence.
  }
}

export const SUPPORTED_LANGUAGES = ['nb', 'de', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

export const repository = {
  getLanguage(): Language {
    const value = read<string>('language', 'nb')
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(value) ? (value as Language) : 'nb'
  },
  setLanguage(language: Language): void {
    write('language', language)
  },

  isInstallCardDismissed(): boolean {
    return read('installCardDismissed', false)
  },
  dismissInstallCard(): void {
    write('installCardDismissed', true)
  },
}
