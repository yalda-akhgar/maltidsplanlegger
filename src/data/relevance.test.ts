import { describe, expect, it } from 'vitest'
import { DEFAULT_CATEGORIES, defaultHousehold } from './defaults'
import { turnMealOff } from './meals'
import { emptyWeekPlan, removeRecipeFromPlans } from './planner'
import { hasChildren, hasProteinTarget, recipeRelevance } from './relevance'
import type { HouseholdSettings, Person, WeekPlan } from './types'

const person = (id: string, kind: Person['kind'], extra: Partial<Person> = {}): Person => ({ id, name: id, kind, dislikedIngredientIds: [], ...extra })
const household = (extra: Partial<HouseholdSettings> = {}): HouseholdSettings => ({ ...defaultHousehold('2026-11-26T00:00:00.000Z'), ...extra })

describe('show only what is relevant to this household (#195)', () => {
  it('hides "Kid-friendly" without children, and brings it back when a child is added', () => {
    const adults = household({ people: [person('a', 'adult')] })
    expect(hasChildren(adults)).toBe(false)
    expect(recipeRelevance(adults, DEFAULT_CATEGORIES).kidFriendly).toBe(false)
    expect(recipeRelevance({ ...adults, people: [...adults.people, person('c', 'child')] }, DEFAULT_CATEGORIES).kidFriendly).toBe(true)
  })
  it('hides the category of a meal that is off, and the snack type when the snack is off', () => {
    const noLunch = household({ proteinSplit: turnMealOff(defaultHousehold().proteinSplit, 'lunch') })
    expect(recipeRelevance(noLunch, DEFAULT_CATEGORIES).categories.map((c) => c.id)).toEqual(['breakfast', 'dinner', 'snack'])
    const noSnack = household({ proteinSplit: turnMealOff(defaultHousehold().proteinSplit, 'snack') })
    expect(recipeRelevance(noSnack, DEFAULT_CATEGORIES).snackKind).toBe(false)
    expect(recipeRelevance(household(), DEFAULT_CATEGORIES).categories).toHaveLength(4)
  })
  it('keeps own categories (no meal slot) whatever meals are on', () => {
    const baking = { id: 'baking', name: { nb: 'Baking' }, builtIn: false, sortOrder: 5 }
    const noLunch = household({ proteinSplit: turnMealOff(defaultHousehold().proteinSplit, 'lunch') })
    expect(recipeRelevance(noLunch, [...DEFAULT_CATEGORIES, baking]).categories.map((c) => c.id)).toContain('baking')
  })
  it('protein alerts only matter when an adult has a target', () => {
    expect(hasProteinTarget(household({ people: [person('a', 'adult'), person('c', 'child')] }))).toBe(false)
    expect(hasProteinTarget(household({ people: [person('a', 'adult', { proteinTargetG: 120 })] }))).toBe(true)
  })
})

describe('removeRecipeFromPlans – deleting a recipe (#195)', () => {
  const NOW = '2026-11-26T12:00:00.000Z'
  function planWith(recipeId: string): WeekPlan {
    const plan = emptyWeekPlan('2026-W48', household(), NOW) // Monday 2026-11-23 … Sunday 2026-11-29
    plan.days = plan.days.map((day) => ({
      ...day,
      meals: {
        ...day.meals,
        dinner: { status: 'planned', recipeId, portions: { a: 1 }, guests: 1, chosenByUser: true },
        lunch: { status: 'leftovers', recipeId, leftoversFrom: day.date, portions: { a: 1 }, guests: 0 },
        breakfast: { status: 'planned', recipeId: 'other', portions: { a: 1 }, guests: 0 },
      },
    }))
    return plan
  }

  it('empties meals with the recipe from today on, keeps earlier days and other dishes', () => {
    const [changed] = removeRecipeFromPlans([planWith('gone')], 'gone', '2026-11-26', NOW)
    const thursday = changed.days[3]
    expect(thursday.meals.dinner).toEqual({ status: 'none', portions: {}, guests: 1 }) // guests kept
    expect(thursday.meals.lunch.status).toBe('none') // leftovers of the dish go with it
    expect(thursday.meals.breakfast.recipeId).toBe('other')
    expect(changed.days[2].meals.dinner.recipeId).toBe('gone') // Wednesday has been
  })
  it('returns only plans that changed', () => {
    expect(removeRecipeFromPlans([planWith('kept')], 'gone', '2026-11-26', NOW)).toEqual([])
  })
})
