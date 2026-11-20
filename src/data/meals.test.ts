import { describe, expect, it } from 'vitest'
import { defaultHousehold } from './defaults'
import { canTurnOff, mealsOn, turnMealOff, turnMealOn } from './meals'
import { adaptToSettings, dayProtein, dinnerPortionsToCook, emptyMeals, generateWeekPlan, setMeal, swapMeal, type PlannerContext } from './planner'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { SEED_RECIPES } from './seed/recipes'
import type { HouseholdSettings, Person, ProteinSplit } from './types'

const WEEK = '2026-W47'
const MONDAY = '2026-11-16'
const ingredients = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))

function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const adult = (id: string, proteinTargetG = 120): Person => ({ id, name: id, kind: 'adult', proteinTargetG, dislikedIngredientIds: [] })
const child = (id: string): Person => ({ id, name: id, kind: 'child', dislikedIngredientIds: [] })
const DEFAULT: ProteinSplit = { breakfast: 25, lunch: 30, dinner: 30, snack: 15 }

function household(split: ProteinSplit, extra: Partial<HouseholdSettings> = {}): HouseholdSettings {
  return { ...defaultHousehold('2026-11-16T00:00:00.000Z'), people: [adult('a'), adult('b', 140), child('c')], proteinSplit: split, ...extra }
}
const ctx = (h: HouseholdSettings, seed = 1): PlannerContext => ({ recipes: SEED_RECIPES, ingredients, household: h, random: seeded(seed) })
const generate = (c: PlannerContext) => generateWeekPlan(c, { weekId: WEEK, today: MONDAY, now: '2026-11-16T08:00:00.000Z' })

describe('turning meals on and off (#183)', () => {
  it('spreads the share of a meal that is off over the others, in proportion', () => {
    expect(turnMealOff(DEFAULT, 'lunch')).toEqual({ breakfast: 36, lunch: 0, dinner: 43, snack: 21 })
    expect(turnMealOff(DEFAULT, 'snack')).toEqual({ breakfast: 30, lunch: 35, dinner: 35, snack: 0 })
    for (const slot of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const off = turnMealOff(DEFAULT, slot)
      expect(Object.values(off).reduce((s, v) => s + v, 0)).toBe(100)
    }
  })

  it('a meal turned back on gets its default share, the others shrink', () => {
    const on = turnMealOn(turnMealOff(DEFAULT, 'lunch'), 'lunch')
    expect(on.lunch).toBe(30)
    expect(Object.values(on).reduce((s, v) => s + v, 0)).toBe(100)
  })

  it('keeps at least one main meal', () => {
    const onlyDinner = turnMealOff(turnMealOff(DEFAULT, 'breakfast'), 'lunch')
    expect(mealsOn(onlyDinner)).toEqual(['dinner', 'snack'])
    expect(canTurnOff(onlyDinner, 'dinner')).toBe(false)
    expect(turnMealOff(onlyDinner, 'dinner')).toBe(onlyDinner)
    expect(canTurnOff(onlyDinner, 'snack')).toBe(true)
  })
})

describe('the plan only has the meals the household eats (#183)', () => {
  it('a meal that is off is never planned, swapped or counted', () => {
    // Two meals + a snack, like external tester 1: breakfast and dinner.
    const h = household(turnMealOff(DEFAULT, 'lunch'))
    for (let seed = 1; seed <= 30; seed++) {
      const c = ctx(h, seed)
      let plan = generate(c)
      for (const day of plan.days) {
        expect(day.meals.lunch.status).toBe('none')
        expect(emptyMeals(h, day)).not.toContain('lunch')
      }
      for (let i = 0; i < 7; i++) plan = swapMeal(c, { plan, date: plan.days[i].date, slot: 'dinner' }).plan
      for (const day of plan.days) expect(day.meals.lunch.status).toBe('none')
    }
  })

  it('dinner is cooked without extra portions for leftovers when lunch is off', () => {
    const on = ctx(household(DEFAULT), 3)
    const off = ctx(household(turnMealOff(DEFAULT, 'lunch')), 3)
    const planOn = generate(on)
    const planOff = generateWeekPlan(off, { weekId: WEEK, today: MONDAY, now: '2026-11-16T08:00:00.000Z' })
    // Same dinner on Monday in both, so only the leftovers differ.
    const dinnerId = planOn.days[0].meals.dinner.recipeId!
    const withDinner = setMeal(off, { plan: planOff, date: MONDAY, slot: 'dinner', recipeId: dinnerId }).plan
    const eaters = Object.values(withDinner.days[0].meals.dinner.portions).reduce((s, p) => s + p, 0)
    expect(dinnerPortionsToCook(off, withDinner, MONDAY)).toBeCloseTo(eaters)
    expect(dinnerPortionsToCook(on, planOn, MONDAY)).toBeGreaterThan(Object.values(planOn.days[0].meals.dinner.portions).reduce((s, p) => s + p, 0))
  })

  it('the day target only counts the meals that are on, so it still adds up', () => {
    const h = household(turnMealOff(DEFAULT, 'lunch'))
    const c = ctx(h, 5)
    const plan = generate(c)
    const a = dayProtein(c, plan.days[1]).find((p) => p.personId === 'a')!
    expect(a.targetG).toBe(120)
  })

  it('with dinner off, lunch gets ordinary lunch dishes', () => {
    const h = household(turnMealOff(DEFAULT, 'dinner'))
    const plan = generate(ctx(h, 2))
    for (const day of plan.days) {
      expect(day.meals.dinner.status).toBe('none')
      expect(day.meals.lunch.status).toBe('planned')
    }
  })

  it('a settings change empties meals that are off and fills meals turned back on', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const before = household(DEFAULT)
      const c = ctx(before, seed)
      const plan = generate(c)
      const after = household(turnMealOff(DEFAULT, 'lunch'))
      const off = adaptToSettings({ ...c, household: after }, before, [plan], MONDAY).plans[0]
      for (const day of off.days) expect(day.meals.lunch.status).toBe('none')

      const back = adaptToSettings({ ...c, household: before }, after, [off], MONDAY).plans[0]
      for (const [i, day] of back.days.entries()) {
        if (i === 0) continue // Monday's lunch would come from last week's Sunday, which is not planned here.
        const dinnerBefore = back.days[i - 1].meals.dinner
        if (dinnerBefore.status === 'planned') expect(day.meals.lunch).toMatchObject({ status: 'leftovers', recipeId: dinnerBefore.recipeId })
        else expect(['planned', 'none']).toContain(day.meals.lunch.status)
      }
    }
  })
})
