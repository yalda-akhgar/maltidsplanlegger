/**
 * Example family (#142): "Try with an example family" on the first screen of
 * the wizard (also in the published app, #176), and "Fill in example family"
 * on the week plan in development mode.
 */
import type { HouseholdSettings, Person } from '@/data/types'

const PEOPLE: Person[] = [
  { id: 'example-anna', name: 'Anna', kind: 'adult', proteinTargetG: 120, dislikedIngredientIds: [] },
  { id: 'example-ola', name: 'Ola', kind: 'adult', proteinTargetG: 140, dislikedIngredientIds: [] },
  { id: 'example-noah', name: 'Noah', kind: 'child', dislikedIngredientIds: ['seed-ingredient-salmon'] },
  { id: 'example-ella', name: 'Ella', kind: 'child', dislikedIngredientIds: [] },
]

/**
 * Two adults, two children (Noah doesn't like salmon), no dinner at home on
 * Fridays. Always starts with nothing under "Food we don't want" – it is a
 * demo, and must not take over what an earlier household saved (#188, #195).
 */
export function withExampleFamily(household: HouseholdSettings): HouseholdSettings {
  return { ...household, people: PEOPLE, excludedTags: [], excludedTerms: [], noDinnerAtHomeDays: [4] }
}
