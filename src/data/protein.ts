/**
 * Portion sizes and protein per person (#12, #19, #20, #27, #31, #101–#103).
 * Pure functions – no storage access – so they are easy to test.
 */
import { gramsOf } from './nutrition'
import type { DayPlan, HouseholdSettings, Id, Ingredient, MealExtra, MealSlot, Nutrition, Person, Unit } from './types'

export const PORTION_MIN = 0.75
export const PORTION_MAX = 2
export const CHILD_PORTION = 0.5
export const GUEST_PORTION = 1
/** A boost is suggested from this gap (in grams) upwards (#103). */
export const BOOST_THRESHOLD_G = 5

/** Index in the week: 0 = Monday … 6 = Sunday. Saturday and Sunday are weekend days. */
export const SATURDAY = 5

/**
 * Portion size for one adult and one meal: the share of the daily target this
 * meal should cover, divided by the protein in one standard portion.
 * Clamped to 0.75×–2× (#27) and rounded to ¼ portion (#101).
 */
export function personalPortion(targetG: number | undefined, sharePct: number, proteinPerPortionG: number): number {
  if (!targetG || proteinPerPortionG <= 0) return 1
  const raw = (targetG * sharePct) / 100 / proteinPerPortionG
  const clamped = Math.min(PORTION_MAX, Math.max(PORTION_MIN, raw))
  return Math.round(clamped * 4) / 4
}

/**
 * Whether a person eats a meal at home that day. Children eat weekday lunch
 * elsewhere unless their setting says otherwise; weekends always at home (#102).
 */
export function eatsMeal(person: Person, slot: MealSlot, dayIndex: number): boolean {
  if (person.kind === 'adult' || slot !== 'lunch') return true
  return dayIndex >= SATURDAY || person.eatsWeekdayLunchAtHome === true
}

/** Current daily protein targets of all adults that have one (#19). */
export function currentTargets(household: HouseholdSettings): Record<Id, number> {
  const targets: Record<Id, number> = {}
  for (const person of household.people) {
    if (person.kind === 'adult' && person.proteinTargetG) targets[person.id] = person.proteinTargetG
  }
  return targets
}

/** Portion per person for one meal. Children get a fixed half portion (#12). */
export function mealPortions(
  household: HouseholdSettings,
  slot: MealSlot,
  dayIndex: number,
  proteinPerPortionG: number,
  targets: Record<Id, number>,
): Record<Id, number> {
  const portions: Record<Id, number> = {}
  for (const person of household.people) {
    if (!eatsMeal(person, slot, dayIndex)) continue
    portions[person.id] =
      person.kind === 'child'
        ? CHILD_PORTION
        : personalPortion(targets[person.id], household.proteinSplit[slot], proteinPerPortionG)
  }
  return portions
}

/** Total standard portions eaten at a meal, including guests (#31). */
export function totalPortions(portions: Record<Id, number>, guests: number): number {
  return Object.values(portions).reduce((sum, p) => sum + p, 0) + guests * GUEST_PORTION
}

export interface DayNutrition extends Nutrition {
  incomplete: boolean
}

/**
 * What one person eats in a day ("Today's nutrition", #23), given the
 * nutrition of one standard portion of each recipe.
 */
export function personDayNutrition(
  day: DayPlan,
  personId: Id,
  nutritionOf: (recipeId: Id) => (Nutrition & { incomplete: boolean }) | undefined,
  ingredients?: ReadonlyMap<Id, Ingredient>,
): DayNutrition {
  const total: DayNutrition = { proteinG: 0, kcal: 0, fiberG: 0, fruitVegPortions: 0, incomplete: false }
  for (const meal of Object.values(day.meals)) {
    for (const extra of meal.extras ?? []) {
      if (extra.personId !== personId || !ingredients) continue
      const n = extraNutrition(extra, ingredients)
      total.proteinG += n.proteinG
      total.kcal += n.kcal
      total.fiberG += n.fiberG
      total.fruitVegPortions += n.fruitVegPortions
    }
    const portion = meal.portions[personId]
    if (!portion || !meal.recipeId || (meal.status !== 'planned' && meal.status !== 'leftovers')) continue
    const n = nutritionOf(meal.recipeId)
    if (!n) {
      total.incomplete = true
      continue
    }
    total.proteinG += n.proteinG * portion
    total.kcal += n.kcal * portion
    total.fiberG += n.fiberG * portion
    total.fruitVegPortions += n.fruitVegPortions * portion
    total.incomplete ||= n.incomplete
  }
  return total
}

/** Nutrition of an extra item (#120). Unknown nutrition counts as 0. */
export function extraNutrition(extra: MealExtra, ingredients: ReadonlyMap<Id, Ingredient>): Nutrition {
  const ingredient = ingredients.get(extra.ingredientId)
  const grams = gramsOf(extra, ingredient)
  const per100 = ingredient?.nutritionPer100g
  if (!per100 || grams === undefined) return { proteinG: 0, kcal: 0, fiberG: 0, fruitVegPortions: 0 }
  const f = grams / 100
  return { proteinG: per100.proteinG * f, kcal: per100.kcal * f, fiberG: per100.fiberG * f, fruitVegPortions: per100.fruitVegPortions * f }
}

/**
 * The part of a person's daily target that the planned meals should cover.
 * Meals outside the app ("eating out", dinner on a fixed day out) are left
 * out: the app only counts what is planned in it (#109). Empty meals still
 * count, so progress grows while planning by hand (#112).
 */
export function plannedTargetG(
  day: DayPlan,
  personId: Id,
  split: HouseholdSettings['proteinSplit'],
  fixedDayOut: boolean,
): number {
  const target = day.targetsG[personId] ?? 0
  const share = (Object.keys(day.meals) as MealSlot[])
    .filter((slot) => {
      const status = day.meals[slot].status
      if (status === 'eatingOut') return false
      return !(slot === 'dinner' && status === 'none' && fixedDayOut)
    })
    .reduce((sum, slot) => sum + split[slot], 0)
  return (target * share) / 100
}

// ---------------------------------------------------------------------------
// Protein boost (#103)
// ---------------------------------------------------------------------------

export type BoostKey = 'egg' | 'milk' | 'cottageCheese' | 'skyr'

/** Fixed list of boost items, ordered from small to large. */
export const BOOST_ITEMS: ReadonlyArray<{ key: BoostKey; ingredientId: Id; amount: number; unit: Unit }> = [
  { key: 'egg', ingredientId: 'seed-ingredient-egg', amount: 1, unit: 'pcs' },
  { key: 'milk', ingredientId: 'seed-ingredient-milk', amount: 2, unit: 'dl' },
  { key: 'cottageCheese', ingredientId: 'seed-ingredient-cottage-cheese', amount: 100, unit: 'g' },
  { key: 'skyr', ingredientId: 'seed-ingredient-skyr', amount: 170, unit: 'g' },
]

export interface BoostSuggestion {
  key: BoostKey
  ingredientId: Id
  amount: number
  unit: Unit
  proteinG: number
}

/** A protein boost: one or two different items and the protein they add together. */
export interface BoostPlan {
  items: BoostSuggestion[]
  proteinG: number
}

/**
 * Suggests a boost when the gap is at least 5 g: the combination of up to two
 * different items that covers the gap with the least extra, or the largest
 * combination if none covers it (#103, #153). Excluded or deleted ingredients
 * are skipped.
 */
export function proteinBoost(
  gapG: number,
  ingredients: ReadonlyMap<Id, Ingredient>,
  isExcluded: (ingredient: Ingredient) => boolean,
): BoostPlan | undefined {
  if (gapG < BOOST_THRESHOLD_G) return undefined
  const options: BoostSuggestion[] = []
  for (const item of BOOST_ITEMS) {
    const ingredient = ingredients.get(item.ingredientId)
    const grams = gramsOf(item, ingredient)
    if (!ingredient?.nutritionPer100g || grams === undefined || isExcluded(ingredient)) continue
    options.push({ ...item, proteinG: (ingredient.nutritionPer100g.proteinG * grams) / 100 })
  }
  const plans: BoostPlan[] = options.map((o) => ({ items: [o], proteinG: o.proteinG }))
  options.forEach((a, i) => options.slice(i + 1).forEach((b) => plans.push({ items: [a, b], proteinG: a.proteinG + b.proteinG })))
  if (plans.length === 0) return undefined
  // Least protein first; with equal protein, fewer items first.
  plans.sort((a, b) => a.proteinG - b.proteinG || a.items.length - b.items.length)
  return plans.find((p) => p.proteinG >= gapG) ?? plans[plans.length - 1]
}
