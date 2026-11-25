/**
 * The shopping list screen's rules (milestone 3C, #190). Pure functions, no
 * storage access, so they are easy to test.
 */
import { memoryKey, normalizeName, resolveEntry, splitEntries, type SectionMemory } from './shopping-input'
import { weekNeeds, type ShoppingNeed } from './shopping'
import type { PlannerContext } from './planner'
import { STORE_SECTIONS, type Id, type Ingredient, type ShoppingItem, type StoreSection, type Timestamp, type WeekApproval, type WeekId, type WeekPlan } from './types'
import { weekIdOf } from './week'

/** The section an item is shown in: its own, the household's choice, the ingredient's, or "Other". */
export function sectionOf(item: ShoppingItem, ingredients: ReadonlyMap<Id, Ingredient>, memory: SectionMemory = {}): StoreSection {
  if (item.storeSection) return item.storeSection
  const ingredient = item.ingredientId ? ingredients.get(item.ingredientId) : undefined
  if (ingredient) return memory[memoryKey({ ingredientId: ingredient.id })] ?? ingredient.storeSection
  return 'other'
}

/** Two items are the same thing: the same ingredient, or the same own name. */
function sameThing(item: ShoppingItem, ingredientId: Id | undefined, name: string): boolean {
  if (ingredientId) return item.ingredientId === ingredientId
  return !item.ingredientId && normalizeName(item.customName ?? '') === normalizeName(name)
}

/** First letter in upper case, so own items look like the rest of the list. */
const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1)

export interface AddResult {
  items: ShoppingItem[]
  added: ShoppingItem[]
  /** Items already on the list (not bought): nothing is added for them (#190 point 5). */
  duplicates: ShoppingItem[]
}

/**
 * Adds what the user typed (#190): "melk, couscous, vann" becomes three
 * items, each in its section. An item that is already on the list (and not
 * bought) is not added again.
 */
export function addTypedItems(
  list: ShoppingItem[],
  text: string,
  options: { ingredients: Iterable<Ingredient>; memory?: SectionMemory; now: Timestamp; newId: () => Id },
): AddResult {
  const items = [...list]
  const added: ShoppingItem[] = []
  const duplicates: ShoppingItem[] = []
  const catalogue = [...options.ingredients]
  for (const entry of splitEntries(text)) {
    const resolved = resolveEntry(entry, catalogue, options.memory)
    const ingredientId = resolved.ingredient?.id
    const existing = items.find((i) => !i.bought && sameThing(i, ingredientId, resolved.name))
    if (existing) {
      if (!duplicates.includes(existing) && !added.includes(existing)) duplicates.push(existing)
      continue
    }
    const item: ShoppingItem = {
      id: options.newId(),
      ...(ingredientId ? { ingredientId } : { customName: capitalize(resolved.name) }),
      ...(resolved.amount !== undefined && resolved.unit ? { amount: resolved.amount, unit: resolved.unit } : {}),
      source: 'user',
      storeSection: resolved.storeSection,
      bought: false,
      createdAt: options.now,
      updatedAt: options.now,
    }
    items.push(item)
    added.push(item)
  }
  return { items, added, duplicates }
}

/** Ticks an item off, or back on. */
export function setBought(list: ShoppingItem[], id: Id, bought: boolean, now: Timestamp, pantryBefore?: ShoppingItem['pantryBefore']): ShoppingItem[] {
  return list.map((i) => {
    if (i.id !== id) return i
    const { boughtAt: _boughtAt, pantryBefore: _pantryBefore, ...rest } = i
    return bought ? { ...rest, bought, boughtAt: now, ...(pantryBefore ? { pantryBefore } : {}), updatedAt: now } : { ...rest, bought, updatedAt: now }
  })
}

/** "Remove bought" (#190 point 7). */
export const clearBought = (list: ShoppingItem[]) => list.filter((i) => !i.bought)

/**
 * Bought items disappear by themselves once their week is over (#190 point
 * 7): the week they were added for, or – for own items – the week they were
 * bought in.
 */
export function dropFinishedBought(list: ShoppingItem[], currentWeek: WeekId): ShoppingItem[] {
  return list.filter((i) => {
    if (!i.bought) return true
    const week = i.weekId ?? (i.boughtAt ? weekIdOf(new Date(i.boughtAt)) : undefined)
    return week === undefined || week >= currentWeek
  })
}

/** The list grouped by store section in shop order, each section sorted by name. */
export function groupBySection<T>(items: T[], section: (item: T) => StoreSection, name: (item: T) => string, language: string) {
  return STORE_SECTIONS.map((s) => ({
    section: s,
    items: items.filter((i) => section(i) === s).sort((a, b) => name(a).localeCompare(name(b), language)),
  })).filter((g) => g.items.length > 0)
}

/** The text that "Share" sends (#190 point 8): sections with their items. */
export function shareText(title: string, groups: { title: string; lines: string[] }[]): string {
  return [title, ...groups.map((g) => [`\n${g.title}`, ...g.lines.map((l) => `• ${l}`)].join('\n'))].join('\n')
}

// ---------------------------------------------------------------------------
// The plan changed after approval (#184 point 5, #190 point 9)
// ---------------------------------------------------------------------------

/** How an item differs from the approved week. */
export type ItemChange = 'new' | 'amount'

export interface PlanChanges {
  /** Items the week needs now but didn't when it was approved. */
  added: number
  /** Items that are no longer needed. */
  removed: number
  /** Items whose amount changed (staples have no amount on the list, so they are left out). */
  changed: number
  /** Per item key (`ingredientId|unit`): what is new since the approval. */
  byKey: Map<string, ItemChange>
}

export const needKey = (item: { ingredientId: Id; unit: string }) => `${item.ingredientId}|${item.unit}`

/** Compares what the week needs now with the approved items. */
export function planChanges(needs: ShoppingNeed[], approval: WeekApproval): PlanChanges {
  const approved = new Map(approval.items.map((i) => [needKey(i), i]))
  const byKey = new Map<string, ItemChange>()
  let changed = 0
  for (const need of needs) {
    const before = approved.get(needKey(need))
    if (!before) byKey.set(needKey(need), 'new')
    else if (!need.isStaple && before.amount !== need.amount) {
      byKey.set(needKey(need), 'amount')
      changed++
    }
  }
  const now = new Set(needs.map(needKey))
  const removed = approval.items.filter((i) => !now.has(needKey(i))).length
  return { added: byKey.size - changed, removed, changed, byKey }
}

/** `planChanges` for a stored week: compared over the same days as the approval (#185 F). */
export function weekPlanChanges(ctx: PlannerContext, plan: WeekPlan, approval: WeekApproval, nextWeek?: WeekPlan): PlanChanges {
  return planChanges(weekNeeds(ctx, plan, { nextWeek, fromDate: approval.fromDate }), approval)
}
