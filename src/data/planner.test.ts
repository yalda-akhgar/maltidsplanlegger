import { describe, expect, it } from 'vitest'
import { defaultHousehold } from './defaults'
import { recipeNutrition } from './nutrition'
import {
  dinnerPortionsToCook,
  generateWeekPlan,
  isRecipeAllowed,
  mainProteinSource,
  planNotes,
  refreshPortions,
  swapMeal,
  type PlannerContext,
} from './planner'
import { eatsMeal, personalPortion, personDayNutrition, plannedTargetG, proteinBoost } from './protein'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { SEED_RECIPES } from './seed/recipes'
import type { HouseholdSettings, Person, Recipe, WeekPlan } from './types'

const WEEK = '2026-W47' // Monday 2026-11-16 … Sunday 2026-11-22
const MONDAY = '2026-11-16'
const ingredients = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
const byId = new Map(SEED_RECIPES.map((r) => [r.id, r]))
const r = (key: string) => `seed-recipe-${key}`

/** Small, repeatable random generator (mulberry32). */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const adult = (id: string, target: number): Person => ({ id, name: id, kind: 'adult', proteinTargetG: target, dislikedIngredientIds: [] })
const child = (id: string, extra: Partial<Person> = {}): Person => ({ id, name: id, kind: 'child', dislikedIngredientIds: [], ...extra })

/** The product owner's household: two adults, two children, no dinner at home on Fridays (#107). */
function household(extra: Partial<HouseholdSettings> = {}): HouseholdSettings {
  return {
    ...defaultHousehold('2026-11-16T00:00:00.000Z'),
    people: [adult('a1', 120), adult('a2', 140), child('c1'), child('c2')],
    noDinnerAtHomeDays: [4],
    ...extra,
  }
}

function ctx(seed: number, extra: Partial<PlannerContext> = {}): PlannerContext {
  return { recipes: SEED_RECIPES, ingredients, household: household(), random: seeded(seed), ...extra }
}

const generate = (c: PlannerContext, opts: Partial<Parameters<typeof generateWeekPlan>[1]> = {}) =>
  generateWeekPlan(c, { weekId: WEEK, today: MONDAY, now: '2026-11-16T08:00:00.000Z', ...opts })

/** Runs a check on many generated weeks. */
function forManyWeeks(check: (plan: WeekPlan, c: PlannerContext) => void, makeCtx = (seed: number) => ctx(seed)) {
  for (let seed = 1; seed <= 200; seed++) {
    const c = makeCtx(seed)
    check(generate(c), c)
  }
}

const dinnerIds = (plan: WeekPlan) => plan.days.map((d) => d.meals.dinner.recipeId)

describe('week structure', () => {
  it('has a dinner every day by default – no fixed days out (#107)', () => {
    expect(defaultHousehold().noDinnerAtHomeDays).toEqual([])
    forManyWeeks(
      (plan) => {
        plan.days.forEach((day) => expect(day.meals.dinner.status).toBe('planned'))
        // Every lunch except Monday (no previous week) is leftovers – Saturday too (#108).
        plan.days.slice(1).forEach((day) => expect(day.meals.lunch.status).toBe('leftovers'))
      },
      (seed) => ctx(seed, { household: household({ noDinnerAtHomeDays: [] }) }),
    )
  })

  it('gives a quick lunch the day after any dinner not cooked at home (#108)', () => {
    const plan = generate(ctx(16, { household: household({ noDinnerAtHomeDays: [1, 4] }) }))
    expect(plan.days[1].meals.dinner.status).toBe('none') // Tuesday
    expect(plan.days[2].meals.lunch.status).toBe('planned') // Wednesday: quick lunch
    expect(byId.get(plan.days[2].meals.lunch.recipeId!)?.categoryIds).toContain('lunch')
    expect(plan.days[3].meals.lunch.status).toBe('leftovers') // Thursday
  })

  it('has no dinner on fixed days out (Friday here) and a dinner on every other day', () => {
    forManyWeeks((plan) => {
      plan.days.forEach((day, i) => expect(day.meals.dinner.status).toBe(i === 4 ? 'none' : 'planned'))
    })
  })

  it('serves leftovers from the previous dinner for lunch, a quick lunch on Saturday', () => {
    forManyWeeks((plan) => {
      plan.days.forEach((day, i) => {
        const lunch = day.meals.lunch
        if (i === 0 || i === 5) {
          // No previous week (Monday) / Saturday: quick lunch from the lunch category.
          expect(lunch.status).toBe('planned')
          expect(byId.get(lunch.recipeId!)?.categoryIds).toContain('lunch')
        } else {
          expect(lunch.status).toBe('leftovers')
          expect(lunch.recipeId).toBe(plan.days[i - 1].meals.dinner.recipeId)
          expect(lunch.leftoversFrom).toBe(plan.days[i - 1].date)
        }
      })
    })
  })

  it("uses the previous week's Sunday dinner for Monday's lunch", () => {
    const previousWeek = generate(ctx(1), { weekId: '2026-W46', today: '2026-11-09' })
    const plan = generate(ctx(2), { previousWeek })
    expect(plan.days[0].meals.lunch).toMatchObject({
      status: 'leftovers',
      recipeId: previousWeek.days[6].meals.dinner.recipeId,
      leftoversFrom: '2026-11-15',
    })
  })

  it('has an evening snack every day', () => {
    forManyWeeks((plan) => plan.days.forEach((day) => expect(day.meals.snack.status).toBe('planned')))
  })
})

describe('dish rules', () => {
  it('never suggests excluded food (pork by default, tags and free text)', () => {
    const pork: Recipe = { ...byId.get(r('beef-tacos'))!, id: 'pork-dish', favorite: true, tags: ['pork'] }
    forManyWeeks(
      (plan) => expect(dinnerIds(plan)).not.toContain('pork-dish'),
      (seed) => ctx(seed, { recipes: [...SEED_RECIPES, pork] }),
    )

    const noFishOrChicken = household({ excludedTags: ['pork', 'fish'], excludedTerms: ['kylling'] })
    forManyWeeks(
      (plan, c) => {
        for (const day of plan.days) {
          for (const meal of Object.values(day.meals)) {
            if (meal.recipeId) expect(isRecipeAllowed(byId.get(meal.recipeId)!, ingredients, c.household)).toBe(true)
          }
        }
      },
      (seed) => ctx(seed, { household: noFishOrChicken }),
    )
    expect(isRecipeAllowed(byId.get(r('salmon-sweet-potato-broccoli'))!, ingredients, noFishOrChicken)).toBe(false)
    expect(isRecipeAllowed(byId.get(r('chicken-tikka-rice'))!, ingredients, noFishOrChicken)).toBe(false)
  })

  it('only picks dinners of 30 minutes or less', () => {
    const slow: Recipe = { ...byId.get(r('beef-tacos'))!, id: 'slow-dish', favorite: true, timeMinutes: 45 }
    forManyWeeks(
      (plan) => expect(dinnerIds(plan)).not.toContain('slow-dish'),
      (seed) => ctx(seed, { recipes: [...SEED_RECIPES, slow] }),
    )
  })

  it('never repeats a dinner within a week', () => {
    forManyWeeks((plan) => {
      const ids = dinnerIds(plan).filter(Boolean)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  it('never has the same protein source on two days in a row (chicken = turkey)', () => {
    expect(mainProteinSource(byId.get(r('turkey-burger-salad'))!, ingredients)).toBe('poultry')
    expect(mainProteinSource(byId.get(r('chicken-tikka-rice'))!, ingredients)).toBe('poultry')
    forManyWeeks((plan, c) => {
      for (let i = 1; i < 7; i++) {
        const a = plan.days[i - 1].meals.dinner.recipeId
        const b = plan.days[i].meals.dinner.recipeId
        if (a && b) expect(mainProteinSource(byId.get(a)!, ingredients)).not.toBe(mainProteinSource(byId.get(b)!, ingredients))
      }
      expect(planNotes(c, plan)).toEqual([])
    })
  })

  it('never serves the same breakfast, quick lunch or snack two days in a row', () => {
    forManyWeeks((plan) => {
      for (let i = 1; i < 7; i++) {
        for (const slot of ['breakfast', 'snack'] as const) {
          expect(plan.days[i].meals[slot].recipeId).not.toBe(plan.days[i - 1].meals[slot].recipeId)
        }
      }
    })
  })

  it('picks favourites about twice as often', () => {
    const recipes = SEED_RECIPES.map((rec) => (rec.id === r('omelette-spinach-feta') ? { ...rec, favorite: true } : rec))
    let favourite = 0
    let other = 0
    for (let seed = 1; seed <= 3000; seed++) {
      const first = generate(ctx(seed, { recipes })).days[0].meals.breakfast.recipeId
      if (first === r('omelette-spinach-feta')) favourite++
      else if (first === r('greek-yoghurt-berries-nuts')) other++
    }
    expect(favourite / other).toBeGreaterThan(1.6)
    expect(favourite / other).toBeLessThan(2.4)
  })

  it('uses healthy snacks on normal days and cheat snacks on cheat days', () => {
    forManyWeeks(
      (plan) => {
        plan.days.forEach((day, i) => {
          const kind = byId.get(day.meals.snack.recipeId!)?.snackKind
          expect(kind).toBe(i === 5 ? 'cheat' : 'healthy')
        })
      },
      (seed) => ctx(seed, { household: household({ cheatDays: [5] }) }),
    )
  })

  it('relaxes rules instead of leaving gaps when there are too few dinners', () => {
    const few = SEED_RECIPES.filter((rec) => !rec.categoryIds.includes('dinner') || rec.id === r('chicken-tikka-rice') || rec.id === r('salmon-sweet-potato-broccoli'))
    const c = ctx(3, { recipes: few })
    const plan = generate(c)
    expect(plan.days.filter((d) => d.meals.dinner.status === 'planned')).toHaveLength(6)
    expect(planNotes(c, plan).some((n) => n.kind === 'repeatedDinner')).toBe(true)
  })

  it("avoids children's dislikes where possible, and notes them otherwise", () => {
    const salmon = byId.get(r('salmon-sweet-potato-broccoli'))!
    const fishId = salmon.ingredients.find((l) => ingredients.get(l.ingredientId)?.proteinSource === 'fish')!.ingredientId
    const picky = household({ people: [adult('a1', 120), child('c1', { dislikedIngredientIds: [fishId] })] })
    forManyWeeks(
      (plan) => expect(dinnerIds(plan)).not.toContain(salmon.id),
      (seed) => ctx(seed, { household: picky }),
    )

    // Repeating a dinner beats serving a disliked dish (#110).
    const two = SEED_RECIPES.filter((rec) => !rec.categoryIds.includes('dinner') || rec.id === salmon.id || rec.id === r('chicken-tikka-rice'))
    forManyWeeks(
      (plan) => expect(dinnerIds(plan)).not.toContain(salmon.id),
      (seed) => ctx(seed, { recipes: two, household: picky }),
    )

    const onlySalmon = SEED_RECIPES.filter((rec) => !rec.categoryIds.includes('dinner') || rec.id === salmon.id)
    const c = ctx(4, { recipes: onlySalmon, household: picky })
    const notes = planNotes(c, generate(c))
    expect(notes).toContainEqual({ date: MONDAY, slot: 'dinner', kind: 'dislike', personId: 'c1', ingredientIds: [fishId] })
  })
})

describe('portions and protein', () => {
  it('scales a portion to the meal share of the target, within 0.75×–2×, in quarters', () => {
    expect(personalPortion(120, 30, 36)).toBe(1) // 36 g needed, 36 g per portion
    expect(personalPortion(120, 30, 43)).toBe(0.75) // 0.84 → 0.75
    expect(personalPortion(140, 30, 24)).toBe(1.75) // 1.75
    expect(personalPortion(200, 30, 10)).toBe(2) // capped
    expect(personalPortion(60, 30, 50)).toBe(0.75) // floor
    expect(personalPortion(undefined, 30, 40)).toBe(1) // no target
  })

  it('gives children half portions and leaves them out of weekday lunch unless set', () => {
    const plan = generate(ctx(5))
    expect(plan.days[0].meals.dinner.portions).toMatchObject({ c1: 0.5, c2: 0.5 })
    expect(plan.days[1].meals.lunch.portions).not.toHaveProperty('c1') // Tuesday
    expect(plan.days[5].meals.lunch.portions).toMatchObject({ c1: 0.5 }) // Saturday
    expect(plan.days[6].meals.lunch.portions).toMatchObject({ c1: 0.5 }) // Sunday

    const home = child('c3', { eatsWeekdayLunchAtHome: true })
    expect(eatsMeal(home, 'lunch', 1)).toBe(true)
    expect(eatsMeal(child('c4'), 'lunch', 1)).toBe(false)
    expect(eatsMeal(child('c4'), 'dinner', 1)).toBe(true)
  })

  it('cooks extra dinner portions for the next day’s leftovers lunch', () => {
    const c = ctx(6)
    const plan = generate(c)
    const tuesday = plan.days[1]
    const expected =
      Object.values(tuesday.meals.dinner.portions).reduce((a, b) => a + b, 0) +
      Object.values(plan.days[2].meals.lunch.portions).reduce((a, b) => a + b, 0)
    expect(dinnerPortionsToCook(c, plan, tuesday.date)).toBe(expected)
    // Sunday without next week: Monday's leftovers are estimated (adults only on a weekday).
    expect(dinnerPortionsToCook(c, plan, plan.days[6].date)).toBeGreaterThan(
      Object.values(plan.days[6].meals.dinner.portions).reduce((a, b) => a + b, 0),
    )
  })

  it('stores the targets each day was calculated with and keeps past days on refresh', () => {
    const c = ctx(7)
    const plan = generate(c)
    expect(plan.days[0].targetsG).toEqual({ a1: 120, a2: 140 })
    const changed = { ...c, household: household({ people: [adult('a1', 160), adult('a2', 140), child('c1'), child('c2')] }) }
    const refreshed = refreshPortions(changed, plan, '2026-11-19')
    expect(refreshed.days[2]).toEqual(plan.days[2]) // Wednesday unchanged
    expect(refreshed.days[3].targetsG.a1).toBe(160) // Thursday onwards
  })

  it('sums a day per person and leaves "eating out" meals out of the target', () => {
    const c = ctx(8)
    const plan = generate(c)
    const day = plan.days[0]
    const nutrition = personDayNutrition(day, 'a1', (id) => recipeNutrition(byId.get(id)!, ingredients))
    expect(nutrition.proteinG).toBeGreaterThan(80)
    expect(plannedTargetG(day, 'a1', c.household.proteinSplit)).toBe(120)
    const out = { ...day, meals: { ...day.meals, dinner: { status: 'eatingOut' as const, portions: {}, guests: 0 } } }
    expect(plannedTargetG(out, 'a1', c.household.proteinSplit)).toBe(84) // 70 % of 120
    // A fixed day out (Friday) only counts the meals planned in the app (#109).
    expect(plan.days[4].meals.dinner.status).toBe('none')
    expect(plannedTargetG(plan.days[4], 'a1', c.household.proteinSplit)).toBe(84)
  })

  it('suggests one protein boost item from 5 g missing', () => {
    const none = () => false
    expect(proteinBoost(4, ingredients, none)).toBeUndefined()
    expect(proteinBoost(6, ingredients, none)?.key).toBe('milk') // 7.0 g: least extra
    expect(proteinBoost(7.2, ingredients, none)?.key).toBe('egg') // 7.5 g
    expect(proteinBoost(10, ingredients, none)?.key).toBe('cottageCheese') // 13 g
    expect(proteinBoost(40, ingredients, none)?.key).toBe('skyr') // largest
    expect(proteinBoost(10, ingredients, (i) => i.tags.includes('dairy'))?.key).toBe('egg')
  })
})

describe('regenerating and swapping', () => {
  it('keeps past days, guests and "eating out" when regenerating mid-week', () => {
    const first = generate(ctx(9))
    const edited: WeekPlan = {
      ...first,
      days: first.days.map((d, i) =>
        i === 3
          ? { ...d, meals: { ...d.meals, dinner: { status: 'eatingOut', portions: {}, guests: 0 } } }
          : i === 6
            ? { ...d, meals: { ...d.meals, dinner: { ...d.meals.dinner, guests: 2 } } }
            : d,
      ),
    }
    const again = generate(ctx(10), { existing: edited, today: '2026-11-18' }) // Wednesday
    expect(again.days[0]).toEqual(edited.days[0])
    expect(again.days[1]).toEqual(edited.days[1])
    expect(again.days[3].meals.dinner.status).toBe('eatingOut')
    expect(again.days[4].meals.lunch.status).toBe('planned') // quick lunch after eating out
    expect(again.days[6].meals.dinner.guests).toBe(2)
    const ids = dinnerIds(again).filter(Boolean)
    expect(new Set(ids).size).toBe(ids.length) // kept dinners count for "no repeat"
  })

  it('updates the next day’s leftovers when a dinner is swapped', () => {
    const c = ctx(11)
    const plan = generate(c)
    const { plan: swapped } = swapMeal(c, { plan, date: plan.days[1].date, slot: 'dinner' })
    const newDinner = swapped.days[1].meals.dinner.recipeId
    expect(newDinner).not.toBe(plan.days[1].meals.dinner.recipeId)
    expect(swapped.days[2].meals.lunch.recipeId).toBe(newDinner)
    // A repeat is only allowed as a relaxed rule, and is then noted (#100).
    if (new Set(dinnerIds(swapped).filter(Boolean)).size < 6) {
      expect(planNotes(c, swapped).some((n) => n.kind === 'repeatedDinner')).toBe(true)
    }
  })

  it('turns a swapped leftovers lunch into a quick lunch and cooks less the day before', () => {
    const c = ctx(12)
    const plan = generate(c)
    const before = dinnerPortionsToCook(c, plan, plan.days[1].date)
    const { plan: swapped } = swapMeal(c, { plan, date: plan.days[2].date, slot: 'lunch' })
    expect(swapped.days[2].meals.lunch.status).toBe('planned')
    expect(byId.get(swapped.days[2].meals.lunch.recipeId!)?.categoryIds).toContain('lunch')
    expect(dinnerPortionsToCook(c, swapped, plan.days[1].date)).toBeLessThan(before)
  })

  it('follows a swapped Sunday dinner into next week’s Monday leftovers', () => {
    const c = ctx(13)
    const plan = generate(c)
    const nextWeek = generate(ctx(14), { weekId: '2026-W48', today: '2026-11-23', previousWeek: plan })
    const result = swapMeal(c, { plan, date: plan.days[6].date, slot: 'dinner', nextWeek })
    expect(result.nextWeek?.days[0].meals.lunch.recipeId).toBe(result.plan.days[6].meals.dinner.recipeId)
  })

  it('does not swap Friday dinner or "eating out"', () => {
    const c = ctx(15)
    const plan = generate(c)
    expect(swapMeal(c, { plan, date: plan.days[4].date, slot: 'dinner' }).plan).toBe(plan)
  })
})
