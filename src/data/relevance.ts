/**
 * "Show only what is relevant to this household" (#195). Options, filters and
 * labels that don't apply are hidden and come back by themselves when they
 * apply again; the data behind them is never deleted. Pure functions.
 */
import { mealOn } from './meals'
import type { Category, HouseholdSettings } from './types'

/** Whether the household has children – otherwise "Kid-friendly" is hidden. */
export const hasChildren = (household: HouseholdSettings) => household.people.some((p) => p.kind === 'child')

/** Whether any adult has a protein target – otherwise protein alerts are hidden. */
export const hasProteinTarget = (household: HouseholdSettings) => household.people.some((p) => p.kind === 'adult' && !!p.proteinTargetG)

/** Categories without those for meals the household doesn't eat (#183): "Lunch" is hidden when lunch is off. */
export const relevantCategories = (categories: Category[], household: HouseholdSettings) =>
  categories.filter((c) => !c.mealSlot || mealOn(household.proteinSplit, c.mealSlot))

/** What the recipe screens show for this household. */
export interface RecipeRelevance {
  /** "Kid-friendly" filter, badge and form switch. */
  kidFriendly: boolean
  /** "Healthy / Cheat" snack badge and form choice – only when the household eats a snack. */
  snackKind: boolean
  /** Categories to show as filters, on cards and in the form. */
  categories: Category[]
}

export function recipeRelevance(household: HouseholdSettings, categories: Category[]): RecipeRelevance {
  return {
    kidFriendly: hasChildren(household),
    snackKind: mealOn(household.proteinSplit, 'snack'),
    categories: relevantCategories(categories, household),
  }
}
