import { describe, expect, it } from 'vitest'
import { addEmptyToShopping, addTypedToPantry, atHomeIds, homeCategory, togglePantryIngredient } from './pantry'
import { SEED_INGREDIENTS } from './seed/ingredients'
import type { PantryItem, ShoppingItem } from './types'

const NOW = '2026-11-25T10:00:00.000Z'
const ing = (key: string) => `seed-ingredient-${key}`
const ingredients = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
let n = 0
const newId = () => `id-${++n}`
const pantryItem = (extra: Partial<PantryItem>): PantryItem => ({ id: newId(), status: 'have', updatedAt: NOW, ...extra })

describe('homeCategory (#194 point 2)', () => {
  it('groups catalogue items: protein, fruit and vegetables, dairy, staples, other', () => {
    expect(homeCategory(ingredients.get(ing('chicken-breast')))).toBe('protein')
    expect(homeCategory(ingredients.get(ing('skyr')))).toBe('protein') // a protein source, though it is dairy
    expect(homeCategory(ingredients.get(ing('bell-pepper')))).toBe('produce')
    expect(homeCategory(ingredients.get(ing('peas')))).toBe('produce') // frozen, but vegetables
    expect(homeCategory(ingredients.get(ing('grated-cheese')))).toBe('protein')
    expect(homeCategory(ingredients.get(ing('ice-cream')))).toBe('other')
    expect(homeCategory(ingredients.get(ing('olive-oil')))).toBe('staples')
  })
  it('groups free text with the word list', () => {
    expect(homeCategory(undefined, 'Melk')).toBe('dairy')
    expect(homeCategory(undefined, 'Laks')).toBe('protein')
    expect(homeCategory(undefined, 'Tannkrem')).toBe('other')
  })
})

describe('addTypedToPantry', () => {
  const add = (pantry: PantryItem[], text: string) => addTypedToPantry(pantry, text, { ingredients: SEED_INGREDIENTS, now: NOW, newId })

  it('adds typed items as "Have", catalogue or free text, without amounts', () => {
    const result = add([], 'kyllingfilet, 2 paprika, tannkrem')
    expect(result.added.map((i) => [i.ingredientId ?? i.customName, i.status])).toEqual([
      [ing('chicken-breast'), 'have'],
      [ing('bell-pepper'), 'have'],
      ['Tannkrem', 'have'],
    ])
  })

  it('sets an "Empty" item to "Have" again, and leaves items already at home', () => {
    const empty = pantryItem({ ingredientId: ing('egg'), status: 'empty' })
    const have = pantryItem({ customName: 'Tannkrem' })
    const result = add([empty, have], 'egg, tannkrem')
    expect(result.restocked).toEqual([{ ...empty, status: 'have', updatedAt: NOW }])
    expect(result.duplicates).toEqual([have])
    expect(result.added).toEqual([])
  })
})

describe('togglePantryIngredient ("Pick from the list")', () => {
  it('adds as "Have", and removes when tapped again', () => {
    const added = togglePantryIngredient([], ing('egg'), NOW, newId)
    expect(added).toMatchObject([{ ingredientId: ing('egg'), status: 'have' }])
    expect(togglePantryIngredient(added, ing('egg'), NOW, newId)).toEqual([])
  })
})

describe('atHomeIds', () => {
  it('lists catalogue items marked "Have"', () => {
    const ids = atHomeIds([pantryItem({ ingredientId: ing('egg') }), pantryItem({ ingredientId: ing('salmon'), status: 'empty' }), pantryItem({ customName: 'X' })])
    expect([...ids]).toEqual([ing('egg')])
  })
})

describe('addEmptyToShopping (#194 point 3)', () => {
  const opts = { now: NOW, newId }
  it('puts the item on the list as the user’s own, without an amount', () => {
    const { items, added } = addEmptyToShopping([], pantryItem({ ingredientId: ing('olive-oil'), status: 'empty' }), opts)
    expect(items).toEqual([added])
    expect(added).toMatchObject({ ingredientId: ing('olive-oil'), source: 'user', bought: false })
    expect(added?.amount).toBeUndefined()
    expect(added?.storeSection).toBeUndefined() // follows the ingredient's section
  })
  it('sorts free text, also with the household’s own sections', () => {
    expect(addEmptyToShopping([], pantryItem({ customName: 'Tannkrem' }), opts).added?.storeSection).toBe('household')
    expect(addEmptyToShopping([], pantryItem({ customName: 'Blomsterjord' }), { ...opts, memory: { 'n:blomsterjord': 'household' } }).added?.storeSection).toBe('household')
  })
  it('adds nothing when it is already on the list', () => {
    const onList: ShoppingItem = { id: 'x', ingredientId: ing('olive-oil'), source: 'plan', bought: false, createdAt: NOW, updatedAt: NOW }
    const result = addEmptyToShopping([onList], pantryItem({ ingredientId: ing('olive-oil') }), opts)
    expect(result.added).toBeUndefined()
    expect(result.items).toEqual([onList])
  })
})
