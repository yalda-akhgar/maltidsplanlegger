/**
 * Data access layer.
 *
 * ALL reads and writes of app data go through this module, so the storage
 * backend can be swapped (localStorage now, Supabase in phase 5) without
 * touching the screens. Screens must never call localStorage directly.
 *
 * The data methods are async (return Promises) even though localStorage is
 * synchronous, so the screens won't need changes when a network database
 * replaces it.
 *
 * Note: the colour theme is stored by `next-themes` itself (key `mp:theme`),
 * because it must be applied before React renders to avoid a flash.
 */

import { DEFAULT_CATEGORIES, defaultHousehold } from './defaults'
import {
  LANGUAGES,
  type Category,
  type HouseholdSettings,
  type Id,
  type Ingredient,
  type Language,
  type PantryItem,
  type Recipe,
  type WeekId,
  type WeekPlan,
} from './types'

/** Bump when the stored format changes, and add a migration below (#73). */
export const SCHEMA_VERSION = 2

const PREFIX = 'mp:'

const KEYS = {
  schemaVersion: 'schemaVersion',
  household: 'household',
  categories: 'categories',
  ingredients: 'ingredients',
  recipes: 'recipes',
  weekPlans: 'weekPlans',
  pantry: 'pantry',
  installCardDismissed: 'installCardDismissed',
  language: 'language', // device preference (#74)
} as const

/** Minimal storage interface – localStorage in the app, in-memory in tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** localStorage that never throws (private mode, blocked site data …). */
function safeLocalStorage(): KeyValueStorage {
  const memory = new Map<string, string>()
  const ls = (): Storage | null => {
    try {
      return window.localStorage
    } catch {
      return null
    }
  }
  return {
    getItem: (key) => {
      try {
        return ls()?.getItem(key) ?? memory.get(key) ?? null
      } catch {
        return memory.get(key) ?? null
      }
    },
    setItem: (key, value) => {
      memory.set(key, value)
      try {
        ls()?.setItem(key, value)
      } catch {
        // Keep working for this session without persistence.
      }
    },
    removeItem: (key) => {
      memory.delete(key)
      try {
        ls()?.removeItem(key)
      } catch {
        // ignore
      }
    },
  }
}

/**
 * Random UUID v4. `crypto.randomUUID` only exists on HTTPS/localhost, so when
 * testing on a phone via the local network (plain http) we build one from
 * `crypto.getRandomValues`, which works everywhere.
 */
export function newId(): Id {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
const now = () => new Date().toISOString()

export function createRepository(storage: KeyValueStorage) {
  function read<T>(key: string, fallback: T): T {
    const raw = storage.getItem(PREFIX + key)
    if (raw === null) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }
  function write<T>(key: string, value: T): void {
    storage.setItem(PREFIX + key, JSON.stringify(value))
  }

  /** Create defaults on first run and migrate older stored data. */
  function ensureInitialized(): void {
    const version = read<number>(KEYS.schemaVersion, 0)
    if (version === SCHEMA_VERSION) return

    if (version === 0) {
      // Pre-v1 stored only the UI language (already under the device key).
      if (storage.getItem(PREFIX + KEYS.household) === null) write(KEYS.household, defaultHousehold())
      if (storage.getItem(PREFIX + KEYS.categories) === null) write(KEYS.categories, DEFAULT_CATEGORIES)
    }
    if (version === 1) {
      // v1 kept the language in the household; v2 keeps it per device (#74).
      const { language, ...household } = read<HouseholdSettings & { language?: string }>(
        KEYS.household,
        defaultHousehold(),
      )
      if (language && storage.getItem(PREFIX + KEYS.language) === null) write(KEYS.language, language)
      write(KEYS.household, household)
    }
    // Future migrations: if (version < 3) { … }

    write(KEYS.schemaVersion, SCHEMA_VERSION)
  }
  ensureInitialized()

  // Small helpers for collections stored as arrays of records with an id.
  const list = <T extends { id: Id }>(key: string) => read<T[]>(key, [])
  const upsert = <T extends { id: Id }>(key: string, item: T) => {
    const items = list<T>(key)
    const index = items.findIndex((i) => i.id === item.id)
    if (index === -1) items.push(item)
    else items[index] = item
    write(key, items)
    return item
  }
  const remove = (key: string, id: Id) => {
    write(
      key,
      list<{ id: Id }>(key).filter((i) => i.id !== id),
    )
  }

  return {
    // --- Household -------------------------------------------------------
    async getHousehold(): Promise<HouseholdSettings> {
      return read(KEYS.household, defaultHousehold())
    },
    async saveHousehold(household: HouseholdSettings): Promise<HouseholdSettings> {
      const saved = { ...household, updatedAt: now() }
      write(KEYS.household, saved)
      return saved
    },


    // --- Categories ------------------------------------------------------
    async listCategories(): Promise<Category[]> {
      return list<Category>(KEYS.categories).sort((a, b) => a.sortOrder - b.sortOrder)
    },
    async saveCategory(category: Category): Promise<Category> {
      return upsert(KEYS.categories, category)
    },

    // --- Ingredients -----------------------------------------------------
    async listIngredients(): Promise<Ingredient[]> {
      return list<Ingredient>(KEYS.ingredients)
    },
    async saveIngredient(ingredient: Ingredient): Promise<Ingredient> {
      return upsert(KEYS.ingredients, { ...ingredient, updatedAt: now() })
    },
    async deleteIngredient(id: Id): Promise<void> {
      remove(KEYS.ingredients, id)
    },

    // --- Recipes ---------------------------------------------------------
    async listRecipes(): Promise<Recipe[]> {
      return list<Recipe>(KEYS.recipes)
    },
    async getRecipe(id: Id): Promise<Recipe | undefined> {
      return list<Recipe>(KEYS.recipes).find((r) => r.id === id)
    },
    async saveRecipe(recipe: Recipe): Promise<Recipe> {
      return upsert(KEYS.recipes, { ...recipe, updatedAt: now() })
    },
    async deleteRecipe(id: Id): Promise<void> {
      remove(KEYS.recipes, id)
    },

    // --- Week plans ------------------------------------------------------
    async getWeekPlan(weekId: WeekId): Promise<WeekPlan | undefined> {
      return read<Record<WeekId, WeekPlan>>(KEYS.weekPlans, {})[weekId]
    },
    async saveWeekPlan(plan: WeekPlan): Promise<WeekPlan> {
      const plans = read<Record<WeekId, WeekPlan>>(KEYS.weekPlans, {})
      const saved = { ...plan, updatedAt: now() }
      plans[plan.weekId] = saved
      write(KEYS.weekPlans, plans)
      return saved
    },

    // --- Pantry (phase 3) ------------------------------------------------
    async listPantry(): Promise<PantryItem[]> {
      return list<PantryItem>(KEYS.pantry)
    },
    async savePantryItem(item: PantryItem): Promise<PantryItem> {
      return upsert(KEYS.pantry, { ...item, updatedAt: now() })
    },
    async deletePantryItem(id: Id): Promise<void> {
      remove(KEYS.pantry, id)
    },

    // --- Device preferences (not household data) ------------------------
    /**
     * UI language of this device/person (#74). Synchronous because it is
     * needed once at start-up before React renders.
     */
    getLanguageSync(): Language {
      const value = read<string>(KEYS.language, 'nb')
      return (LANGUAGES as readonly string[]).includes(value) ? (value as Language) : 'nb'
    },
    setLanguage(language: Language): void {
      write(KEYS.language, language)
    },
    isInstallCardDismissed(): boolean {
      return read(KEYS.installCardDismissed, false)
    },
    dismissInstallCard(): void {
      write(KEYS.installCardDismissed, true)
    },
  }
}

export type Repository = ReturnType<typeof createRepository>

/** The app-wide repository, backed by the browser's localStorage. */
export const repository = createRepository(safeLocalStorage())
