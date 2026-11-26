import type { TFunction } from 'i18next'
import { localize } from '@/data/localize'
import type { RecipeRelevance } from '@/data/relevance'
import type { Category, Language, Recipe } from '@/data/types'

/**
 * Category names of a recipe, in the categories' sort order, e.g. "Middag".
 * Pass only the relevant categories to leave out meals the household doesn't eat (#195).
 */
export function categoryNames(recipe: Recipe, categories: Category[], language: Language): string {
  return categories
    .filter((c) => recipe.categoryIds.includes(c.id))
    .map((c) => localize(c.name, language))
    .join(' / ')
}

/** Text badges shown on cards and in the detail (#81); only those relevant to the household (#195). */
export function recipeBadges(recipe: Recipe, t: TFunction, relevance?: Pick<RecipeRelevance, 'kidFriendly' | 'snackKind'>): string[] {
  const badges: string[] = []
  if (recipe.kidFriendly && (relevance?.kidFriendly ?? true)) badges.push(t('recipes.kidFriendly'))
  if (recipe.snackKind && (relevance?.snackKind ?? true)) badges.push(t(`recipes.${recipe.snackKind}`))
  return badges
}
