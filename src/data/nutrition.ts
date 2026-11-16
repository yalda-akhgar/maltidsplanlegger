import type { Ingredient, Nutrition, Recipe, RecipeIngredient, Unit } from './types'

/** Default weight in grams of one unit, used when the ingredient doesn't say (#64). */
const DEFAULT_GRAMS: Partial<Record<Unit, number>> = {
  g: 1,
  kg: 1000,
  ml: 1,
  dl: 100,
  l: 1000,
  tbsp: 15,
  tsp: 5,
  pinch: 0.5,
}

/** Grams of one recipe line, or undefined if the weight of the unit is unknown. */
export function gramsOf(line: Pick<RecipeIngredient, 'amount' | 'unit'>, ingredient: Ingredient | undefined): number | undefined {
  if (line.unit === 'g') return line.amount
  if (line.unit === 'kg') return line.amount * 1000
  const perUnit = ingredient?.gramsPerUnit[line.unit] ?? DEFAULT_GRAMS[line.unit]
  return perUnit === undefined ? undefined : line.amount * perUnit
}

export interface RecipeNutrition extends Nutrition {
  /** True if some ingredient lacks nutrition data or a unit weight (#63). */
  incomplete: boolean
}

const ZERO: Nutrition = { proteinG: 0, kcal: 0, fiberG: 0, fruitVegPortions: 0 }

/** Nutrition of ONE standard adult portion, calculated from the ingredients (#29). */
export function recipeNutrition(recipe: Recipe, ingredients: ReadonlyMap<string, Ingredient>): RecipeNutrition {
  const total = { ...ZERO }
  let incomplete = false
  for (const line of recipe.ingredients) {
    const ingredient = ingredients.get(line.ingredientId)
    const grams = gramsOf(line, ingredient)
    const per100 = ingredient?.nutritionPer100g
    if (grams === undefined || !per100) {
      incomplete = true
      continue
    }
    const factor = grams / 100
    total.proteinG += per100.proteinG * factor
    total.kcal += per100.kcal * factor
    total.fiberG += per100.fiberG * factor
    total.fruitVegPortions += per100.fruitVegPortions * factor
  }
  const servings = recipe.servings > 0 ? recipe.servings : 1
  return {
    proteinG: total.proteinG / servings,
    kcal: total.kcal / servings,
    fiberG: total.fiberG / servings,
    fruitVegPortions: total.fruitVegPortions / servings,
    incomplete,
  }
}

/** The recipe's own tags plus those inherited from its ingredients (#68). */
export function recipeTags(recipe: Recipe, ingredients: ReadonlyMap<string, Ingredient>): string[] {
  const tags = new Set(recipe.tags)
  for (const line of recipe.ingredients) {
    for (const tag of ingredients.get(line.ingredientId)?.tags ?? []) tags.add(tag)
  }
  return [...tags]
}
