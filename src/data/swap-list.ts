/**
 * Swapping a dish after the week is approved (milestone 3E, #173 point 6,
 * #197). Pure functions – no storage access – so they are easy to test.
 *
 * The sheet compares what the week needed before and after the change (over
 * the approval's days, #185 F) and shows:
 * - "New on the list": what the week needs more of. Each item has "Have" /
 *   "Buy"; an item already on the list as "Buy" just gets the extra amount.
 * - "Off the list": what the week needs less of and is still on the list, not
 *   bought. Each item can be kept ("Keep").
 * - "Already bought": what the week no longer needs but was bought.
 * Items with the user's own amount are never changed (#191, #192).
 */
import { applyApproval, roundForShopping, type ShoppingNeed } from './shopping'
import { needKey } from './shopping-list'
import type { Id, ItemChoice, PantryItem, ShoppingItem, Timestamp, Unit, WeekApproval } from './types'

export interface SwapAddRow {
  key: string
  ingredientId: Id
  unit: Unit
  /** The extra amount the week needs. */
  amount: number
  isStaple: boolean
  choice: ItemChoice
  /** Home says the household has it (#178). */
  atHome: boolean
  /** Already on the list as "Buy": only the amount grows, no choice. */
  alreadyBuying: boolean
}

export interface SwapRemoveRow {
  key: string
  ingredientId: Id
  unit: Unit
  /** How much comes off the list (missing for staples, which have no amount). */
  amount?: number
  isStaple: boolean
  /** "Keep": the item stays on the list as the user's own amount. */
  keep: boolean
}

export interface SwapBoughtRow {
  key: string
  ingredientId: Id
  unit: Unit
  amount: number
}

export interface SwapListChange {
  add: SwapAddRow[]
  remove: SwapRemoveRow[]
  bought: SwapBoughtRow[]
}

export const isEmptyChange = (change: SwapListChange) => change.add.length + change.remove.length + change.bought.length === 0

/** Open (not bought) plan items of the approved week, without the user's own amount. */
const openPlanItems = (list: ShoppingItem[], approval: WeekApproval) =>
  list.filter((i) => i.source === 'plan' && i.weekId === approval.weekId && !i.bought && i.planAmount === undefined && i.ingredientId)

const boughtPlanItems = (list: ShoppingItem[], approval: WeekApproval) =>
  list.filter((i) => i.source === 'plan' && i.weekId === approval.weekId && i.bought && i.ingredientId)

const editedPlanItems = (list: ShoppingItem[], approval: WeekApproval) =>
  list.filter((i) => i.source === 'plan' && i.weekId === approval.weekId && !i.bought && i.planAmount !== undefined)

const sumBy = (items: ShoppingItem[], key: string) =>
  items.filter((i) => needKey({ ingredientId: i.ingredientId!, unit: i.unit ?? '' }) === key).reduce((n, i) => n + (i.amount ?? 0), 0)

/** What a change to the plan does to the shopping list of an approved week. */
export function swapListChange(
  before: ShoppingNeed[],
  after: ShoppingNeed[],
  approval: WeekApproval,
  list: ShoppingItem[],
  pantry: PantryItem[] = [],
): SwapListChange {
  const beforeByKey = new Map(before.map((n) => [needKey(n), n]))
  const afterByKey = new Map(after.map((n) => [needKey(n), n]))
  const approved = new Map(approval.items.map((i) => [needKey(i), i]))
  const status = new Map(pantry.filter((p) => p.ingredientId).map((p) => [p.ingredientId!, p.status]))
  const open = openPlanItems(list, approval)
  const bought = boughtPlanItems(list, approval)
  const edited = new Set(editedPlanItems(list, approval).map((i) => i.ingredientId))
  const change: SwapListChange = { add: [], remove: [], bought: [] }

  for (const key of new Set([...beforeByKey.keys(), ...afterByKey.keys()])) {
    const was = beforeByKey.get(key)
    const now = afterByKey.get(key)
    const need = (now ?? was)!
    const diff = (now?.amount ?? 0) - (was?.amount ?? 0)
    const saved = approved.get(key)
    // The user's own amount is never lowered by the app; more from the plan is added with a note (#191, #192).
    if (edited.has(need.ingredientId)) {
      if (diff > 0 && !need.isStaple) change.add.push({ key, ingredientId: need.ingredientId, unit: need.unit, amount: diff, isStaple: false, choice: 'buy', atHome: false, alreadyBuying: true })
      continue
    }

    if (need.isStaple) {
      // Staples have no amount on the list (#187): only a new or a dropped staple matters.
      if (now && !was && !saved) {
        change.add.push({ key, ingredientId: need.ingredientId, unit: need.unit, amount: 0, isStaple: true, choice: status.get(need.ingredientId) === 'empty' ? 'buy' : 'have', atHome: status.get(need.ingredientId) === 'have', alreadyBuying: false })
      } else if (was && !now && saved?.choice === 'buy' && open.some((i) => i.ingredientId === need.ingredientId)) {
        change.remove.push({ key, ingredientId: need.ingredientId, unit: need.unit, isStaple: true, keep: false })
      }
      continue
    }

    if (diff > 0) {
      const atHome = status.get(need.ingredientId) === 'have'
      if (saved?.choice === 'buy') {
        change.add.push({ key, ingredientId: need.ingredientId, unit: need.unit, amount: diff, isStaple: false, choice: 'buy', atHome, alreadyBuying: true })
      } else {
        const choice: ItemChoice = saved?.choice === 'have' || atHome ? 'have' : 'buy'
        change.add.push({ key, ingredientId: need.ingredientId, unit: need.unit, amount: diff, isStaple: false, choice, atHome, alreadyBuying: false })
      }
    } else if (diff < 0 && saved?.choice === 'buy') {
      // Only what is still on the list comes off; an amount used elsewhere in the week stays (#173 point 6).
      const onList = sumBy(open, key)
      const off = roundForShopping(Math.min(onList, -diff), need.unit)
      if (off > 0) change.remove.push({ key, ingredientId: need.ingredientId, unit: need.unit, amount: off, isStaple: false, keep: false })
      const left = -diff - Math.min(onList, -diff)
      const boughtAmount = sumBy(bought, key)
      if (left > 0 && boughtAmount > 0) change.bought.push({ key, ingredientId: need.ingredientId, unit: need.unit, amount: roundForShopping(Math.min(left, boughtAmount), need.unit) })
    }
  }
  return change
}

/** What ↶ needs to put the list back as it was before the sheet (#197, choice 6a). */
export interface ListUndo {
  approval: WeekApproval
  /** The week's plan items for the changed ingredients, as they were before. */
  before: ShoppingItem[]
  /** Ids of those items after the change. */
  afterIds: Id[]
}

/**
 * Applies the sheet: the approval follows the change (so the banner "The plan
 * has changed" doesn't show for it), and the list changes only for the
 * ingredients in the change. Items marked "Keep" stay as the user's own
 * amount – with "No longer needed in the plan" when the plan doesn't use them
 * any more (#192).
 */
export function applySwapChange(
  list: ShoppingItem[],
  approval: WeekApproval,
  change: SwapListChange,
  before: ShoppingNeed[],
  after: ShoppingNeed[],
  now: Timestamp,
  newId: () => Id,
  isStaple: (ingredientId: Id) => boolean = () => false,
): { items: ShoppingItem[]; approval: WeekApproval; undo: ListUndo } {
  const beforeByKey = new Map(before.map((n) => [needKey(n), n]))
  const afterByKey = new Map(after.map((n) => [needKey(n), n]))
  const choices = new Map(change.add.map((r) => [r.key, r.choice]))
  const items = new Map(approval.items.map((i) => [needKey(i), i]))
  // Every item whose need changed – also those without a row (at home, or the user's own amount).
  const keys = new Set([...beforeByKey.keys(), ...afterByKey.keys()].filter((k) => beforeByKey.get(k)?.amount !== afterByKey.get(k)?.amount))
  for (const key of keys) {
    const was = beforeByKey.get(key)
    const nowNeed = afterByKey.get(key)
    const saved = items.get(key)
    const need = (nowNeed ?? was)!
    const amount = (saved?.amount ?? 0) + (nowNeed?.amount ?? 0) - (was?.amount ?? 0)
    if (!nowNeed || amount <= 0) {
      items.delete(key)
      continue
    }
    items.set(key, { ingredientId: need.ingredientId, unit: need.unit, amount: need.isStaple ? nowNeed.amount : amount, choice: choices.get(key) ?? saved?.choice ?? 'buy' })
  }
  const updated: WeekApproval = { ...approval, items: [...items.values()] }

  const touched = new Set([...keys].map((k) => k.slice(0, k.lastIndexOf('|'))))
  const isTouched = (i: ShoppingItem) => i.source === 'plan' && i.weekId === approval.weekId && i.ingredientId !== undefined && touched.has(i.ingredientId)
  const applied = applyApproval(list, updated, now, newId, isStaple).items.filter(isTouched)

  // "Keep": the item as it was, now the user's own amount (#191), so later updates don't remove it.
  const kept = change.remove.filter((r) => r.keep)
  const keptKey = (i: ShoppingItem) => kept.some((r) => r.ingredientId === i.ingredientId && (r.isStaple || r.unit === i.unit))
  const keptItems = list
    .filter((i) => isTouched(i) && !i.bought && i.planAmount === undefined && keptKey(i))
    .map((i): ShoppingItem => {
      if (isStaple(i.ingredientId!)) return { ...i, source: 'user', updatedAt: now }
      const planItem = updated.items.find((a) => a.ingredientId === i.ingredientId && a.unit === i.unit && a.choice === 'buy')
      const boughtAmount = sumBy(boughtPlanItems(list, approval), needKey({ ingredientId: i.ingredientId!, unit: i.unit ?? '' }))
      return {
        ...i,
        planAmount: { amount: Math.max((planItem?.amount ?? 0) - boughtAmount, 0), unit: i.unit! },
        ...(planItem ? {} : { notInPlan: true as const }),
        updatedAt: now,
      }
    })
  const fresh = applied.filter((i) => i.bought || !keptKey(i))
  const result = [...list.filter((i) => !isTouched(i)), ...fresh, ...keptItems]
  return {
    items: result,
    approval: updated,
    undo: { approval, before: list.filter(isTouched), afterIds: [...fresh, ...keptItems].map((i) => i.id) },
  }
}

/**
 * ↶ after the sheet: the list as it was, except what was bought in between –
 * that stays (#197, choice 6a).
 */
export function revertListUndo(list: ShoppingItem[], undo: ListUndo): ShoppingItem[] {
  const afterIds = new Set(undo.afterIds)
  const wasBought = new Set(undo.before.filter((i) => i.bought).map((i) => i.id))
  // Ingredients ticked off since the sheet: their old open items don't come back (they are bought now).
  const boughtSince = new Set(list.filter((i) => afterIds.has(i.id) && i.bought && !wasBought.has(i.id)).map((i) => i.ingredientId))
  const rest = list.filter((i) => !(afterIds.has(i.id) && !i.bought))
  const present = new Set(rest.map((i) => i.id))
  const back = undo.before.filter((i) => !present.has(i.id) && !(boughtSince.has(i.ingredientId) && !i.bought))
  return [...rest, ...back]
}
