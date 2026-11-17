import { describe, expect, it } from 'vitest'
import { defaultHousehold } from './defaults'
import { recipeNutrition } from './nutrition'
import {
  addExtras,
  boostSuggestions,
  dayProtein,
  dayStarted,
  dinnerPortionsToCook,
  emptyMeals,
  emptyWeekPlan,
  filledNonFavorites,
  followSundayDinner,
  generateWeekPlan,
  pickImpacts,
  setEatingOut,
  setGuests,
  setMeal,
  isRecipeAllowed,
  mainProteinSource,
  planNotes,
  refreshPortions,
  swapMeal,
  type PlannerContext,
} from './planner'
import { eatsMeal, personalPortion, personDayNutrition, plannedTargetG, proteinBoost } from './protein'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { diffMeals, isCurrent, mealKey, revertChanges } from './undo'
import { SEED_RECIPES } from './seed/recipes'
import type { HouseholdSettings, Ingredient, Person, Recipe, WeekPlan } from './types'

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
    expect(plannedTargetG(day, 'a1', c.household.proteinSplit, false)).toBe(120)
    const out = { ...day, meals: { ...day.meals, dinner: { status: 'eatingOut' as const, portions: {}, guests: 0 } } }
    expect(plannedTargetG(out, 'a1', c.household.proteinSplit, false)).toBe(84) // 70 % of 120
    // A fixed day out (Friday) only counts the meals planned in the app (#109).
    expect(plan.days[4].meals.dinner.status).toBe('none')
    expect(plannedTargetG(plan.days[4], 'a1', c.household.proteinSplit, true)).toBe(84)
    // An empty meal still counts while planning by hand (#112).
    const empty = { ...day, meals: { ...day.meals, breakfast: { status: 'none' as const, portions: {}, guests: 0 } } }
    expect(plannedTargetG(empty, 'a1', c.household.proteinSplit, false)).toBe(120)
  })

  it('suggests up to two different boost items, covering the gap with the least extra (#103, #153)', () => {
    const none = () => false
    const keys = (gap: number, excluded: (i: Ingredient) => boolean = none) => proteinBoost(gap, ingredients, excluded)?.items.map((i) => i.key)
    expect(proteinBoost(4, ingredients, none)).toBeUndefined()
    expect(keys(6)).toEqual(['milk']) // 7.0 g: least extra
    expect(keys(7.2)).toEqual(['egg']) // 7.5 g
    expect(keys(10)).toEqual(['cottageCheese']) // 13 g
    expect(keys(14)).toEqual(['egg', 'milk']) // 14.5 g: a pair beats one large item
    // 48 g cannot be covered: the largest pair, and the total says how much it covers.
    const big = proteinBoost(48, ingredients, none)!
    expect(big.items.map((i) => i.key)).toEqual(['cottageCheese', 'skyr'])
    expect(big.proteinG).toBeLessThan(48)
    expect(big.proteinG).toBeCloseTo(big.items[0].proteinG + big.items[1].proteinG, 5)
    expect(keys(10, (i) => i.tags.includes('dairy'))).toEqual(['egg'])
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

describe('planning by hand, filling and favourites (milestone F)', () => {
  const dinners = SEED_RECIPES.filter((x) => x.categoryIds.includes('dinner'))

  it('starts an empty week with every meal empty', () => {
    const plan = emptyWeekPlan(WEEK, household())
    expect(plan.days).toHaveLength(7)
    expect(plan.days.every((d) => Object.values(d.meals).every((m) => m.status === 'none'))).toBe(true)
    expect(plan.days[0].targetsG).toEqual({ a1: 120, a2: 140 })
  })

  it('puts a picked dinner on the plan and makes the next lunch leftovers (#112, #114)', () => {
    const c = ctx(1)
    const pick = dinners[0].id
    const { plan } = setMeal(c, { plan: emptyWeekPlan(WEEK, c.household), date: MONDAY, slot: 'dinner', recipeId: pick })
    expect(plan.days[0].meals.dinner).toMatchObject({ status: 'planned', recipeId: pick })
    expect(plan.days[0].meals.dinner.portions.a1).toBeGreaterThan(0)
    expect(plan.days[1].meals.lunch).toMatchObject({ status: 'leftovers', recipeId: pick, leftoversFrom: MONDAY })
  })

  it('fills only empty meals and keeps what the user picked (#121)', () => {
    forManyWeeks(
      (_, c) => {
        const picked = dinners[1].id
        const start = setMeal(c, { plan: emptyWeekPlan(WEEK, c.household), date: '2026-11-18', slot: 'dinner', recipeId: picked }).plan
        const filled = generate(c, { existing: start, fillEmptyOnly: true })
        expect(filled.days[2].meals.dinner.recipeId).toBe(picked)
        expect(filled.days[3].meals.lunch).toMatchObject({ status: 'leftovers', recipeId: picked })
        expect(filled.days[4].meals.dinner.status).toBe('none') // fixed day out
        for (const [i, day] of filled.days.entries()) {
          for (const slot of ['breakfast', 'lunch', 'snack'] as const) expect(day.meals[slot].status, `${i} ${slot}`).not.toBe('none')
          if (i !== 4) expect(day.meals.dinner.status).toBe('planned')
        }
        expect(dinnerIds(filled).filter((id) => id === picked)).toHaveLength(1)
      },
    )
  })

  it('uses favourites first in a favourites week and tops up with regular dishes (#123, #131, #132)', () => {
    const favs = new Set(dinners.slice(0, 3).map((x) => x.id))
    const recipes = SEED_RECIPES.map((x) => (favs.has(x.id) ? { ...x, favorite: true } : x))
    const allowedFavs = dinners.filter((x) => favs.has(x.id) && x.timeMinutes <= 30 && isRecipeAllowed(x, ingredients, household())).length
    let weightedOnly = 0
    for (let seed = 1; seed <= 200; seed++) {
      const c = ctx(seed, { recipes })
      const plan = generate(c, { favoritesOnly: true })
      const used = dinnerIds(plan).filter((id) => id && favs.has(id))
      expect(new Set(used).size).toBe(allowedFavs)
      expect(plan.days.filter((d) => d.meals.dinner.status === 'planned')).toHaveLength(6)
      expect(filledNonFavorites(c, undefined, plan)).toBeGreaterThan(0)
      // Without the option, favourites are only weighted.
      weightedOnly += new Set(dinnerIds(generate(ctx(seed, { recipes }))).filter((id) => id && favs.has(id))).size
    }
    expect(weightedOnly / 200).toBeLessThan(allowedFavs)
  })

  it('marks a dinner as eaten out and turns the next leftovers into a quick lunch (#30, #108)', () => {
    const c = ctx(4)
    const plan = generate(c)
    const { plan: out } = setEatingOut(c, { plan, date: MONDAY, slot: 'dinner', eatingOut: true })
    expect(out.days[0].meals.dinner.status).toBe('eatingOut')
    expect(out.days[1].meals.lunch.status).toBe('planned')
    expect(byId.get(out.days[1].meals.lunch.recipeId!)?.categoryIds).toContain('lunch')
    const back = setEatingOut(c, { plan: out, date: MONDAY, slot: 'dinner', eatingOut: false }).plan
    expect(back.days[0].meals.dinner.status).toBe('none')
  })

  it('sets guests and cooks for them', () => {
    const c = ctx(5)
    const plan = generate(c)
    const before = dinnerPortionsToCook(c, plan, MONDAY)
    const withGuests = setGuests(plan, MONDAY, 'dinner', 2)
    expect(dinnerPortionsToCook(c, withGuests, MONDAY)).toBe(before + 2)
  })

  it('shows the protein impact of a pick per adult (#115, #119)', () => {
    const c = ctx(6)
    const plan = generate(c)
    const ids = dinners.map((x) => x.id)
    const impacts = pickImpacts(c, { plan, date: MONDAY, slot: 'dinner', recipeIds: ids })
    expect(impacts.size).toBe(ids.length)
    for (const [id, list] of impacts) {
      expect(list.map((p) => p.personId)).toEqual(['a1', 'a2'])
      const { plan: picked } = setMeal(c, { plan, date: MONDAY, slot: 'dinner', recipeId: id })
      const day = dayProtein(c, picked.days[0])
      list.forEach((p, k) => expect(p.diffG).toBeCloseTo(day[k].proteinG - day[k].targetG, 5))
    }
  })

  it('suggests boosts for adults under target, and an added extra counts (#103, #120)', () => {
    const c = ctx(7)
    let plan = emptyWeekPlan(WEEK, c.household)
    plan = setMeal(c, { plan, date: MONDAY, slot: 'breakfast', recipeId: SEED_RECIPES.find((x) => x.categoryIds.includes('breakfast'))!.id }).plan
    const suggestions = boostSuggestions(c, plan.days[0])
    expect(suggestions.map((x) => x.personId)).toEqual(['a1', 'a2'])
    const before = dayProtein(c, plan.days[0])[0].proteinG
    const s = suggestions[0]
    plan = addExtras(plan, MONDAY, s.boost.items.map((b) => ({ personId: s.personId, ingredientId: b.ingredientId, amount: b.amount, unit: b.unit })))
    const after = dayProtein(c, plan.days[0])
    expect(after[0].proteinG).toBeCloseTo(before + s.boost.proteinG, 5)
    expect(plan.days[0].meals.snack.extras).toHaveLength(s.boost.items.length)
  })
})

describe("next week's Monday lunch follows Sunday's dinner (#143)", () => {
  const NEXT = '2026-W48'
  const setup = (seed: number) => {
    const c = ctx(seed)
    const plan = generate(c)
    const next = generateWeekPlan(c, { weekId: NEXT, today: MONDAY, previousWeek: plan })
    return { c, plan, next }
  }

  it('updates the leftovers when "fill" or "start over" changes Sunday dinner', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { c, plan, next } = setup(seed)
      expect(next.days[0].meals.lunch).toMatchObject({ status: 'leftovers', recipeId: plan.days[6].meals.dinner.recipeId })
      const redone = generate(ctx(seed + 1000), { existing: plan })
      const followed = followSundayDinner(c, redone, next)!
      expect(followed.days[0].meals.lunch).toMatchObject({
        status: 'leftovers',
        recipeId: redone.days[6].meals.dinner.recipeId,
        leftoversFrom: '2026-11-22',
      })
      expect(Object.keys(followed.days[0].meals.lunch.portions).length).toBeGreaterThan(0)
      expect(followed.days.slice(1)).toEqual(next.days.slice(1))
    }
  })

  it('gives a quick lunch when Sunday dinner is no longer cooked at home', () => {
    const { c, plan, next } = setup(2)
    const out = { ...plan, days: plan.days.map((d, i) => (i === 6 ? { ...d, meals: { ...d.meals, dinner: { status: 'eatingOut' as const, portions: {}, guests: 0 } } } : d)) }
    const lunch = followSundayDinner(c, out, next)!.days[0].meals.lunch
    expect(lunch.status).toBe('planned')
    expect(byId.get(lunch.recipeId!)?.categoryIds).toContain('lunch')
  })

  it("leaves a Monday lunch the user picked themselves alone", () => {
    const { c, plan, next } = setup(3)
    const quick = SEED_RECIPES.find((x) => x.categoryIds.includes('lunch'))!.id
    const own = setMeal(c, { plan: next, date: '2026-11-23', slot: 'lunch', recipeId: quick }).plan
    const redone = generate(ctx(77), { existing: plan })
    expect(followSundayDinner(c, redone, own)).toBe(own)
  })
})

describe('undo per meal and per week action (#146–#152)', () => {
  const TUESDAY = '2026-11-17'

  it('undoing a dinner swap also restores the leftovers lunch that followed it', () => {
    const c = ctx(3)
    const plan = generate(c)
    const swapped = swapMeal(c, { plan, date: MONDAY, slot: 'dinner' }).plan
    const changes = diffMeals([plan], [swapped])
    expect(changes.map((x) => mealKey(x.date, x.slot)).sort()).toEqual([mealKey(MONDAY, 'dinner'), mealKey(TUESDAY, 'lunch')])
    const [restored] = revertChanges([swapped], changes)
    expect(restored.days[0].meals.dinner).toEqual(plan.days[0].meals.dinner)
    expect(restored.days[1].meals.lunch).toEqual(plan.days[1].meals.lunch)
  })

  it('never undoes a meal that was changed again afterwards', () => {
    const c = ctx(4)
    const plan = generate(c)
    const swapped = swapMeal(c, { plan, date: MONDAY, slot: 'dinner' }).plan
    const changes = diffMeals([plan], [swapped])
    const lunchPicked = setMeal(c, { plan: swapped, date: TUESDAY, slot: 'lunch', recipeId: plan.days[3].meals.dinner.recipeId! }).plan
    expect(isCurrent(changes.find((x) => x.slot === 'lunch')!, [lunchPicked])).toBe(false)
    const [restored] = revertChanges([lunchPicked], changes)
    expect(restored.days[0].meals.dinner).toEqual(plan.days[0].meals.dinner)
    expect(restored.days[1].meals.lunch).toEqual(lunchPicked.days[1].meals.lunch)
  })

  it('finds the meals still to be chosen, but not dinner on a fixed day out', () => {
    const c = ctx(5)
    const empty = emptyWeekPlan(WEEK, c.household)
    expect(emptyMeals(c.household, empty.days[0])).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
    expect(emptyMeals(c.household, empty.days[4])).toEqual(['breakfast', 'lunch', 'snack'])
    expect(dayStarted(empty.days[0])).toBe(false)
    const plan = generate(c)
    expect(emptyMeals(c.household, plan.days[4])).toEqual([])
    expect(dayStarted(plan.days[4])).toBe(true)
  })
})
