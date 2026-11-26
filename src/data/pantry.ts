/**
 * Home – what the household has at home (milestone 3D, #178, #194). Pure
 * functions, no storage access.
 *
 * - Home only lists what the household added or bought (#194 point 1).
 * - Items are typed freely, as on the shopping list; catalogue items are
 *   recognised, anything else is kept as free text (#194 point 4).
 * - Nothing leaves Home by itself (#194 point 5, 8): an item is "Have" until
 *   the user changes it or answers "Do you still have …?" (#145).
 * - "Empty" puts the item on the shopping list right away (#194 point 3).
 */
import { memoryKey, normalizeName, resolveEntry, splitEntries, wordSection, type SectionMemory } from './shopping-input'
import type { Id, Ingredient, PantryItem, ShoppingItem, StoreSection, Timestamp } from './types'

/** Groups for the "Categories" view on Home (#194 point 2). */
export const HOME_CATEGORIES = ['protein', 'produce', 'dairy', 'dryGoods', 'staples', 'other'] as const
export type HomeCategory = (typeof HOME_CATEGORIES)[number]

const fromSection = (section: StoreSection | undefined): HomeCategory =>
  section === 'meatFish' ? 'protein' : section === 'produce' ? 'produce' : section === 'dairy' ? 'dairy' : section === 'dryGoods' ? 'dryGoods' : 'other'

/**
 * The Home group of an item. Home mirrors where the item is kept (#195):
 * staples → "Staples"; anything from the dry goods shelf (rice, pasta, oats,
 * lentils, canned chickpeas and tomatoes …) → "Dry goods", also when it is a
 * protein source; otherwise a protein source (chicken, eggs, skyr …) →
 * "Protein"; fruit and vegetables; dairy; the rest "Other". Free-text items
 * are sorted with the built-in word list.
 */
export function homeCategory(ingredient: Ingredient | undefined, customName?: string): HomeCategory {
  if (!ingredient) return fromSection(customName ? wordSection(customName) : undefined)
  if (ingredient.isStaple) return 'staples'
  if (ingredient.storeSection === 'dryGoods') return 'dryGoods'
  if (ingredient.proteinSource) return 'protein'
  if (ingredient.storeSection === 'produce' || (ingredient.nutritionPer100g?.fruitVegPortions ?? 0) > 0) return 'produce'
  return fromSection(ingredient.storeSection)
}

/** Ingredient ids the household has at home – for "Use what we have at home first" (#177). */
export function atHomeIds(pantry: PantryItem[]): Set<Id> {
  return new Set(pantry.filter((p) => p.status === 'have' && p.ingredientId).map((p) => p.ingredientId!))
}

const sameThing = (item: PantryItem, ingredientId: Id | undefined, name: string) =>
  ingredientId ? item.ingredientId === ingredientId : !item.ingredientId && normalizeName(item.customName ?? '') === normalizeName(name)

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1)

export interface PantryAddResult {
  items: PantryItem[]
  /** New items. */
  added: PantryItem[]
  /** Items that were "Empty" and are now "Have" again. */
  restocked: PantryItem[]
  /** Items already at home: nothing changed. */
  duplicates: PantryItem[]
}

/**
 * Adds what the user typed as "Have" (#194 point 4): "kyllingfilet, ris, egg"
 * becomes three items. Amounts typed with them are ignored – Home has no
 * amounts (#145). An item marked "Empty" becomes "Have" again.
 */
export function addTypedToPantry(
  pantry: PantryItem[],
  text: string,
  options: { ingredients: Iterable<Ingredient>; now: Timestamp; newId: () => Id },
): PantryAddResult {
  let items = [...pantry]
  const added: PantryItem[] = []
  const restocked: PantryItem[] = []
  const duplicates: PantryItem[] = []
  const catalogue = [...options.ingredients]
  for (const entry of splitEntries(text)) {
    const resolved = resolveEntry(entry, catalogue)
    const ingredientId = resolved.ingredient?.id
    const existing = items.find((i) => sameThing(i, ingredientId, resolved.name))
    if (existing) {
      if (existing.status === 'empty') {
        const updated: PantryItem = { ...existing, status: 'have', updatedAt: options.now }
        items = items.map((i) => (i.id === existing.id ? updated : i))
        restocked.push(updated)
      } else if (!duplicates.includes(existing) && !added.includes(existing)) duplicates.push(existing)
      continue
    }
    const item: PantryItem = {
      id: options.newId(),
      ...(ingredientId ? { ingredientId } : { customName: capitalize(resolved.name) }),
      status: 'have',
      updatedAt: options.now,
    }
    items.push(item)
    added.push(item)
  }
  return { items, added, restocked, duplicates }
}

/** Adds or removes catalogue items from "Pick from the list" (#178): added as "Have". */
export function togglePantryIngredient(pantry: PantryItem[], ingredientId: Id, now: Timestamp, newId: () => Id): PantryItem[] {
  const existing = pantry.find((p) => p.ingredientId === ingredientId)
  if (existing) return pantry.filter((p) => p !== existing)
  return [...pantry, { id: newId(), ingredientId, status: 'have', updatedAt: now }]
}

/**
 * "Empty" puts the item on the shopping list (#194 point 3) – as the user's
 * own item, without an amount, so approving a week never replaces it. Nothing
 * is added if it is already on the list and not bought.
 */
export function addEmptyToShopping(
  list: ShoppingItem[],
  item: PantryItem,
  options: { memory?: SectionMemory; now: Timestamp; newId: () => Id },
): { items: ShoppingItem[]; added?: ShoppingItem } {
  const onList = list.some(
    (i) => !i.bought && (item.ingredientId ? i.ingredientId === item.ingredientId : !i.ingredientId && normalizeName(i.customName ?? '') === normalizeName(item.customName ?? '')),
  )
  if (onList) return { items: list }
  const added: ShoppingItem = {
    id: options.newId(),
    ...(item.ingredientId ? { ingredientId: item.ingredientId } : { customName: item.customName }),
    source: 'user',
    // Catalogue items follow their section (or the one the household moved them to); free text is sorted like typed items.
    ...(item.ingredientId
      ? {}
      : { storeSection: options.memory?.[memoryKey({ name: item.customName })] ?? wordSection(item.customName ?? '') ?? 'other' }),
    bought: false,
    fromEmpty: true,
    createdAt: options.now,
    updatedAt: options.now,
  }
  return { items: [...list, added], added }
}

/**
 * Switching an item from "Empty" back to "Have" (#195, replaces #194 d): the
 * user says they have it, so the item "Empty" put on the shopping list is
 * removed – unless it is already bought. Items the user or the plan added
 * are left alone.
 */
export function removeEmptyFromShopping(list: ShoppingItem[], item: PantryItem): { items: ShoppingItem[]; removed?: ShoppingItem } {
  const removed = list.find(
    (i) =>
      i.fromEmpty &&
      !i.bought &&
      (item.ingredientId ? i.ingredientId === item.ingredientId : !i.ingredientId && normalizeName(i.customName ?? '') === normalizeName(item.customName ?? '')),
  )
  return removed ? { items: list.filter((i) => i !== removed), removed } : { items: list }
}
