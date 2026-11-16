import { describe, expect, it } from 'vitest'
import { localize } from './localize'
import { createRepository, newId, SCHEMA_VERSION, type KeyValueStorage } from './repository'
import type { Recipe } from './types'
import { datesOfWeek, shiftWeek, weekIdOf } from './week'

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('repository', () => {
  it('creates defaults on first run: pork excluded, 25/30/30/15 split, 4 categories', async () => {
    const repo = createRepository(memoryStorage())
    const household = await repo.getHousehold()
    expect(household.excludedTags).toEqual(['pork'])
    expect(household.proteinSplit).toEqual({ breakfast: 25, lunch: 30, dinner: 30, snack: 15 })
    expect(household.people).toEqual([])
    expect(household.onboardingDone).toBe(false)
    expect((await repo.listCategories()).map((c) => c.id)).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
  })

  it('keeps the pre-v1 language setting as a device preference', async () => {
    const storage = memoryStorage({ 'mp:language': '"de"' })
    const repo = createRepository(storage)
    expect(repo.getLanguageSync()).toBe('de')
    expect(storage.data.get('mp:schemaVersion')).toBe(String(SCHEMA_VERSION))
  })

  it('moves the v1 household language to the device (#74)', async () => {
    const storage = memoryStorage({
      'mp:schemaVersion': '1',
      'mp:household': JSON.stringify({ people: [], excludedTags: ['pork'], language: 'en' }),
    })
    const repo = createRepository(storage)
    expect(repo.getLanguageSync()).toBe('en')
    expect('language' in (await repo.getHousehold())).toBe(false)
  })

  it('stores the language per device, outside the household', async () => {
    const repo = createRepository(memoryStorage())
    repo.setLanguage('de')
    expect(repo.getLanguageSync()).toBe('de')
  })

  it('saves, updates and deletes recipes', async () => {
    const repo = createRepository(memoryStorage())
    const recipe: Recipe = {
      id: newId(),
      name: { nb: 'Test' },
      categoryIds: ['dinner'],
      timeMinutes: 20,
      servings: 4,
      ingredients: [],
      steps: [],
      tags: [],
      kidFriendly: true,
      favorite: false,
      source: 'user',
      createdAt: '2026-11-16T00:00:00.000Z',
      updatedAt: '2026-11-16T00:00:00.000Z',
    }
    await repo.saveRecipe(recipe)
    await repo.saveRecipe({ ...recipe, favorite: true })
    expect(await repo.listRecipes()).toHaveLength(1)
    expect((await repo.getRecipe(recipe.id))?.favorite).toBe(true)
    await repo.deleteRecipe(recipe.id)
    expect(await repo.listRecipes()).toHaveLength(0)
  })

  it('survives corrupt stored data', async () => {
    const repo = createRepository(memoryStorage({ 'mp:schemaVersion': '1', 'mp:recipes': '{not json' }))
    expect(await repo.listRecipes()).toEqual([])
  })
})

describe('newId', () => {
  it('returns unique UUIDs', () => {
    const ids = new Set(Array.from({ length: 100 }, newId))
    expect(ids.size).toBe(100)
    expect([...ids][0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })
})

describe('week helpers (ISO weeks, Monday first)', () => {
  it('gives the ISO week id of a date', () => {
    expect(weekIdOf(new Date(2026, 10, 16))).toBe('2026-W47') // Monday 16 Nov 2026
    expect(weekIdOf(new Date(2026, 10, 22))).toBe('2026-W47') // Sunday 22 Nov 2026
    expect(weekIdOf(new Date(2027, 0, 1))).toBe('2026-W53') // belongs to last week of 2026
  })

  it('lists Monday to Sunday of a week', () => {
    expect(datesOfWeek('2026-W47')).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ])
  })

  it('moves between weeks, across year boundaries', () => {
    expect(shiftWeek('2026-W47', 1)).toBe('2026-W48')
    expect(shiftWeek('2026-W47', -1)).toBe('2026-W46')
    expect(shiftWeek('2026-W53', 1)).toBe('2027-W01')
  })
})

describe('localize', () => {
  it('uses the wanted language, then Norwegian, then any available', () => {
    expect(localize({ nb: 'Middag', de: 'Abendessen' }, 'de')).toBe('Abendessen')
    expect(localize({ nb: 'Middag' }, 'en')).toBe('Middag')
    expect(localize({ en: 'Only English' }, 'de')).toBe('Only English')
    expect(localize(undefined, 'nb')).toBe('')
  })
})
