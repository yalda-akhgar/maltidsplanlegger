import { isCurrent, mealKey, type MealChange } from '@/data/undo'
import type { ListUndo } from '@/data/swap-list'
import type { IsoDate, MealSlot, WeekId, WeekPlan } from '@/data/types'

/** What an undo button undoes: a swapped dish, another change to a meal, or a whole-week action. */
export type MealUndoKind = 'swap' | 'change'
export type WeekAction = 'make' | 'fill' | 'favorites' | 'replace' | 'settings' | 'auto'

export interface MealStep {
  kind: MealUndoKind
  /** The dish before a swap, for the screen-reader label (#147). */
  previousRecipeId?: string
  changes: MealChange[]
  /** The shopping list before the swap sheet updated it (#197): ↶ puts it back too. */
  listUndo?: ListUndo
}

export interface WeekStep {
  action: WeekAction
  changes: MealChange[]
  listUndo?: ListUndo
}

/**
 * Undo history while the app is open (#149): one stack per meal and one per
 * week. Kept in memory outside React, so it survives switching tabs or weeks,
 * and is gone when the app is closed.
 */
const mealSteps = new Map<string, MealStep[]>()
const weekSteps = new Map<WeekId, WeekStep[]>()

type Plans = ReadonlyArray<WeekPlan | undefined>

/** The step a meal's undo button would undo, if the meal still looks as it did after it (#151). */
export function mealUndo(date: IsoDate, slot: MealSlot, plans: Plans): MealStep | undefined {
  const step = mealSteps.get(mealKey(date, slot))?.at(-1)
  const own = step?.changes.find((c) => c.date === date && c.slot === slot)
  return step && own && isCurrent(own, plans) ? step : undefined
}

export function pushMealStep(date: IsoDate, slot: MealSlot, step: MealStep, plansBefore: Plans) {
  const key = mealKey(date, slot)
  // A stack whose last step is no longer current was overtaken by other changes: start over.
  const stack = mealUndo(date, slot, plansBefore) ? (mealSteps.get(key) ?? []) : []
  mealSteps.set(key, [...stack, step])
}

export function popMealStep(date: IsoDate, slot: MealSlot): MealStep | undefined {
  const stack = mealSteps.get(mealKey(date, slot))
  return stack?.pop()
}

/** The week action the top undo button would undo, if any of its meals is still unchanged since. */
export function weekUndo(weekId: WeekId, plans: Plans): WeekStep | undefined {
  const stack = weekSteps.get(weekId) ?? []
  // Drop steps whose meals have all been changed since: there is nothing left to undo.
  while (stack.length > 0 && !stack[stack.length - 1].changes.some((c) => isCurrent(c, plans))) stack.pop()
  return stack.at(-1)
}

export function pushWeekStep(weekId: WeekId, step: WeekStep) {
  weekSteps.set(weekId, [...(weekSteps.get(weekId) ?? []), step])
}

export function popWeekStep(weekId: WeekId): WeekStep | undefined {
  return weekSteps.get(weekId)?.pop()
}

/** The swap sheet updated the list after the last change to this meal (#197). */
export function attachMealListUndo(date: IsoDate, slot: MealSlot, listUndo: ListUndo) {
  const step = mealSteps.get(mealKey(date, slot))?.at(-1)
  if (step) step.listUndo = listUndo
}

/** The swap sheet updated the list after the last whole-week action (#197). */
export function attachWeekListUndo(weekId: WeekId, listUndo: ListUndo) {
  const step = weekSteps.get(weekId)?.at(-1)
  if (step) step.listUndo = listUndo
}
