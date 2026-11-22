/**
 * What a week plan needs from the shop (phase 3, milestone 3A, #173, #184,
 * #185). Pure functions – no storage access – so they are easy to test.
 *
 * Rules:
 * - Only meals the household eats (#183) and that are cooked: `planned`
 *   meals. Leftovers are cooked with the dinner they come from, so a dinner
 *   counts the portions for the next day's leftovers lunch too – also when
 *   that lunch is in the next week (#185 E).
 * - Eating out, removed meals and empty meals need nothing.
 * - Guests and personal portions count; safe alternatives (#180) replace the
 *   original ingredient.
 * - Lines left out of one person's portion (#181) are bought as for everyone
 *   (#185 C).
 * - Extras such as a protein boost are on the list (#185 D).
 * - With `fromDate`, days before it are left out: what was eaten is already
 *   bought (#185 F).
 * - The same ingredient in different units becomes one amount: pieces if the
 *   ingredient has a piece weight, otherwise grams (#185 A).
 * - Pieces, cans and packs are rounded up to whole ones; other units are
 *   rounded as in recipes (#185 B).
 * - Staples are included but flagged (`isStaple`): the approve sheet shows
 *   them in a closed section (#184 point 3).
 */
import { withSubstitutions } from './allergens'
import { roundAmount } from './amounts'
import { onlyMealsOn } from './meals'
import { gramsOf } from './nutrition'
import { dinnerPortionsToCook, type PlannerContext } from './planner'
import { totalPortions } from './protein'
import {
  MEAL_SLOTS,
  STORE_SECTIONS,
  type Id,
  type Ingredient,
  type IsoDate,
  type ItemChoice,
  type MealSlot,
  type PantryItem,
  type ShoppingItem,
  type StoreSection,
  type Timestamp,
  type Unit,
  type WeekApproval,
  type WeekId,
  type WeekPlan,
} from './types'

/** Where an item is used in the plan. `recipeId` is missing for extras. */
export interface ShoppingUse {
  date: IsoDate
  slot: MealSlot
  recipeId?: Id
}

/** One line of what the week needs. */
export interface ShoppingNeed {
  ingredientId: Id
  /** Rounded amount in `unit`, ready to show. */
  amount: number
  unit: Unit
  storeSection: StoreSection
  isStaple: boolean
  /** Every meal that uses the item, in plan order. */
  uses: ShoppingUse[]
}

export interface NeedsOptions {
  /** The week after `plan`, for leftovers of Sunday's dinner (#143). */
  nextWeek?: WeekPlan
  /** Leave out days before this date (#185 F). */
  fromDate?: IsoDate
}

/** Units that are bought whole: rounded up (#185 B). */
const WHOLE_UNITS: readonly Unit[] = ['pcs', 'can', 'pack']

/** Small slack so 2.0000001 pieces (floating point) doesn't become 3. */
const EPSILON = 1e-6

interface Line {
  amount: number
  unit: Unit
  use: ShoppingUse
}

/** Rounds an amount for the shopping list (#185 B). */
export function roundForShopping(amount: number, unit: Unit, ingredient?: Pick<Ingredient, 'wholeUnitsOnly'>): number {
  if (amount <= 0) return 0
  if (WHOLE_UNITS.includes(unit)) return Math.max(1, Math.ceil(amount - EPSILON))
  return roundAmount(amount, unit, ingredient)
}

/**
 * Merges the lines of one ingredient into one amount (#185 A). Returns one
 * entry, or one per unit when some unit's weight is unknown and the lines
 * can't be converted.
 */
function merge(lines: Line[], ingredient: Ingredient): { amount: number; unit: Unit; uses: ShoppingUse[] }[] {
  const units = new Set(lines.map((l) => l.unit))
  const uses = lines.map((l) => l.use)
  if (units.size === 1) return [{ amount: lines.reduce((s, l) => s + l.amount, 0), unit: lines[0].unit, uses }]

  const grams = lines.map((l) => gramsOf(l, ingredient))
  if (grams.some((g) => g === undefined)) {
    // Can't convert everything: one entry per unit (rare – only own ingredients without unit weights).
    return [...units].map((unit) => {
      const same = lines.filter((l) => l.unit === unit)
      return { amount: same.reduce((s, l) => s + l.amount, 0), unit, uses: same.map((l) => l.use) }
    })
  }
  const totalGrams = grams.reduce<number>((s, g) => s + (g ?? 0), 0)
  const pieceGrams = ingredient.gramsPerUnit.pcs
  if (pieceGrams) return [{ amount: totalGrams / pieceGrams, unit: 'pcs', uses }]
  return [{ amount: totalGrams, unit: 'g', uses }]
}

/** Every ingredient line the plan needs, before merging. */
function collectLines(ctx: PlannerContext, plan: WeekPlan, options: NeedsOptions): Map<Id, Line[]> {
  const lines = new Map<Id, Line[]>()
  const add = (ingredientId: Id, amount: number, unit: Unit, use: ShoppingUse) => {
    if (amount <= 0) return
    const list = lines.get(ingredientId) ?? []
    list.push({ amount, unit, use })
    lines.set(ingredientId, list)
  }

  for (const original of plan.days) {
    if (options.fromDate && original.date < options.fromDate) continue
    const day = onlyMealsOn(original, ctx.household)
    for (const slot of MEAL_SLOTS) {
      const meal = day.meals[slot]
      if (meal.status === 'planned' && meal.recipeId) {
        const recipe = ctx.recipes.find((r) => r.id === meal.recipeId)
        if (recipe) {
          const portions =
            slot === 'dinner' ? dinnerPortionsToCook(ctx, plan, day.date, options.nextWeek) : totalPortions(meal.portions, meal.guests)
          const cooked = withSubstitutions(recipe, meal.substitutions)
          const factor = portions / (cooked.servings || 1)
          for (const line of cooked.ingredients) {
            add(line.ingredientId, line.amount * factor, line.unit, { date: day.date, slot, recipeId: recipe.id })
          }
        }
      }
      for (const extra of meal.extras ?? []) add(extra.ingredientId, extra.amount, extra.unit, { date: day.date, slot })
    }
  }
  return lines
}

/**
 * What the week plan needs from the shop: one line per ingredient (or per
 * unit, see `merge`), sorted by store section in shop order.
 */
export function weekNeeds(ctx: PlannerContext, plan: WeekPlan, options: NeedsOptions = {}): ShoppingNeed[] {
  const needs: ShoppingNeed[] = []
  for (const [ingredientId, lines] of collectLines(ctx, plan, options)) {
    const ingredient = ctx.ingredients.get(ingredientId)
    if (!ingredient) continue // a deleted ingredient: nothing to buy
    for (const merged of merge(lines, ingredient)) {
      needs.push({
        ingredientId,
        amount: roundForShopping(merged.amount, merged.unit, ingredient),
        unit: merged.unit,
        storeSection: ingredient.storeSection,
        isStaple: ingredient.isStaple,
        uses: merged.uses,
      })
    }
  }
  const order = (s: StoreSection) => STORE_SECTIONS.indexOf(s)
  return needs.sort((a, b) => order(a.storeSection) - order(b.storeSection))
}

// ---------------------------------------------------------------------------
// Approving the week (milestone 3B, #173, #184, #186)
// ---------------------------------------------------------------------------

/** One item in the approve sheet. */
export interface ApprovalRow {
  need: ShoppingNeed
  choice: ItemChoice
  /** Home says the household has it (#178). */
  atHome: boolean
  /** Last week's plan used it too: "Do you still have …?" (#145, #186 point 3). */
  usedLastWeek: boolean
}

/** The ingredients (not staples) a week plan uses – for "Do you still have …?" the week after (#145). */
export function usedIngredients(ctx: PlannerContext, plan: WeekPlan, nextWeek?: WeekPlan): Set<Id> {
  return new Set(weekNeeds(ctx, plan, { nextWeek }).filter((n) => !n.isStaple).map((n) => n.ingredientId))
}

const itemKey = (item: { ingredientId: Id; unit: Unit }) => `${item.ingredientId}|${item.unit}`

/**
 * The items of the approve sheet and how each starts (#184 point 3–4, #186):
 * - shown again after approval: as the user left them (#186 point 8);
 * - staples: "Have", unless Home says they are empty;
 * - used last week: "Buy", with the question "Do you still have …?";
 * - at home: "Have"; everything else: "Buy".
 */
export function approvalRows(
  needs: ShoppingNeed[],
  options: { pantry?: PantryItem[]; usedLastWeek?: ReadonlySet<Id>; previous?: WeekApproval } = {},
): ApprovalRow[] {
  const status = new Map((options.pantry ?? []).filter((p) => p.ingredientId).map((p) => [p.ingredientId!, p.status]))
  const saved = new Map((options.previous?.items ?? []).map((i) => [itemKey(i), i.choice]))
  return needs.map((need) => {
    const atHome = status.get(need.ingredientId) === 'have'
    const usedLastWeek = !need.isStaple && (options.usedLastWeek?.has(need.ingredientId) ?? false)
    let choice: ItemChoice
    if (need.isStaple) choice = status.get(need.ingredientId) === 'empty' ? 'buy' : 'have'
    else if (usedLastWeek) choice = 'buy'
    else choice = atHome ? 'have' : 'buy'
    return { need, choice: saved.get(itemKey(need)) ?? choice, atHome, usedLastWeek }
  })
}

/** The approval to store for a week. */
export function toApproval(weekId: WeekId, fromDate: IsoDate, rows: ApprovalRow[], now: Timestamp): WeekApproval {
  return {
    weekId,
    approvedAt: now,
    fromDate,
    items: rows.map((r) => ({ ingredientId: r.need.ingredientId, amount: r.need.amount, unit: r.need.unit, choice: r.choice })),
  }
}

/**
 * Puts a week's "Buy" items on the shopping list (#173 point 3). Approving
 * the same week again replaces its earlier plan items that are not bought
 * yet; what was already bought for that week is subtracted. The user's own
 * items and other weeks are kept. Staples (oil, salt, spices) go on the
 * list without an amount – you buy a bottle, not 85 g (#187). Returns the
 * new list and how many items were added.
 */
export function applyApproval(
  list: ShoppingItem[],
  approval: WeekApproval,
  now: Timestamp,
  newId: () => Id,
  isStaple: (ingredientId: Id) => boolean = () => false,
): { items: ShoppingItem[]; added: number } {
  const ofWeek = (i: ShoppingItem) => i.source === 'plan' && i.weekId === approval.weekId
  const kept = list.filter((i) => !(ofWeek(i) && !i.bought))
  const bought = new Map<string, number>()
  const boughtIds = new Set(list.filter((i) => ofWeek(i) && i.bought && i.ingredientId).map((i) => i.ingredientId!))
  for (const i of list) {
    if (ofWeek(i) && i.bought && i.ingredientId && i.unit) {
      const key = itemKey({ ingredientId: i.ingredientId, unit: i.unit })
      bought.set(key, (bought.get(key) ?? 0) + (i.amount ?? 0))
    }
  }
  const added: ShoppingItem[] = []
  for (const item of approval.items) {
    if (item.choice !== 'buy') continue
    if (isStaple(item.ingredientId)) {
      // Without an amount, and only once: a staple already bought for the week isn't added again.
      if (boughtIds.has(item.ingredientId)) continue
      added.push({ id: newId(), ingredientId: item.ingredientId, weekId: approval.weekId, source: 'plan', bought: false, createdAt: now, updatedAt: now })
      continue
    }
    const amount = item.amount - (bought.get(itemKey(item)) ?? 0)
    if (amount <= 0) continue
    added.push({
      id: newId(),
      ingredientId: item.ingredientId,
      amount: roundForShopping(amount, item.unit),
      unit: item.unit,
      weekId: approval.weekId,
      source: 'plan',
      bought: false,
      createdAt: now,
      updatedAt: now,
    })
  }
  return { items: [...kept, ...added], added: added.length }
}

/** Items chosen as "Buy" (the count on the approve button). */
export const buyCount = (rows: Pick<ApprovalRow, 'choice'>[]) => rows.filter((r) => r.choice === 'buy').length
