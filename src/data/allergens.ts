/**
 * Allergies (#180) and food people don't tolerate (#181): what a recipe
 * contains, which people at a meal must avoid it, and which safe alternatives
 * or left-out ingredients keep the dish possible.
 * Pure functions – no storage access – so they are easy to test.
 *
 * Rules:
 * - An allergen for anyone eating the meal makes the dish unsafe, unless a
 *   safe alternative exists for every ingredient that has it. Alternatives
 *   are used for everyone at the meal (one pot).
 * - Allergies and intolerances follow the same strict rule.
 * - An ingredient whose allergens are not stated makes the dish "unknown"
 *   while anyone at the meal has an allergy: not suggested automatically.
 * - "Doesn't tolerate" (#181) is just as strict, but matches ingredients –
 *   including what spice blends and sauces contain. A recipe line marked
 *   "can be left out" is left out of that person's portion only; otherwise a
 *   milder alternative is used for everyone. "Can be left out" never applies
 *   to allergens.
 */
import { ALLERGENS, type Allergen, type HouseholdSettings, type Id, type Ingredient, type MealSlot, type Recipe } from './types'
import { eatsMeal } from './protein'

/** What to avoid at a meal, each with the people who must avoid it. */
export interface Blocked {
  allergens: ReadonlyMap<Allergen, Id[]>
  /** Ingredients someone doesn't tolerate (#181). */
  ingredients: ReadonlyMap<Id, Id[]>
}

const add = <K>(map: Map<K, Id[]>, key: K, personId: Id) => map.set(key, [...(map.get(key) ?? []), personId])

/** What the people eating a meal must avoid (#180, #181). Dinner: everyone, so leftovers are safe too. */
export function blockedAt(household: HouseholdSettings, slot: MealSlot, dayIndex: number): Blocked {
  const allergens = new Map<Allergen, Id[]>()
  const ingredients = new Map<Id, Id[]>()
  for (const person of household.people) {
    if (!eatsMeal(person, slot, dayIndex)) continue
    for (const allergen of person.allergies ?? []) add(allergens, allergen, person.id)
    for (const id of person.notToleratedIngredientIds ?? []) add(ingredients, id, person.id)
  }
  return { allergens, ingredients }
}

/** Whether anything must be avoided at the meal. */
export const blocksAnything = (blocked: Blocked) => blocked.allergens.size > 0 || blocked.ingredients.size > 0

/** Whether anyone in the household has an allergy. */
export const hasAllergies = (household: HouseholdSettings) => household.people.some((p) => (p.allergies ?? []).length > 0)

/** An ingredient and the people it concerns. */
export type IngredientPeople = { ingredientId: Id; personIds: Id[] }

export interface RecipeSafety {
  /** safe: nothing to avoid (maybe with alternatives) · unsafe: contains something to avoid · unknown: allergens not stated. */
  status: 'safe' | 'unsafe' | 'unknown'
  /** Alternatives to use, original ingredient id → alternative id. */
  substitutions: Record<Id, Id>
  /** Allergens still in the dish, with the people who must avoid them. */
  conflicts: { allergen: Allergen; personIds: Id[] }[]
  /** Ingredients someone doesn't tolerate that are still in the dish – the chosen ingredient, e.g. chili, not the blend (#181). */
  intolerances: IngredientPeople[]
  /** Recipe lines left out of some people's portions (#181): "Without black pepper for Yalda". */
  omissions: IngredientPeople[]
  /** Ingredients whose allergens are not stated (only listed when someone has allergies). */
  unknownIngredientIds: Id[]
}

const SAFE: RecipeSafety = { status: 'safe', substitutions: {}, conflicts: [], intolerances: [], omissions: [], unknownIngredientIds: [] }

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

/** The ingredient itself plus what it contains (#181). */
export const ingredientParts = (ingredient: Ingredient): Id[] => [ingredient.id, ...(ingredient.contains ?? [])]

/**
 * Whether a recipe is safe for the people at a meal, and which alternatives
 * or left-out lines make it safe (#180, #181).
 */
export function recipeSafety(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>, blocked: Blocked): RecipeSafety {
  if (!blocksAnything(blocked)) return SAFE
  const substitutions: Record<Id, Id> = {}
  const conflicting = new Set<Allergen>()
  const intolerances = new Map<Id, Id[]>()
  const omissions: IngredientPeople[] = []
  const unknown: Id[] = []
  const allergenHits = (i: Ingredient) => (i.allergens ?? []).filter((a) => blocked.allergens.has(a))
  const intoleranceHits = (i: Ingredient) => ingredientParts(i).filter((id) => blocked.ingredients.has(id))
  const people = (ids: Id[]) => [...new Set(ids.flatMap((id) => blocked.ingredients.get(id) ?? []))]

  for (const line of recipe.ingredients) {
    const ingredient = ingredients.get(line.ingredientId)
    if (blocked.allergens.size > 0 && ingredient?.allergens === undefined) unknown.push(line.ingredientId)
    if (!ingredient) continue
    const allergens = allergenHits(ingredient)
    const notTolerated = intoleranceHits(ingredient)
    if (allergens.length === 0 && notTolerated.length === 0) continue
    // Left out of these people's portions only – never for allergens.
    if (allergens.length === 0 && line.omittable) {
      omissions.push({ ingredientId: ingredient.id, personIds: people(notTolerated) })
      continue
    }
    const alternative = alternativesOf(ingredients, ingredient.id).find(
      (a) => (blocked.allergens.size === 0 || a.allergens !== undefined) && allergenHits(a).length === 0 && intoleranceHits(a).length === 0,
    )
    if (alternative) {
      substitutions[ingredient.id] = alternative.id
      continue
    }
    for (const a of allergens) conflicting.add(a)
    for (const id of notTolerated) intolerances.set(id, people([id]))
  }

  const conflicts = ALLERGENS.filter((a) => conflicting.has(a)).map((allergen) => ({ allergen, personIds: blocked.allergens.get(allergen)! }))
  const status = conflicts.length > 0 || intolerances.size > 0 ? 'unsafe' : unknown.length > 0 ? 'unknown' : 'safe'
  return {
    status,
    substitutions,
    conflicts,
    intolerances: [...intolerances].map(([ingredientId, personIds]) => ({ ingredientId, personIds })),
    omissions,
    unknownIngredientIds: unknown,
  }
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
