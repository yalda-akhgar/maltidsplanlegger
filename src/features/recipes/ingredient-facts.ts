import { statesContent } from '@/data/allergens'
import type { Allergen, Id, Ingredient } from '@/data/types'

/** Answer to "Does it contain anything the household doesn't tolerate?" (#182). Nothing chosen = not stated. */
export type ContainsAnswer = { selected: Id[]; none: boolean }

export type IngredientFacts = {
  /** undefined = "allergens not stated", [] = "No allergens" (#180). */
  allergens: Allergen[] | undefined
  contains: ContainsAnswer
}

/** The current answers for an ingredient, for the "Fill in" sheet. */
export function factsOf(ingredient: Ingredient, options: Id[]): IngredientFacts {
  const selected = options.filter((id) => (ingredient.contains ?? []).includes(id))
  return {
    allergens: ingredient.allergens,
    contains: { selected, none: selected.length === 0 && options.length > 0 && options.every((id) => statesContent(ingredient, id)) },
  }
}

/**
 * The fields to store (#182). Answering covers every option shown – also the
 * ones not ticked. Without an answer the old values are kept.
 */
export function withFacts(ingredient: Ingredient, options: Id[], facts: IngredientFacts): Ingredient {
  const next: Ingredient = { ...ingredient }
  if (facts.allergens !== undefined) next.allergens = facts.allergens
  else delete next.allergens
  const answered = facts.contains.none || facts.contains.selected.length > 0
  if (!answered || options.length === 0) return next
  const contains = [...(ingredient.contains ?? []).filter((id) => !options.includes(id)), ...facts.contains.selected]
  if (contains.length > 0) next.contains = contains
  else delete next.contains
  next.containsCheckedFor = [...new Set([...(ingredient.containsCheckedFor ?? []), ...options])]
  return next
}
