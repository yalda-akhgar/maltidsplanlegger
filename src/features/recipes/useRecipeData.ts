import { useCallback, useEffect, useMemo, useState } from 'react'
import { repository } from '@/data/repository'
import type { Category, HouseholdSettings, Ingredient, Recipe } from '@/data/types'

export interface RecipeData {
  recipes: Recipe[]
  ingredients: Ingredient[]
  /** Ingredients by id, for nutrition and display. */
  ingredientMap: ReadonlyMap<string, Ingredient>
  categories: Category[]
  household: HouseholdSettings
}

async function load() {
  const [recipes, ingredients, categories, household] = await Promise.all([
    repository.listRecipes(),
    repository.listIngredients(),
    repository.listCategories(),
    repository.getHousehold(),
  ])
  return { recipes, ingredients, categories, household }
}

/** Loads everything the recipe screens need from the repository. */
export function useRecipeData() {
  const [state, setState] = useState<Omit<RecipeData, 'ingredientMap'> | null>(null)

  const reload = useCallback(() => load().then(setState), [])

  useEffect(() => {
    let active = true
    void load().then((loaded) => active && setState(loaded))
    return () => {
      active = false
    }
  }, [])

  const data = useMemo<RecipeData | null>(
    () => (state ? { ...state, ingredientMap: new Map(state.ingredients.map((i) => [i.id, i])) } : null),
    [state],
  )

  /** Replace one recipe in memory (e.g. after toggling favourite) without reloading. */
  const updateRecipe = useCallback((recipe: Recipe) => {
    setState((s) => (s ? { ...s, recipes: s.recipes.map((r) => (r.id === recipe.id ? recipe : r)) } : s))
  }, [])

  return { data, reload, updateRecipe }
}
