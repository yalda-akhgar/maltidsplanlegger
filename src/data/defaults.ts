import type { Category, HouseholdSettings, ProteinSplit } from './types'

/** Default protein split per meal, in percent (#20). */
export const DEFAULT_PROTEIN_SPLIT: ProteinSplit = { breakfast: 25, lunch: 30, dinner: 30, snack: 15 }

/** The four built-in categories (#36). Their ids equal the meal slot. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'breakfast', mealSlot: 'breakfast', builtIn: true, sortOrder: 1, name: { nb: 'Frokost', de: 'Frühstück', en: 'Breakfast' } },
  { id: 'lunch', mealSlot: 'lunch', builtIn: true, sortOrder: 2, name: { nb: 'Lunsj', de: 'Mittagessen', en: 'Lunch' } },
  { id: 'dinner', mealSlot: 'dinner', builtIn: true, sortOrder: 3, name: { nb: 'Middag', de: 'Abendessen', en: 'Dinner' } },
  { id: 'snack', mealSlot: 'snack', builtIn: true, sortOrder: 4, name: { nb: 'Snacks', de: 'Snacks', en: 'Snacks' } },
]

/**
 * Household before onboarding: no people yet, nothing excluded (#188 – no
 * defaults based on the founder's own family; replaces "pork by default", #18).
 */
export function defaultHousehold(now = new Date().toISOString()): HouseholdSettings {
  return {
    people: [],
    excludedTags: [],
    excludedTerms: [],
    proteinSplit: { ...DEFAULT_PROTEIN_SPLIT },
    cheatDays: [],
    noDinnerAtHomeDays: [],
    onboardingDone: false,
    updatedAt: now,
  }
}
