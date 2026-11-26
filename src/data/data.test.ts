import { describe, expect, it } from 'vitest'
import { localize } from './localize'
import { createRepository, deviceLanguage, newId, SCHEMA_VERSION, type KeyValueStorage, SEED_VERSION } from './repository'
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
  it('creates defaults on first run: nothing excluded (#188), 25/30/30/15 split, 4 categories', async () => {
    const repo = createRepository(memoryStorage())
    const household = await repo.getHousehold()
    expect(household.excludedTags).toEqual([])
    expect(household.excludedTerms).toEqual([])
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

  it('adds "no dinner at home" days (none) to a v2 household (#107)', async () => {
    const storage = memoryStorage({
      'mp:schemaVersion': '2',
      'mp:household': JSON.stringify({ people: [], excludedTags: ['pork'], cheatDays: [5] }),
    })
    const household = await createRepository(storage).getHousehold()
    expect(household.noDinnerAtHomeDays).toEqual([])
    expect(household.cheatDays).toEqual([5])
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
    const before = (await repo.listRecipes()).length
    await repo.saveRecipe(recipe)
    await repo.saveRecipe({ ...recipe, favorite: true })
    expect(await repo.listRecipes()).toHaveLength(before + 1)
    expect((await repo.getRecipe(recipe.id))?.favorite).toBe(true)
    await repo.deleteRecipe(recipe.id)
    expect(await repo.listRecipes()).toHaveLength(before)
  })

  it('survives corrupt stored data', async () => {
    const repo = createRepository(
      memoryStorage({ 'mp:schemaVersion': String(SCHEMA_VERSION), 'mp:seedVersion': String(SEED_VERSION), 'mp:recipes': '{not json' }),
    )
    expect(await repo.listRecipes()).toEqual([])
  })

  it('adds the seed recipes once and keeps deleted ones deleted', async () => {
    const storage = memoryStorage()
    const repo = createRepository(storage)
    const recipes = await repo.listRecipes()
    expect(recipes.filter((r) => !r.categoryIds.includes('snack'))).toHaveLength(14)
    expect(recipes.filter((r) => r.snackKind === 'healthy')).toHaveLength(10)
    expect(recipes.filter((r) => r.snackKind === 'cheat')).toHaveLength(3)
    await repo.deleteRecipe(recipes[0].id)
    const again = createRepository(storage)
    expect(await again.listRecipes()).toHaveLength(recipes.length - 1)
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

describe('deviceLanguage (#157)', () => {
  it("uses the phone's language when the app has it, otherwise English (#195)", () => {
    expect(deviceLanguage(['de-DE', 'en'])).toBe('de')
    expect(deviceLanguage(['nn-NO'])).toBe('nb')
    expect(deviceLanguage(['no'])).toBe('nb')
    expect(deviceLanguage(['fr-FR', 'en-GB'])).toBe('en')
    expect(deviceLanguage(['fr-FR'])).toBe('en')
    expect(deviceLanguage([])).toBe('en')
  })
})
