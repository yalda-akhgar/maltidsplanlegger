import { describe, expect, it } from 'vitest'
import { defaultHousehold } from './defaults'
import { turnMealOff } from './meals'
import { emptyWeekPlan, generateWeekPlan, type PlannerContext } from './planner'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { SEED_RECIPES } from './seed/recipes'
import { applyApproval, approvalRows, buyCount, roundForShopping, toApproval, usedIngredients, weekNeeds, type ShoppingNeed } from './shopping'
import { STORE_SECTIONS, type HouseholdSettings, type Id, type MealSlot, type PlannedMeal, type Recipe, type RecipeIngredient, type ShoppingItem, type WeekApproval, type WeekPlan } from './types'
import { shiftWeek } from './week'

const WEEK = '2026-W47' // Monday 2026-11-16 … Sunday 2026-11-22
const NOW = '2026-11-16T00:00:00.000Z'
const ingredients = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
const ing = (key: string) => `seed-ingredient-${key}`

function household(extra: Partial<HouseholdSettings> = {}): HouseholdSettings {
  return {
    ...defaultHousehold(NOW),
    people: [
      { id: 'a1', name: 'a1', kind: 'adult', proteinTargetG: 120, dislikedIngredientIds: [] },
      { id: 'a2', name: 'a2', kind: 'adult', proteinTargetG: 140, dislikedIngredientIds: [] },
      { id: 'c1', name: 'c1', kind: 'child', dislikedIngredientIds: [] },
    ],
    ...extra,
  }
}

const line = (key: string, amount: number, unit: RecipeIngredient['unit'], extra: Partial<RecipeIngredient> = {}): RecipeIngredient => ({
  ingredientId: ing(key),
  amount,
  unit,
  ...extra,
})

/** A small test recipe written for `servings` portions. */
function recipe(id: Id, servings: number, ingredientLines: RecipeIngredient[], categoryIds = ['dinner']): Recipe {
  return {
    id,
    name: { en: id },
    categoryIds,
    timeMinutes: 20,
    servings,
    ingredients: ingredientLines,
    steps: [],
    tags: [],
    kidFriendly: true,
    favorite: false,
    source: 'user',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

const RECIPES: Recipe[] = [
  // 4 portions: 600 g chicken, 1 can tomatoes, 2 onions.
  recipe('chicken', 4, [line('chicken-breast', 600, 'g'), line('chopped-tomatoes', 1, 'can'), line('onion', 2, 'pcs'), line('olive-oil', 1, 'tbsp')]),
  // 2 portions: half a cucumber in pieces.
  recipe('salad', 2, [line('cucumber', 0.5, 'pcs'), line('greek-yoghurt', 2, 'dl')], ['lunch']),
  // 1 portion: cucumber in grams.
  recipe('bowl', 1, [line('cucumber', 100, 'g'), line('greek-yoghurt', 100, 'g'), line('pepper', 1, 'pinch', { omittable: true })], ['breakfast']),
  // 2 portions: wholewheat pasta (for the gluten-free alternative test).
  recipe('pasta', 2, [line('wholewheat-pasta', 200, 'g'), line('onion', 1, 'pcs')]),
]

function ctx(extra: Partial<PlannerContext> = {}): PlannerContext {
  return { recipes: RECIPES, ingredients, household: household(), ...extra }
}

const meal = (extra: Partial<PlannedMeal> = {}): PlannedMeal => ({ status: 'planned', portions: { a1: 1, a2: 1 }, guests: 0, ...extra })

/** Sets meals on a copy of the plan: `set(plan, [dayIndex, slot, meal], …)`. */
function set(plan: WeekPlan, ...changes: [number, MealSlot, PlannedMeal][]): WeekPlan {
  const days = plan.days.map((d) => ({ ...d, meals: { ...d.meals } }))
  for (const [i, slot, m] of changes) days[i].meals[slot] = m
  return { ...plan, days }
}

const empty = (weekId = WEEK, h = household()) => emptyWeekPlan(weekId, h, NOW)
const need = (needs: ReturnType<typeof weekNeeds>, key: string) => needs.filter((n) => n.ingredientId === ing(key))

describe('weekNeeds', () => {
  it('an empty week needs nothing', () => {
    expect(weekNeeds(ctx(), empty())).toEqual([])
  })

  it('scales a dinner to the portions eaten, guests included', () => {
    // 2 adults + 2 guests = 4 portions = the recipe as written.
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'chicken', guests: 2 })])
    const needs = weekNeeds(ctx(), plan)
    expect(need(needs, 'chicken-breast')[0]).toMatchObject({ amount: 600, unit: 'g', storeSection: 'meatFish', isStaple: false })
    expect(need(needs, 'onion')[0]).toMatchObject({ amount: 2, unit: 'pcs' })
    expect(need(needs, 'chopped-tomatoes')[0]).toMatchObject({ amount: 1, unit: 'can' })
  })

  it('a dinner counts the next day’s leftovers lunch; the lunch adds nothing itself', () => {
    const plan = set(
      empty(),
      [0, 'dinner', meal({ recipeId: 'chicken' })],
      [1, 'lunch', meal({ status: 'leftovers', recipeId: 'chicken', leftoversFrom: '2026-11-16' })],
    )
    // 2 at dinner + 2 at lunch = 4 portions.
    const chicken = need(weekNeeds(ctx(), plan), 'chicken-breast')
    expect(chicken).toHaveLength(1)
    expect(chicken[0].amount).toBe(600)
    expect(chicken[0].uses).toEqual([{ date: '2026-11-16', slot: 'dinner', recipeId: 'chicken' }])
  })

  it('Sunday’s dinner includes Monday’s leftovers in the next week (#185 E)', () => {
    const plan = set(empty(), [6, 'dinner', meal({ recipeId: 'chicken' })])
    const next = set(empty(shiftWeek(WEEK, 1)), [0, 'lunch', meal({ status: 'leftovers', recipeId: 'chicken', leftoversFrom: '2026-11-22' })])
    expect(need(weekNeeds(ctx(), plan, { nextWeek: next }), 'chicken-breast')[0].amount).toBe(600)
    // …and the next week doesn't buy the leftovers again.
    expect(need(weekNeeds(ctx(), next), 'chicken-breast')).toEqual([])
  })

  it('eating out, removed and empty meals need nothing', () => {
    const plan = set(
      empty(),
      [0, 'dinner', meal({ status: 'eatingOut' })],
      [1, 'dinner', meal({ status: 'skipped', recipeId: 'chicken' })],
      [2, 'dinner', meal({ status: 'none' })],
    )
    expect(weekNeeds(ctx(), plan)).toEqual([])
  })

  it('merges the same ingredient across meals into one line, listing every use', () => {
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'chicken' })], [2, 'dinner', meal({ recipeId: 'pasta' })])
    const onion = need(weekNeeds(ctx(), plan), 'onion')
    // 2 portions of each: 1 + 1 onion.
    expect(onion).toHaveLength(1)
    expect(onion[0].amount).toBe(2)
    expect(onion[0].uses.map((u) => u.recipeId)).toEqual(['chicken', 'pasta'])
  })

  it('different units become pieces when the ingredient has a piece weight (#185 A)', () => {
    // Cucumber: ½ pcs (salad, 2 portions) + 100 g (bowl, 1 portion) = 175 + 100 g = 0.79 pcs → 1 pcs.
    const plan = set(empty(), [0, 'lunch', meal({ recipeId: 'salad' })], [1, 'breakfast', meal({ recipeId: 'bowl', portions: { a1: 1 } })])
    const cucumber = need(weekNeeds(ctx(), plan), 'cucumber')
    expect(cucumber).toEqual([expect.objectContaining({ amount: 1, unit: 'pcs' })])
  })

  it('different units become grams when the ingredient has no piece weight (#185 A)', () => {
    // Greek yoghurt: 2 dl (= 200 g) + 100 g = 300 g.
    const plan = set(empty(), [0, 'lunch', meal({ recipeId: 'salad' })], [1, 'breakfast', meal({ recipeId: 'bowl', portions: { a1: 1 } })])
    expect(need(weekNeeds(ctx(), plan), 'greek-yoghurt')).toEqual([expect.objectContaining({ amount: 300, unit: 'g' })])
  })

  it('pieces, cans and packs are rounded up to whole ones (#185 B)', () => {
    // 2.5 portions of chicken: 0.625 cans → 1 can, 1.25 onions → 2 onions.
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'chicken', portions: { a1: 1, a2: 1, c1: 0.5 } })])
    const needs = weekNeeds(ctx(), plan)
    expect(need(needs, 'chopped-tomatoes')[0].amount).toBe(1)
    expect(need(needs, 'onion')[0].amount).toBe(2)
    expect(need(needs, 'chicken-breast')[0].amount).toBe(380) // 375 g rounded as in recipes
  })

  it('roundForShopping keeps exact whole amounts and never rounds down to 0', () => {
    expect(roundForShopping(2.0000001, 'pcs')).toBe(2)
    expect(roundForShopping(0.1, 'can')).toBe(1)
    expect(roundForShopping(1.5, 'tbsp')).toBe(1.5)
    expect(roundForShopping(0, 'pcs')).toBe(0)
  })

  it('uses the safe alternative instead of the original ingredient (#180)', () => {
    const glutenFree = SEED_INGREDIENTS.find((i) => i.alternativeFor === ing('wholewheat-pasta'))
    expect(glutenFree).toBeDefined()
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'pasta', substitutions: { [ing('wholewheat-pasta')]: glutenFree!.id } })])
    const needs = weekNeeds(ctx(), plan)
    expect(need(needs, 'wholewheat-pasta')).toEqual([])
    expect(needs.find((n) => n.ingredientId === glutenFree!.id)?.amount).toBe(200)
  })

  it('a line left out of one person’s portion is bought as for everyone (#185 C)', () => {
    const plan = set(empty(), [0, 'breakfast', meal({ recipeId: 'bowl' })])
    expect(need(weekNeeds(ctx(), plan), 'pepper')[0]).toMatchObject({ amount: 2, unit: 'pinch', isStaple: true })
  })

  it('extras such as a protein boost are on the list (#185 D)', () => {
    const plan = set(empty(), [3, 'snack', meal({ status: 'none', extras: [{ personId: 'a1', ingredientId: ing('skyr'), amount: 170, unit: 'g' }] })])
    expect(need(weekNeeds(ctx(), plan), 'skyr')).toEqual([
      expect.objectContaining({ amount: 170, unit: 'g', uses: [{ date: '2026-11-19', slot: 'snack' }] }),
    ])
  })

  it('leaves out days before `fromDate` (#185 F)', () => {
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'chicken' })], [2, 'dinner', meal({ recipeId: 'pasta' })])
    const needs = weekNeeds(ctx(), plan, { fromDate: '2026-11-18' })
    expect(need(needs, 'chicken-breast')).toEqual([])
    expect(need(needs, 'onion')[0].amount).toBe(1)
  })

  it('meals the household doesn’t eat need nothing (#183)', () => {
    const h = household()
    const noBreakfast = { ...h, proteinSplit: turnMealOff(h.proteinSplit, 'breakfast') }
    const plan = set(empty(), [0, 'breakfast', meal({ recipeId: 'bowl' })])
    expect(weekNeeds(ctx({ household: noBreakfast }), plan)).toEqual([])
  })

  it('flags staples and sorts by store section in shop order', () => {
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'chicken' })], [1, 'lunch', meal({ recipeId: 'salad' })])
    const needs = weekNeeds(ctx(), plan)
    expect(need(needs, 'olive-oil')[0].isStaple).toBe(true)
    const order = needs.map((n) => STORE_SECTIONS.indexOf(n.storeSection))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('a generated week: every cooked ingredient is on the list with a positive amount', () => {
    let seed = 7
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const c: PlannerContext = { recipes: SEED_RECIPES, ingredients, household: household(), random }
    const plan = generateWeekPlan(c, { weekId: WEEK, today: '2026-11-16', now: NOW })
    const needs = weekNeeds(c, plan)
    const listed = new Set(needs.map((n) => n.ingredientId))
    for (const day of plan.days) {
      for (const m of Object.values(day.meals)) {
        if (m.status !== 'planned' || !m.recipeId) continue
        const r = SEED_RECIPES.find((x) => x.id === m.recipeId)!
        for (const l of r.ingredients) expect(listed.has(m.substitutions?.[l.ingredientId] ?? l.ingredientId)).toBe(true)
      }
    }
    expect(needs.every((n) => n.amount > 0)).toBe(true)
    expect(new Set(needs.map((n) => `${n.ingredientId}|${n.unit}`)).size).toBe(needs.length)
  })
})

describe('approving the week (#173, #184, #186)', () => {
  const needOf = (key: string, extra: Partial<ShoppingNeed> = {}): ShoppingNeed => ({
    ingredientId: ing(key),
    amount: 1,
    unit: 'pcs',
    storeSection: 'produce',
    isStaple: false,
    uses: [],
    ...extra,
  })
  const pantry = (key: string, status: 'have' | 'empty') => ({ id: key, ingredientId: ing(key), status, updatedAt: NOW })

  it('items start as "Buy", items at home as "Have"', () => {
    const rows = approvalRows([needOf('onion'), needOf('tomato')], { pantry: [pantry('onion', 'have')] })
    expect(rows.map((r) => [r.choice, r.atHome])).toEqual([
      ['have', true],
      ['buy', false],
    ])
  })

  it('staples start as "Have", unless Home says they are empty', () => {
    const rows = approvalRows([needOf('salt', { isStaple: true }), needOf('olive-oil', { isStaple: true })], { pantry: [pantry('olive-oil', 'empty')] })
    expect(rows.map((r) => r.choice)).toEqual(['have', 'buy'])
  })

  it('items used last week start as "Buy" with the question, even if Home says "have" (#186 point 3)', () => {
    const rows = approvalRows([needOf('onion'), needOf('salt', { isStaple: true })], {
      pantry: [pantry('onion', 'have')],
      usedLastWeek: new Set([ing('onion'), ing('salt')]),
    })
    expect(rows[0]).toMatchObject({ choice: 'buy', usedLastWeek: true, atHome: true })
    // Staples never get the question.
    expect(rows[1]).toMatchObject({ choice: 'have', usedLastWeek: false })
  })

  it('shown again after approval, items keep the user’s choice (#186 point 8)', () => {
    const previous: WeekApproval = {
      weekId: WEEK,
      approvedAt: NOW,
      fromDate: '2026-11-16',
      items: [{ ingredientId: ing('tomato'), amount: 1, unit: 'pcs', choice: 'have' }],
    }
    expect(approvalRows([needOf('tomato'), needOf('onion')], { previous }).map((r) => r.choice)).toEqual(['have', 'buy'])
    expect(buyCount(approvalRows([needOf('tomato'), needOf('onion')], { previous }))).toBe(1)
  })

  it('usedIngredients lists what a plan used, without staples', () => {
    const plan = set(empty(), [0, 'dinner', meal({ recipeId: 'chicken' })])
    const used = usedIngredients(ctx(), plan)
    expect(used.has(ing('chicken-breast'))).toBe(true)
    expect(used.has(ing('olive-oil'))).toBe(false)
  })

  describe('applyApproval', () => {
    let n = 0
    const newId = () => `id-${++n}`
    const approval = (items: WeekApproval['items'], weekId = WEEK): WeekApproval => ({ weekId, approvedAt: NOW, fromDate: '2026-11-16', items })
    const item = (key: string, amount: number, extra: Partial<ShoppingItem> = {}): ShoppingItem => ({
      id: `old-${key}`,
      ingredientId: ing(key),
      amount,
      unit: 'pcs',
      weekId: WEEK,
      source: 'plan',
      bought: false,
      createdAt: NOW,
      updatedAt: NOW,
      ...extra,
    })

    it('adds only the "Buy" items, with the week', () => {
      const { items, added } = applyApproval(
        [],
        approval([
          { ingredientId: ing('onion'), amount: 2, unit: 'pcs', choice: 'buy' },
          { ingredientId: ing('tomato'), amount: 3, unit: 'pcs', choice: 'have' },
        ]),
        NOW,
        newId,
      )
      expect(added).toBe(1)
      expect(items).toEqual([expect.objectContaining({ ingredientId: ing('onion'), amount: 2, weekId: WEEK, source: 'plan', bought: false })])
    })

    it('approving again replaces the week’s items not bought yet, and keeps own items and other weeks', () => {
      const own: ShoppingItem = { ...item('x', 1), id: 'own', ingredientId: undefined, customName: 'Toothpaste', source: 'user', weekId: undefined }
      const other = item('onion', 1, { id: 'other', weekId: shiftWeek(WEEK, 1) })
      const { items } = applyApproval(
        [item('onion', 2), own, other],
        approval([{ ingredientId: ing('onion'), amount: 3, unit: 'pcs', choice: 'buy' }]),
        NOW,
        newId,
      )
      expect(items.map((i) => i.id)).not.toContain('old-onion')
      expect(items.find((i) => i.id === 'own')).toBeDefined()
      expect(items.find((i) => i.id === 'other')).toBeDefined()
      expect(items.filter((i) => i.weekId === WEEK && i.source === 'plan').map((i) => i.amount)).toEqual([3])
    })

    it('what was already bought for the week is subtracted', () => {
      const { items, added } = applyApproval(
        [item('onion', 2, { bought: true }), item('tomato', 4, { bought: true })],
        approval([
          { ingredientId: ing('onion'), amount: 3, unit: 'pcs', choice: 'buy' },
          { ingredientId: ing('tomato'), amount: 4, unit: 'pcs', choice: 'buy' },
        ]),
        NOW,
        newId,
      )
      expect(added).toBe(1)
      expect(items.filter((i) => !i.bought)).toEqual([expect.objectContaining({ ingredientId: ing('onion'), amount: 1 })])
      expect(items.filter((i) => i.bought)).toHaveLength(2)
    })

    it('toApproval keeps every row and its choice', () => {
      const rows = approvalRows([needOf('onion'), needOf('tomato')], { pantry: [pantry('onion', 'have')] })
      expect(toApproval(WEEK, '2026-11-18', rows, NOW)).toEqual({
        weekId: WEEK,
        approvedAt: NOW,
        fromDate: '2026-11-18',
        items: [
          { ingredientId: ing('onion'), amount: 1, unit: 'pcs', choice: 'have' },
          { ingredientId: ing('tomato'), amount: 1, unit: 'pcs', choice: 'buy' },
        ],
      })
    })
  })
})
