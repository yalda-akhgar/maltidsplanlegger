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
import { SEED_INGREDIENTS } from './seed/ingredients'
import { SEED_RECIPES } from './seed/recipes'
import type { SectionMemory } from './shopping-input'
import {
  LANGUAGES,
  type Category,
  type HouseholdSettings,
  type Id,
  type Ingredient,
  type Language,
  type PantryItem,
  type Recipe,
  type ShoppingItem,
  type WeekApproval,
  type WeekId,
  type WeekPlan,
} from './types'

/** Bump when the stored format changes, and add a migration below (#73). */
export const SCHEMA_VERSION = 5

/** Bump when new seed recipes/ingredients should be added to existing installs. */
export const SEED_VERSION = 3 // v2: allergens + safe alternatives (#180) · v3: blend contents, single spices, milder alternatives, "can be left out" (#181)

const PREFIX = 'mp:'

const KEYS = {
  schemaVersion: 'schemaVersion',
  seedVersion: 'seedVersion',
  household: 'household',
  categories: 'categories',
  ingredients: 'ingredients',
  recipes: 'recipes',
  weekPlans: 'weekPlans',
  pantry: 'pantry',
  /** Approved weeks (#173, #186): Record<WeekId, WeekApproval>. */
  approvals: 'approvals',
  shoppingList: 'shoppingList',
  /** Store sections the household chose by moving an item (#190): SectionMemory. */
  shopSections: 'shopSections',
  boughtSectionOpen: 'boughtSectionOpen', // device preference (#190)
  listViews: 'listViews', // device preference: "List | Categories" per screen (#194)
  installCardDismissed: 'installCardDismissed',
  language: 'language', // device preference (#74)
  proteinAlerts: 'proteinAlerts', // device preference (#128)
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
    if (version >= 1 && version < 3) {
      // v3 adds fixed days without dinner at home; none by default (#107).
      const household = read<HouseholdSettings>(KEYS.household, defaultHousehold())
      write(KEYS.household, { ...household, noDinnerAtHomeDays: household.noDinnerAtHomeDays ?? [] })
    }
    // v4 adds optional extras on meals (#120): no stored data changes.
    // v5 adds the optional automatic week plan setting (#164): no stored data changes.
    // Future migrations: if (version < 6) { … }

    write(KEYS.schemaVersion, SCHEMA_VERSION)
  }
  ensureInitialized()

  /**
   * Adds the seed ingredients and recipes once (#11, #76). Records that
   * already exist are left alone, so user edits are kept, and a deleted seed
   * recipe does not come back (#78).
   */
  function ensureSeeded(): void {
    if (read<number>(KEYS.seedVersion, 0) >= SEED_VERSION) return
    for (const [key, seeds] of [
      [KEYS.ingredients, SEED_INGREDIENTS],
      [KEYS.recipes, SEED_RECIPES],
    ] as const) {
      const existing = read<{ id: Id }[]>(key, [])
      const ids = new Set(existing.map((r) => r.id))
      write(key, [...existing, ...seeds.filter((s) => !ids.has(s.id))])
    }
    // v2 (#180): seed ingredients stored before allergens existed get their labels.
    // v3 (#181): … and what blends contain.
    const seedById = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
    write(
      KEYS.ingredients,
      read<Ingredient[]>(KEYS.ingredients, []).map((i) => {
        const seed = seedById.get(i.id)
        if (!seed) return i
        let next = i
        if (next.allergens === undefined) next = { ...next, allergens: seed.allergens, ...(seed.alternativeFor ? { alternativeFor: seed.alternativeFor } : {}) }
        if (next.contains === undefined && seed.contains) next = { ...next, contains: seed.contains }
        return next
      }),
    )
    // v3 (#181): stored seed recipes get "can be left out" on the same lines as the seed.
    const seedRecipes = new Map(SEED_RECIPES.map((r) => [r.id, r]))
    write(
      KEYS.recipes,
      read<Recipe[]>(KEYS.recipes, []).map((r) => {
        const omittable = new Set(seedRecipes.get(r.id)?.ingredients.filter((l) => l.omittable).map((l) => l.ingredientId))
        if (omittable.size === 0) return r
        return { ...r, ingredients: r.ingredients.map((l) => (l.omittable === undefined && omittable.has(l.ingredientId) ? { ...l, omittable: true } : l)) }
      }),
    )
    write(KEYS.seedVersion, SEED_VERSION)
  }
  ensureSeeded()

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
    /** All stored week plans, oldest first. */
    async listWeekPlans(): Promise<WeekPlan[]> {
      return Object.values(read<Record<WeekId, WeekPlan>>(KEYS.weekPlans, {})).sort((a, b) => a.weekId.localeCompare(b.weekId))
    },
    async saveWeekPlan(plan: WeekPlan): Promise<WeekPlan> {
      const plans = read<Record<WeekId, WeekPlan>>(KEYS.weekPlans, {})
      const saved = { ...plan, updatedAt: now() }
      plans[plan.weekId] = saved
      write(KEYS.weekPlans, plans)
      return saved
    },

    // --- Approved weeks and the shopping list (phase 3) -------------------
    async getApproval(weekId: WeekId): Promise<WeekApproval | undefined> {
      return read<Record<WeekId, WeekApproval>>(KEYS.approvals, {})[weekId]
    },
    async saveApproval(approval: WeekApproval): Promise<WeekApproval> {
      const approvals = read<Record<WeekId, WeekApproval>>(KEYS.approvals, {})
      approvals[approval.weekId] = approval
      write(KEYS.approvals, approvals)
      return approval
    },
    async listShoppingItems(): Promise<ShoppingItem[]> {
      return list<ShoppingItem>(KEYS.shoppingList)
    },
    /** Replaces the whole shopping list (it is small, and approving changes many lines at once). */
    async saveShoppingItems(items: ShoppingItem[]): Promise<ShoppingItem[]> {
      write(KEYS.shoppingList, items)
      return items
    },

    /** Sections the household chose by moving an item; used the next time (#190). */
    async getSectionMemory(): Promise<SectionMemory> {
      return read<SectionMemory>(KEYS.shopSections, {})
    },
    async saveSectionMemory(memory: SectionMemory): Promise<SectionMemory> {
      write(KEYS.shopSections, memory)
      return memory
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
    /** Replaces the whole Home list (several items change at once when typing or picking). */
    async savePantry(items: PantryItem[]): Promise<PantryItem[]> {
      write(KEYS.pantry, items)
      return items
    },

    // --- Device preferences (not household data) ------------------------
    /**
     * UI language of this device/person (#74). Synchronous because it is
     * needed once at start-up before React renders.
     */
    getLanguageSync(): Language {
      const value = read<string>(KEYS.language, '')
      if ((LANGUAGES as readonly string[]).includes(value)) return value as Language
      return deviceLanguage()
    },
    setLanguage(language: Language): void {
      write(KEYS.language, language)
    },
    /** "Show protein alerts" on this device (#116, #128). Default on. */
    getProteinAlertsSync(): boolean {
      return read<boolean>(KEYS.proteinAlerts, true) !== false
    },
    setProteinAlerts(on: boolean): void {
      write(KEYS.proteinAlerts, on)
    },
    /** "List" (alphabetical, the default) or "Categories" on a screen; remembered per screen on this device (#194). */
    getListView(screen: 'shopping' | 'pantry'): 'list' | 'categories' {
      return read<Record<string, string>>(KEYS.listViews, {})[screen] === 'categories' ? 'categories' : 'list'
    },
    setListView(screen: 'shopping' | 'pantry', view: 'list' | 'categories'): void {
      write(KEYS.listViews, { ...read<Record<string, string>>(KEYS.listViews, {}), [screen]: view })
    },
    /** Whether the "Bought" section of the shopping list is open on this device (#190). Default closed. */
    isBoughtSectionOpen(): boolean {
      return read<boolean>(KEYS.boughtSectionOpen, false) === true
    },
    setBoughtSectionOpen(open: boolean): void {
      write(KEYS.boughtSectionOpen, open)
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

/**
 * The phone's language if the app has it, otherwise Norwegian (#157).
 * Norwegian Bokmål, Nynorsk and plain "no" all map to nb.
 */
export function deviceLanguage(languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): Language {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'nb' || base === 'nn' || base === 'no') return 'nb'
    if ((LANGUAGES as readonly string[]).includes(base)) return base as Language
  }
  return 'nb'
}

/** The app-wide repository, backed by the browser's localStorage. */
export const repository = createRepository(safeLocalStorage())
