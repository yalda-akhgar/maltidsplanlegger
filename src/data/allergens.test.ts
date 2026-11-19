import { describe, expect, it } from 'vitest'
import { blockedAt, recipeAllergens, recipeSafety, withSubstitutions } from './allergens'
import { defaultHousehold } from './defaults'
import { recipeNutrition } from './nutrition'
import {
  adaptToSettings,
  generateWeekPlan,
  noSafeDish,
  refillMeal,
  setMeal,
  skipMeal,
  swapMeal,
  weekdayOf,
  type PlannerContext,
} from './planner'
import { eatsMeal } from './protein'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { SEED_RECIPES } from './seed/recipes'
import { ALLERGENS, MEAL_SLOTS, type Allergen, type HouseholdSettings, type Ingredient, type Person, type Recipe, type WeekPlan } from './types'

const WEEK = '2026-W47'
const MONDAY = '2026-11-16'
const ingredients = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
const recipe = (key: string) => SEED_RECIPES.find((r) => r.id === `seed-recipe-${key}`)!
const ing = (key: string) => `seed-ingredient-${key}`

function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const adult = (id: string, allergies: Allergen[] = []): Person => ({ id, name: id, kind: 'adult', proteinTargetG: 120, dislikedIngredientIds: [], allergies })
const child = (id: string, allergies: Allergen[] = []): Person => ({ id, name: id, kind: 'child', dislikedIngredientIds: [], allergies })

function household(people: Person[], extra: Partial<HouseholdSettings> = {}): HouseholdSettings {
  return { ...defaultHousehold('2026-11-16T00:00:00.000Z'), people, noDinnerAtHomeDays: [4], ...extra }
}

const ctx = (h: HouseholdSettings, seed = 1, extra: Partial<PlannerContext> = {}): PlannerContext => ({
  recipes: SEED_RECIPES,
  ingredients,
  household: h,
  random: seeded(seed),
  ...extra,
})

const generate = (c: PlannerContext, opts: Partial<Parameters<typeof generateWeekPlan>[1]> = {}) =>
  generateWeekPlan(c, { weekId: WEEK, today: MONDAY, now: '2026-11-16T08:00:00.000Z', ...opts })

/** Every dish on the plan, as cooked (with its alternatives), is free of the allergens of everyone eating it. */
function expectSafe(plan: WeekPlan, c: PlannerContext) {
  plan.days.forEach((day, i) => {
    for (const slot of MEAL_SLOTS) {
      const meal = day.meals[slot]
      if ((meal.status !== 'planned' && meal.status !== 'leftovers') || !meal.recipeId) continue
      const cooked = withSubstitutions(c.recipes.find((r) => r.id === meal.recipeId)!, meal.substitutions)
      const contains = recipeAllergens(cooked, c.ingredients)
      const eaters = c.household.people.filter((p) => eatsMeal(p, meal.status === 'leftovers' ? 'dinner' : slot, i))
      for (const person of eaters) {
        const hit = contains.filter((a) => (person.allergies ?? []).includes(a))
        expect(hit, `${day.date} ${slot} ${meal.recipeId} for ${person.id}`).toEqual([])
      }
    }
  })
}

describe('allergen labels (#180)', () => {
  it('every seed ingredient states its allergens, hidden ones included', () => {
    for (const i of SEED_INGREDIENTS) expect(i.allergens, i.id).toBeDefined()
    expect(ingredients.get(ing('soy-sauce'))!.allergens).toEqual(expect.arrayContaining(['gluten', 'soy']))
    expect(ingredients.get(ing('tortilla'))!.allergens).toContain('gluten')
    expect(ingredients.get(ing('skyr'))!.allergens).toEqual(expect.arrayContaining(['milk', 'lactose']))
  })

  it('every alternative replaces an existing ingredient and has fewer allergens or is milder', () => {
    const alternatives = SEED_INGREDIENTS.filter((i) => i.alternativeFor)
    expect(alternatives.length).toBe(17)
    for (const alt of alternatives) {
      const original = ingredients.get(alt.alternativeFor!)
      expect(original, alt.id).toBeDefined()
      const fewerAllergens = original!.allergens!.some((a) => !alt.allergens!.includes(a))
      const milder = (original!.contains ?? []).some((id) => !(alt.contains ?? []).includes(id))
      expect(fewerAllergens || milder, alt.id).toBe(true)
    }
  })

  it('a recipe inherits the allergens of its ingredients', () => {
    expect(recipeAllergens(recipe('chicken-stir-fry-noodles'), ingredients)).toEqual(expect.arrayContaining(['gluten', 'egg', 'soy']))
    expect(ALLERGENS).toHaveLength(15)
  })
})

describe('recipe safety for the people at a meal (#180)', () => {
  const safety = (r: Recipe, people: Person[]) => recipeSafety(r, ingredients, blockedAt(household(people), 'dinner', 0))

  it('nothing to avoid without allergies', () => {
    expect(safety(recipe('chicken-stir-fry-noodles'), [adult('a')]).status).toBe('safe')
  })

  it('uses a safe alternative for everyone at the meal', () => {
    const s = safety(recipe('tuna-pasta-peas'), [adult('a'), child('c', ['gluten'])])
    expect(s.status).toBe('safe')
    expect(s.substitutions).toEqual({ [ing('wholewheat-pasta')]: ing('gluten-free-pasta') })
  })

  it('lactose-free products only for lactose intolerance, not for milk allergy', () => {
    const r = SEED_RECIPES.find((x) => x.ingredients.some((l) => l.ingredientId === ing('skyr')) && x.ingredients.length <= 3)!
    const intolerant = safety(r, [adult('a', ['lactose'])])
    expect(intolerant.status).toBe('safe')
    expect(intolerant.substitutions[ing('skyr')]).toBe(ing('lactose-free-skyr'))
    const allergic = safety(r, [adult('a', ['milk'])])
    expect(allergic.status).toBe('unsafe')
    expect(allergic.conflicts).toEqual([{ allergen: 'milk', personIds: ['a'] }])
  })

  it('names who must avoid what', () => {
    const s = safety(recipe('salmon-sweet-potato-broccoli'), [adult('a', ['fish']), child('c', ['fish'])])
    expect(s.status).toBe('unsafe')
    expect(s.conflicts).toEqual([{ allergen: 'fish', personIds: ['a', 'c'] }])
  })

  it('an ingredient without stated allergens makes the dish "unknown" when someone has allergies', () => {
    const own: Ingredient = { ...ingredients.get(ing('salt'))!, id: 'own', allergens: undefined, source: 'user' }
    const map = new Map([...ingredients, ['own', own]])
    const r: Recipe = { ...recipe('chicken-tikka-rice'), ingredients: [...recipe('chicken-tikka-rice').ingredients, { ingredientId: 'own', amount: 1, unit: 'g' }] }
    expect(recipeSafety(r, map, blockedAt(household([adult('a', ['egg'])]), 'dinner', 0)).status).toBe('unknown')
    expect(recipeSafety(r, map, blockedAt(household([adult('a')]), 'dinner', 0)).status).toBe('safe')
  })

  it('a child at kindergarten on weekdays does not limit weekday lunch', () => {
    const h = household([adult('a'), child('c', ['gluten'])])
    expect(blockedAt(h, 'lunch', 0).allergens.size).toBe(0)
    expect(blockedAt(h, 'lunch', 5).allergens.has('gluten')).toBe(true)
    expect(blockedAt(h, 'dinner', 0).allergens.has('gluten')).toBe(true)
  })
})

describe('no dish with an allergen ends up in the plan (#180)', () => {
  const households: Array<[string, Person[]]> = [
    ['child with gluten allergy', [adult('a1'), adult('a2'), child('c1', ['gluten']), child('c2')]],
    ['adult with milk allergy, child with egg allergy', [adult('a1', ['milk']), adult('a2'), child('c1', ['egg'])]],
    ['lactose, fish and nuts', [adult('a1', ['lactose']), adult('a2', ['fish']), child('c1', ['nuts', 'peanuts'])]],
    ['sesame, soy and celery', [adult('a1', ['sesame', 'soy']), child('c1', ['celery'])]],
  ]

  for (const [name, people] of households) {
    it(`over 200 weeks: ${name}`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const c = ctx(household(people), seed)
        const plan = generate(c)
        expectSafe(plan, c)
        // Leftovers are the same pot as the dinner.
        plan.days.forEach((day, i) => {
          const lunch = day.meals.lunch
          if (i > 0 && lunch.status === 'leftovers') expect(lunch.substitutions).toEqual(plan.days[i - 1].meals.dinner.substitutions)
        })
      }
    })
  }

  it('also after swapping, filling in again and starting over', () => {
    const people = [adult('a1', ['milk']), child('c1', ['gluten'])]
    for (let seed = 1; seed <= 50; seed++) {
      const c = ctx(household(people), seed)
      let plan = generate(c)
      for (let i = 0; i < 7; i++) {
        for (const slot of MEAL_SLOTS) plan = swapMeal(c, { plan, date: plan.days[i].date, slot }).plan
      }
      plan = skipMeal(c, { plan, date: plan.days[2].date, slot: 'dinner' }).plan
      plan = refillMeal(c, { plan, date: plan.days[2].date, slot: 'dinner' }).plan
      expectSafe(plan, c)
      expectSafe(generate(c, { existing: plan }), c)
    }
  })

  it('a new allergy in settings replaces the dishes that became unsafe', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const before = household([adult('a1'), child('c1')])
      const c = ctx(before, seed)
      const plan = generate(c)
      const after = household([adult('a1'), child('c1', ['gluten', 'milk'])])
      const adapted = adaptToSettings({ ...c, household: after }, before, [plan], MONDAY).plans[0]
      expectSafe(adapted, { ...c, household: after })
    }
  })

  it('a dish picked by hand despite the warning stays until the allergies change', () => {
    const h = household([adult('a1', ['fish'])])
    const c = ctx(h, 3)
    const plan = setMeal(c, { plan: generate(c), date: MONDAY, slot: 'dinner', recipeId: recipe('salmon-sweet-potato-broccoli').id }).plan
    const renamed = household([{ ...adult('a1', ['fish']), name: 'Anna' }])
    const adapted = adaptToSettings({ ...c, household: renamed }, h, [plan], MONDAY).plans[0]
    expect(adapted.days[0].meals.dinner.recipeId).toBe(recipe('salmon-sweet-potato-broccoli').id)
  })

  it('leaves the meal empty when no dish fits, and never relaxes the rule', () => {
    const everything = household([adult('a1', [...ALLERGENS])])
    const c = ctx(everything, 4)
    const plan = generate(c)
    expectSafe(plan, c)
    const emptyDinners = plan.days.filter((d, i) => i !== 4 && d.meals.dinner.status === 'none')
    if (emptyDinners.length > 0) expect(noSafeDish(c, emptyDinners[0].date, 'dinner')).toBe(true)
    expect(noSafeDish(ctx(household([adult('a1')])), MONDAY, 'dinner')).toBe(false)
  })

  it('does not suggest dishes with unlabelled ingredients while someone has allergies', () => {
    const own: Ingredient = { ...ingredients.get(ing('salt'))!, id: 'own', allergens: undefined, source: 'user' }
    const map = new Map([...ingredients, ['own', own]])
    const recipes = SEED_RECIPES.map((r) => (r.categoryIds.includes('dinner') ? { ...r, ingredients: [...r.ingredients, { ingredientId: 'own', amount: 1, unit: 'g' as const }] } : r))
    const c = ctx(household([adult('a1', ['sesame'])]), 5, { recipes, ingredients: map })
    const plan = generate(c)
    for (const day of plan.days) expect(day.meals.dinner.recipeId).toBeUndefined()
  })
})

describe('alternatives change protein and portions (#180)', () => {
  it('gluten-free pasta has less protein, so portions are recalculated', () => {
    const r = recipe('tuna-pasta-peas')
    const normal = recipeNutrition(r, ingredients).proteinG
    const glutenFree = recipeNutrition(withSubstitutions(r, { [ing('wholewheat-pasta')]: ing('gluten-free-pasta') }), ingredients).proteinG
    expect(glutenFree).toBeLessThan(normal)
    const h = household([adult('a1'), child('c1', ['gluten'])])
    const c = ctx(h, 6)
    const plan = setMeal(c, { plan: generate(c), date: MONDAY, slot: 'dinner', recipeId: r.id }).plan
    const dinner = plan.days[0].meals.dinner
    expect(dinner.substitutions).toEqual({ [ing('wholewheat-pasta')]: ing('gluten-free-pasta') })
    const plain = setMeal(ctx(household([adult('a1'), child('c1')]), 6), { plan: generate(c), date: MONDAY, slot: 'dinner', recipeId: r.id }).plan
    expect(dinner.portions.a1).toBeGreaterThanOrEqual(plain.days[0].meals.dinner.portions.a1)
    expect(weekdayOf(MONDAY)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Food someone doesn't tolerate (#181)
// ---------------------------------------------------------------------------

const intolerant = (person: Person, keys: string[]): Person => ({ ...person, notToleratedIngredientIds: keys.map(ing) })

/** Every dish on the plan, as cooked, holds nothing an eater doesn't tolerate – except lines left out of their portion. */
function expectTolerated(plan: WeekPlan, c: PlannerContext) {
  plan.days.forEach((day, i) => {
    for (const slot of MEAL_SLOTS) {
      const meal = day.meals[slot]
      if ((meal.status !== 'planned' && meal.status !== 'leftovers') || !meal.recipeId) continue
      const cooked = withSubstitutions(c.recipes.find((r) => r.id === meal.recipeId)!, meal.substitutions)
      const eaters = c.household.people.filter((p) => eatsMeal(p, meal.status === 'leftovers' ? 'dinner' : slot, i))
      for (const person of eaters) {
        for (const line of cooked.ingredients) {
          if (line.omittable) continue
          const ingredient = c.ingredients.get(line.ingredientId)!
          const parts = [ingredient.id, ...(ingredient.contains ?? [])]
          const hit = parts.filter((id) => (person.notToleratedIngredientIds ?? []).includes(id))
          expect(hit, `${day.date} ${slot} ${meal.recipeId} for ${person.id}`).toEqual([])
        }
      }
    }
  })
}

describe('blends say what they contain (#181)', () => {
  it('taco seasoning, tikka paste, curry powder and salsa contain chili; the mild ones do not', () => {
    for (const key of ['taco-seasoning', 'tikka-paste', 'curry-powder', 'salsa', 'gluten-free-taco-seasoning']) {
      expect(ingredients.get(ing(key))!.contains, key).toContain(ing('chili'))
    }
    for (const key of ['mild-taco-seasoning', 'mild-salsa']) expect(ingredients.get(ing(key))!.contains, key).not.toContain(ing('chili'))
    for (const i of SEED_INGREDIENTS) for (const id of i.contains ?? []) expect(ingredients.has(id), `${i.id} → ${id}`).toBe(true)
  })
})

describe('recipe safety with food someone does not tolerate (#181)', () => {
  const safety = (r: Recipe, people: Person[]) => recipeSafety(r, ingredients, blockedAt(household(people), 'dinner', 0))

  it('a line that can be left out is left out of that person only', () => {
    const s = safety(recipe('omelette-spinach-feta'), [intolerant(adult('y'), ['pepper']), adult('a')])
    expect(s.status).toBe('safe')
    expect(s.omissions).toEqual([{ ingredientId: ing('pepper'), personIds: ['y'] }])
    expect(s.substitutions).toEqual({})
  })

  it('a blend uses the milder alternative for everyone', () => {
    const s = safety(recipe('beef-tacos'), [intolerant(adult('y'), ['chili']), adult('a')])
    expect(s.status).toBe('safe')
    expect(s.substitutions).toEqual({ [ing('taco-seasoning')]: ing('mild-taco-seasoning'), [ing('salsa')]: ing('mild-salsa') })
  })

  it('a blend without an alternative makes the dish unsafe, naming the chosen ingredient', () => {
    const s = safety(recipe('chicken-tikka-rice'), [intolerant(adult('y'), ['chili'])])
    expect(s.status).toBe('unsafe')
    expect(s.intolerances).toEqual([{ ingredientId: ing('chili'), personIds: ['y'] }])
  })

  it('a line that is not marked "can be left out" stays strict', () => {
    // Garlic can be left out of the tuna pasta, but not of the tikka.
    expect(safety(recipe('tuna-pasta-peas'), [intolerant(adult('y'), ['garlic'])]).status).toBe('safe')
    expect(safety(recipe('chicken-tikka-rice'), [intolerant(adult('y'), ['garlic'])]).status).toBe('unsafe')
  })

  it('an alternative must fit both allergies and intolerances', () => {
    // Gluten allergy + chili: mild taco seasoning has gluten, gluten-free has chili.
    const s = safety(recipe('beef-tacos'), [intolerant(adult('y'), ['chili']), child('c', ['gluten'])])
    expect(s.status).toBe('unsafe')
    // Gluten allergy alone: gluten-free taco seasoning.
    expect(safety(recipe('beef-tacos'), [child('c', ['gluten'])]).substitutions[ing('taco-seasoning')]).toBe(ing('gluten-free-taco-seasoning'))
  })

  it('"can be left out" never applies to allergens', () => {
    const own: Ingredient = { ...ingredients.get(ing('honey'))!, allergens: ['nuts'] }
    const map = new Map([...ingredients, [own.id, own]])
    const s = recipeSafety(recipe('greek-yoghurt-walnuts'), map, blockedAt(household([adult('a', ['nuts'])]), 'breakfast', 0))
    expect(s.status).toBe('unsafe')
    expect(s.omissions).toEqual([])
  })

  it('only matters for meals the person eats', () => {
    const h = household([adult('a'), intolerant(child('c'), ['chili'])])
    expect(blockedAt(h, 'lunch', 0).ingredients.size).toBe(0)
    expect(blockedAt(h, 'dinner', 0).ingredients.has(ing('chili'))).toBe(true)
  })
})

describe('no dish with food someone does not tolerate ends up in the plan (#181)', () => {
  const households: Array<[string, Person[]]> = [
    ['adult who does not tolerate chili', [intolerant(adult('y'), ['chili']), adult('a2'), child('c1')]],
    ['onion and garlic', [intolerant(adult('y'), ['onion', 'garlic']), adult('a2')]],
    ['pepper and cinnamon for a child, chili + gluten allergy', [adult('a1'), intolerant(adult('y'), ['chili']), intolerant(child('c1', ['gluten']), ['pepper', 'cinnamon'])]],
  ]

  for (const [name, people] of households) {
    it(`over 200 weeks: ${name}`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const c = ctx(household(people), seed)
        const plan = generate(c)
        expectTolerated(plan, c)
        expectSafe(plan, c)
      }
    })
  }

  it('also after swapping and in settings changes', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const before = household([adult('y'), adult('a')])
      const c = ctx(before, seed)
      let plan = generate(c)
      const after = household([intolerant(adult('y'), ['chili', 'garlic']), adult('a')])
      const c2 = { ...c, household: after }
      plan = adaptToSettings(c2, before, [plan], MONDAY).plans[0]
      expectTolerated(plan, c2)
      for (let i = 0; i < 7; i++) for (const slot of MEAL_SLOTS) plan = swapMeal(c2, { plan, date: plan.days[i].date, slot }).plan
      expectTolerated(plan, c2)
    }
  })

  it('tacos are still suggested, with mild taco seasoning', () => {
    const c = ctx(household([intolerant(adult('y'), ['chili'])]), 7)
    const plan = setMeal(c, { plan: generate(c), date: MONDAY, slot: 'dinner', recipeId: recipe('beef-tacos').id }).plan
    expect(plan.days[0].meals.dinner.substitutions).toEqual({ [ing('taco-seasoning')]: ing('mild-taco-seasoning'), [ing('salsa')]: ing('mild-salsa') })
  })
})

describe('dislikes are a soft rule for adults too (#181)', () => {
  it('an adult who dislikes salmon rarely gets it', () => {
    let salmon = 0
    for (let seed = 1; seed <= 50; seed++) {
      const c = ctx(household([{ ...adult('a1'), dislikedIngredientIds: [ing('salmon')] }]), seed)
      salmon += generate(c).days.filter((d) => d.meals.dinner.recipeId === recipe('salmon-sweet-potato-broccoli').id).length
    }
    expect(salmon).toBe(0)
  })
})
