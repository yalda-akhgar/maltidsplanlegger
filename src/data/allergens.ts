/**
 * Allergies (#180): which allergens a recipe contains, which people at a meal
 * must avoid them, and which safe alternatives keep the dish possible.
 * Pure functions – no storage access – so they are easy to test.
 *
 * Rules:
 * - An allergen for anyone eating the meal makes the dish unsafe, unless a
 *   safe alternative exists for every ingredient that has it. Alternatives
 *   are used for everyone at the meal (one pot).
 * - Allergies and intolerances follow the same strict rule.
 * - An ingredient whose allergens are not stated makes the dish "unknown"
 *   while anyone at the meal has an allergy: not suggested automatically.
 */
import { ALLERGENS, type Allergen, type HouseholdSettings, type Id, type Ingredient, type MealSlot, type Recipe } from './types'
import { eatsMeal } from './protein'

/** Allergens to avoid at a meal, each with the people who have it. Empty when nobody has allergies. */
export type BlockedAllergens = ReadonlyMap<Allergen, Id[]>

/** The allergens of the people eating a meal (#180). Dinner: everyone, so leftovers are safe too. */
export function blockedAllergens(household: HouseholdSettings, slot: MealSlot, dayIndex: number): BlockedAllergens {
  const blocked = new Map<Allergen, Id[]>()
  for (const person of household.people) {
    if (!eatsMeal(person, slot, dayIndex)) continue
    for (const allergen of person.allergies ?? []) blocked.set(allergen, [...(blocked.get(allergen) ?? []), person.id])
  }
  return blocked
}

/** Whether anyone in the household has an allergy. */
export const hasAllergies = (household: HouseholdSettings) => household.people.some((p) => (p.allergies ?? []).length > 0)

export interface RecipeSafety {
  /** safe: nothing to avoid (maybe with alternatives) · unsafe: contains an allergen · unknown: allergens not stated. */
  status: 'safe' | 'unsafe' | 'unknown'
  /** Alternatives to use, original ingredient id → alternative id. */
  substitutions: Record<Id, Id>
  /** Allergens still in the dish, with the people who must avoid them. */
  conflicts: { allergen: Allergen; personIds: Id[] }[]
  /** Ingredients whose allergens are not stated (only listed when someone has allergies). */
  unknownIngredientIds: Id[]
}

const SAFE: RecipeSafety = { status: 'safe', substitutions: {}, conflicts: [], unknownIngredientIds: [] }

/** Alternatives per original ingredient id, in catalogue order. Cached per ingredient map. */
const alternativesCache = new WeakMap<ReadonlyMap<Id, Ingredient>, Map<Id, Ingredient[]>>()
function alternativesOf(ingredients: ReadonlyMap<Id, Ingredient>, id: Id): Ingredient[] {
  let index = alternativesCache.get(ingredients)
  if (!index) {
    index = new Map()
    for (const ingredient of ingredients.values()) {
      if (!ingredient.alternativeFor) continue
      index.set(ingredient.alternativeFor, [...(index.get(ingredient.alternativeFor) ?? []), ingredient])
    }
    alternativesCache.set(ingredients, index)
  }
  return index.get(id) ?? []
}

/**
 * Whether a recipe is safe for the people at a meal, and which alternatives
 * make it safe (#180).
 */
export function recipeSafety(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>, blocked: BlockedAllergens): RecipeSafety {
  if (blocked.size === 0) return SAFE
  const substitutions: Record<Id, Id> = {}
  const conflicting = new Set<Allergen>()
  const unknown: Id[] = []
  const hits = (allergens: readonly Allergen[]) => allergens.filter((a) => blocked.has(a))

  for (const line of recipe.ingredients) {
    const ingredient = ingredients.get(line.ingredientId)
    if (!ingredient || ingredient.allergens === undefined) {
      unknown.push(line.ingredientId)
      continue
    }
    const found = hits(ingredient.allergens)
    if (found.length === 0) continue
    const alternative = alternativesOf(ingredients, ingredient.id).find((a) => a.allergens !== undefined && hits(a.allergens).length === 0)
    if (alternative) substitutions[ingredient.id] = alternative.id
    else for (const a of found) conflicting.add(a)
  }

  const conflicts = ALLERGENS.filter((a) => conflicting.has(a)).map((allergen) => ({ allergen, personIds: blocked.get(allergen)! }))
  const status = conflicts.length > 0 ? 'unsafe' : unknown.length > 0 ? 'unknown' : 'safe'
  return { status, substitutions, conflicts, unknownIngredientIds: unknown }
}

/** The recipe as cooked: ingredients replaced by their alternatives (#180). */
export function withSubstitutions(recipe: Recipe, substitutions: Record<Id, Id> | undefined): Recipe {
  if (!substitutions || Object.keys(substitutions).length === 0) return recipe
  return {
    ...recipe,
    ingredients: recipe.ingredients.map((line) => (substitutions[line.ingredientId] ? { ...line, ingredientId: substitutions[line.ingredientId] } : line)),
  }
}

/** All allergens in a recipe ("Contains: gluten, milk"), in list order. */
export function recipeAllergens(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>): Allergen[] {
  const found = new Set<Allergen>()
  for (const line of recipe.ingredients) for (const a of ingredients.get(line.ingredientId)?.allergens ?? []) found.add(a)
  return ALLERGENS.filter((a) => found.has(a))
}

/** Ingredients in a recipe whose allergens are not stated. */
export const unlabelledIngredients = (recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>): Id[] =>
  recipe.ingredients.filter((l) => ingredients.get(l.ingredientId)?.allergens === undefined).map((l) => l.ingredientId)

/** A short key for a set of substitutions, for caches. */
export const substitutionKey = (substitutions: Record<Id, Id> | undefined) =>
  substitutions ? Object.entries(substitutions).sort().map(([a, b]) => `${a}>${b}`).join(',') : ''
