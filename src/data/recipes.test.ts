import { describe, expect, it } from 'vitest'
import { formatAmount, householdPortions, roundAmount } from './amounts'
import { gramsOf, recipeNutrition, recipeTags } from './nutrition'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { SEED_RECIPES } from './seed/recipes'
import type { Ingredient, Recipe } from './types'

const catalogue = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
const seed = (key: string): Recipe => {
  const recipe = SEED_RECIPES.find((r) => r.id === `seed-recipe-${key}`)
  if (!recipe) throw new Error(`No seed recipe ${key}`)
  return recipe
}

describe('seed data', () => {
  it('only references ingredients that exist, with known unit weights', () => {
    for (const recipe of SEED_RECIPES) {
      for (const line of recipe.ingredients) {
        const ingredient = catalogue.get(line.ingredientId)
        expect(ingredient, `${recipe.id} → ${line.ingredientId}`).toBeDefined()
        expect(gramsOf(line, ingredient), `${recipe.id} → ${line.ingredientId} ${line.unit}`).toBeDefined()
      }
    }
  })

  it('has every name and step in all three languages', () => {
    for (const item of [...SEED_RECIPES, ...SEED_INGREDIENTS]) {
      expect(Object.keys(item.name).sort()).toEqual(['de', 'en', 'nb'])
    }
    for (const step of SEED_RECIPES.flatMap((r) => r.steps)) expect(Object.keys(step).sort()).toEqual(['de', 'en', 'nb'])
  })

  it('contains no pork (excluded by default) and keeps dinners within 30 minutes', () => {
    for (const recipe of SEED_RECIPES) {
      expect(recipeTags(recipe, catalogue)).not.toContain('pork')
      if (recipe.categoryIds.includes('dinner')) expect(recipe.timeMinutes).toBeLessThanOrEqual(30)
    }
  })

  // Prototype protein values per portion (#11, #29): calculated values must be within ±3 g.
  const PROTOTYPE: Record<string, number> = {
    'greek-yoghurt-berries-nuts': 25,
    'scrambled-eggs-cottage-cheese': 28,
    'protein-pancakes-banana': 24,
    'overnight-oats-skyr': 26,
    'omelette-spinach-feta': 27,
    'chicken-tikka-rice': 42,
    'salmon-sweet-potato-broccoli': 38,
    'beef-tacos': 35,
    'chicken-stir-fry-noodles': 40,
    'lentil-chickpea-stew': 24,
    'turkey-burger-salad': 36,
    'tuna-pasta-peas': 34,
    'chicken-wrap-hummus': 32,
    'tuna-bowl-egg': 35,
  }
  it.each(Object.entries(PROTOTYPE))('%s has about %i g protein per portion', (key, expected) => {
    const nutrition = recipeNutrition(seed(key), catalogue)
    expect(nutrition.incomplete).toBe(false)
    expect(Math.abs(nutrition.proteinG - expected)).toBeLessThanOrEqual(3)
  })

  it('has protein-rich healthy snacks (at least 5 g)', () => {
    for (const recipe of SEED_RECIPES.filter((r) => r.snackKind === 'healthy')) {
      expect(recipeNutrition(recipe, catalogue).proteinG, recipe.id).toBeGreaterThanOrEqual(5)
    }
  })
})

describe('recipe nutrition', () => {
  const base = seed('boiled-eggs')

  it('calculates per portion from ingredient weights', () => {
    // 2 eggs × 60 g × 12.5 g/100 g = 15 g protein, 1 serving
    expect(recipeNutrition(base, catalogue).proteinG).toBeCloseTo(15)
    expect(recipeNutrition({ ...base, servings: 2 }, catalogue).proteinG).toBeCloseTo(7.5)
  })

  it('flags missing nutrition or unknown unit weights', () => {
    const egg = catalogue.get('seed-ingredient-egg') as Ingredient
    const withUnknown = new Map(catalogue).set('x', { ...egg, id: 'x', nutritionPer100g: undefined })
    const recipe = { ...base, ingredients: [...base.ingredients, { ingredientId: 'x', amount: 1, unit: 'g' as const }] }
    expect(recipeNutrition(recipe, withUnknown).incomplete).toBe(true)
    const unknownUnit = { ...base, ingredients: [{ ingredientId: 'seed-ingredient-salt', amount: 1, unit: 'can' as const }] }
    expect(recipeNutrition(unknownUnit, catalogue).incomplete).toBe(true)
  })

  it('inherits tags from ingredients', () => {
    expect(recipeTags(seed('tuna-pasta-peas'), catalogue)).toEqual(expect.arrayContaining(['fish', 'gluten', 'dairy']))
  })
})

describe('amounts (#83, #84)', () => {
  it('counts adults as 1 and children as ½ portion', () => {
    const person = (kind: 'adult' | 'child') => ({ id: kind, name: kind, kind, dislikedIngredientIds: [] })
    expect(householdPortions({ people: [person('adult'), person('adult'), person('child'), person('child')] })).toBe(3)
    expect(householdPortions({ people: [] })).toBe(0)
  })

  it('rounds pieces to halves, but eggs to whole', () => {
    expect(roundAmount(1.3, 'pcs')).toBe(1.5)
    expect(roundAmount(0.1, 'pcs')).toBe(0.5)
    expect(roundAmount(1.4, 'pcs', { wholeUnitsOnly: true })).toBe(1)
    expect(roundAmount(1.5, 'pcs', { wholeUnitsOnly: true })).toBe(2)
    expect(roundAmount(0.2, 'pcs', { wholeUnitsOnly: true })).toBe(1)
  })

  it('rounds grams to 5 or 10 and dl to one decimal', () => {
    expect(roundAmount(412.5, 'g')).toBe(410)
    expect(roundAmount(37, 'g')).toBe(35)
    expect(roundAmount(3.4, 'g')).toBe(3)
    expect(roundAmount(2.25, 'dl')).toBe(2.3)
  })

  it('formats halves and decimals per language', () => {
    expect(formatAmount(1.5, 'nb')).toBe('1½')
    expect(formatAmount(0.5, 'en')).toBe('½')
    expect(formatAmount(2.3, 'nb')).toBe('2,3')
    expect(formatAmount(2.3, 'en')).toBe('2.3')
    expect(formatAmount(410, 'de')).toBe('410')
  })
})
