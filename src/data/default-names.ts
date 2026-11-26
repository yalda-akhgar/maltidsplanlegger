import type { Person } from './types'

/**
 * Default names saved before #195 ("Meg", "Voksen 2", "Child 1" … in any of
 * the app's languages). The one-time clean-up (schema v6) empties them, so
 * they follow the language. Exact matches only – typed names are kept.
 */
const OLD_DEFAULTS = {
  me: ['Meg', 'Me', 'Ich'],
  adult: ['Voksen', 'Adult', 'Erwachsene/r'],
  child: ['Barn', 'Child', 'Kind'],
}

export function isOldDefaultName(name: string, kind: Person['kind']): boolean {
  const value = name.trim()
  if (kind === 'adult' && OLD_DEFAULTS.me.includes(value)) return true
  return OLD_DEFAULTS[kind].some((label) => new RegExp(`^${label.replace('/', '\\/')} \\d+$`).test(value))
}
