/**
 * Undo for the week plan (#146–#152): a change is stored as the meals it
 * changed, each with its value before and after. Undoing only restores meals
 * that still look as they did right after the change, so later changes to
 * other meals are never lost. Pure functions – no storage access.
 */
import type { IsoDate, MealSlot, PlannedMeal, WeekId, WeekPlan } from './types'

export interface MealChange {
  weekId: WeekId
  date: IsoDate
  slot: MealSlot
  before: PlannedMeal
  after: PlannedMeal
}

/** Key of one meal across weeks (dates are unique). */
export const mealKey = (date: IsoDate, slot: MealSlot) => `${date}|${slot}`

const same = (a: PlannedMeal | undefined, b: PlannedMeal | undefined) => JSON.stringify(a) === JSON.stringify(b)

function findMeal(plans: ReadonlyArray<WeekPlan | undefined>, change: Pick<MealChange, 'weekId' | 'date' | 'slot'>): PlannedMeal | undefined {
  const plan = plans.find((p) => p?.weekId === change.weekId)
  return plan?.days.find((d) => d.date === change.date)?.meals[change.slot]
}

/** All meals that differ between two versions of the same weeks. */
export function diffMeals(before: ReadonlyArray<WeekPlan | undefined>, after: ReadonlyArray<WeekPlan | undefined>): MealChange[] {
  const changes: MealChange[] = []
  for (const plan of after) {
    if (!plan) continue
    const old = before.find((p) => p?.weekId === plan.weekId)
    if (!old) continue
    plan.days.forEach((day, i) => {
      const oldDay = old.days[i]
      if (!oldDay) return
      for (const slot of Object.keys(day.meals) as MealSlot[]) {
        if (!same(oldDay.meals[slot], day.meals[slot])) {
          changes.push({ weekId: plan.weekId, date: day.date, slot, before: oldDay.meals[slot], after: day.meals[slot] })
        }
      }
    })
  }
  return changes
}

/** Whether a meal still looks as it did right after the change. */
export function isCurrent(change: MealChange, plans: ReadonlyArray<WeekPlan | undefined>): boolean {
  return same(findMeal(plans, change), change.after)
}

/**
 * Restores the meals of a change that are still current. Returns the plans
 * (unchanged objects where nothing was restored).
 */
export function revertChanges<T extends WeekPlan | undefined>(plans: T[], changes: ReadonlyArray<MealChange>, now = new Date().toISOString()): T[] {
  const current = changes.filter((c) => isCurrent(c, plans))
  return plans.map((plan) => {
    if (!plan) return plan
    const mine = current.filter((c) => c.weekId === plan.weekId)
    if (mine.length === 0) return plan
    const days = plan.days.map((day) => {
      const here = mine.filter((c) => c.date === day.date)
      if (here.length === 0) return day
      const meals = { ...day.meals }
      for (const c of here) meals[c.slot] = c.before
      return { ...day, meals }
    })
    return { ...plan, days, updatedAt: now }
  })
}
