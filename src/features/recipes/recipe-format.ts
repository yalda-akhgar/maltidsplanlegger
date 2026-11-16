import type { TFunction } from 'i18next'
import { localize } from '@/data/localize'
import type { Category, Language, Recipe } from '@/data/types'

/** Category names of a recipe, in the categories' sort order, e.g. "Middag". */
export function categoryNames(recipe: Recipe, categories: Category[], language: Language): string {
  return categories
    .filter((c) => recipe.categoryIds.includes(c.id))
    .map((c) => localize(c.name, language))
    .join(' / ')
}

/** Text badges shown on cards and in the detail (#81). */
export function recipeBadges(recipe: Recipe, t: TFunction): string[] {
  const badges: string[] = []
  if (recipe.kidFriendly) badges.push(t('recipes.kidFriendly'))
  if (recipe.snackKind) badges.push(t(`recipes.${recipe.snackKind}`))
  return badges
}
