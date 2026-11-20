/**
 * Which meals the household eats (#183). A meal is "on" when its share of
 * the protein split is above 0 % – 0 % means the household doesn't eat it:
 * it is not planned, not shopped for and not counted in the protein target.
 * Pure functions – no storage access – so they are easy to test.
 */
import { DEFAULT_PROTEIN_SPLIT } from './defaults'
import { MEAL_SLOTS, type DayPlan, type HouseholdSettings, type MealSlot, type ProteinSplit } from './types'

/** At least one of these must stay on: a snack alone is not a plan. */
export const MAIN_MEALS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner']

/** Whether the household eats this meal (#183). */
export const mealOn = (split: ProteinSplit, slot: MealSlot) => split[slot] > 0

/** The meals the household eats, in day order. */
export const mealsOn = (split: ProteinSplit): MealSlot[] => MEAL_SLOTS.filter((slot) => mealOn(split, slot))

/** Whether a meal can be turned off: at least one main meal must stay on. */
export const canTurnOff = (split: ProteinSplit, slot: MealSlot) =>
  !mealOn(split, slot) || MAIN_MEALS.some((s) => s !== slot && mealOn(split, s))

/**
 * Scales `slots` so they add up to `total`, keeping their ratio, in whole
 * percent (largest remainder, so the sum is exact).
 */
function scaled(split: ProteinSplit, slots: MealSlot[], total: number): ProteinSplit {
  const sum = slots.reduce((s, slot) => s + split[slot], 0)
  const result = { ...split }
  if (sum <= 0 || slots.length === 0) return result
  const raw = slots.map((slot) => ({ slot, value: (split[slot] * total) / sum }))
  for (const r of raw) result[r.slot] = Math.floor(r.value)
  let left = total - raw.reduce((s, r) => s + Math.floor(r.value), 0)
  for (const r of [...raw].sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)))) {
    if (left <= 0) break
    result[r.slot]++
    left--
  }
  return result
}

/** Turns a meal off: its share goes to the other meals, in proportion (#183). 25/30/30/15 without lunch → 36/0/43/21. */
export function turnMealOff(split: ProteinSplit, slot: MealSlot): ProteinSplit {
  if (!mealOn(split, slot) || !canTurnOff(split, slot)) return split
  const others = mealsOn(split).filter((s) => s !== slot)
  return scaled({ ...split, [slot]: 0 }, others, 100)
}

/** Turns a meal back on with its default share; the others shrink in proportion (#183). */
export function turnMealOn(split: ProteinSplit, slot: MealSlot): ProteinSplit {
  if (mealOn(split, slot)) return split
  const share = DEFAULT_PROTEIN_SPLIT[slot]
  const others = mealsOn(split)
  return { ...scaled(split, others, 100 - share), [slot]: share }
}

/** The day as the household eats it: meals that are off count as empty (older plans may still have them). */
export function onlyMealsOn(day: DayPlan, household: HouseholdSettings): DayPlan {
  if (mealsOn(household.proteinSplit).length === MEAL_SLOTS.length) return day
  const meals = { ...day.meals }
  for (const slot of MEAL_SLOTS) if (!mealOn(household.proteinSplit, slot)) meals[slot] = { status: 'none', portions: {}, guests: 0 }
  return { ...day, meals }
}
