import { describe, expect, it } from 'vitest'
import { applyApproval, type ShoppingNeed } from './shopping'
import { planChanges } from './shopping-list'
import { applySwapChange, isEmptyChange, revertListUndo, swapListChange } from './swap-list'
import type { ItemChoice, ShoppingItem, Unit, WeekApproval } from './types'

const WEEK = '2026-W47'
const NOW = '2026-11-17T10:00:00.000Z'
let counter = 0
const newId = () => `id-${++counter}`

const need = (ingredientId: string, amount: number, unit: Unit = 'g', isStaple = false): ShoppingNeed => ({
  ingredientId,
  amount,
  unit,
  storeSection: isStaple ? 'other' : 'meatFish',
  isStaple,
  uses: [],
})

const approvalOf = (needs: ShoppingNeed[], choices: Record<string, ItemChoice> = {}): WeekApproval => ({
  weekId: WEEK,
  approvedAt: NOW,
  fromDate: '2026-11-16',
  items: needs.map((n) => ({ ingredientId: n.ingredientId, amount: n.amount, unit: n.unit, choice: choices[n.ingredientId] ?? 'buy' })),
})

const staple = (id: string) => id === 'oil'
const listFor = (approval: WeekApproval) => applyApproval([], approval, NOW, newId, staple).items

// Before: salmon dinner + rice; after: chicken dinner + rice, oil only in the new dish.
const BEFORE = [need('salmon', 400), need('rice', 300), need('dill', 1, 'bunch' as Unit)]
const AFTER = [need('chicken', 500), need('rice', 300), need('pepper', 2, 'pcs'), need('oil', 2, 'tbsp', true)]

describe('swapListChange (#197)', () => {
  it('lists new items, items off the list, and leaves unchanged items out', () => {
    const approval = approvalOf(BEFORE)
    const change = swapListChange(BEFORE, AFTER, approval, listFor(approval))
    expect(change.add.map((r) => r.ingredientId)).toEqual(['chicken', 'pepper', 'oil'])
    expect(change.remove.map((r) => [r.ingredientId, r.amount])).toEqual([
      ['salmon', 400],
      ['dill', 1],
    ])
    expect(change.bought).toEqual([])
  })

  it('starts new items as "Have" when Home has them, and new staples as "Have"', () => {
    const approval = approvalOf(BEFORE)
    const pantry = [{ id: 'p1', ingredientId: 'pepper', status: 'have' as const, updatedAt: NOW }]
    const change = swapListChange(BEFORE, AFTER, approval, listFor(approval), pantry)
    const byId = new Map(change.add.map((r) => [r.ingredientId, r]))
    expect(byId.get('chicken')?.choice).toBe('buy')
    expect(byId.get('pepper')).toMatchObject({ choice: 'have', atHome: true })
    expect(byId.get('oil')).toMatchObject({ choice: 'have', isStaple: true })
  })

  it('removes only the extra amount when the item is used in another dish too', () => {
    const before = [need('salmon', 800)]
    const after = [need('salmon', 400)]
    const approval = approvalOf(before)
    const change = swapListChange(before, after, approval, listFor(approval))
    expect(change.remove).toMatchObject([{ ingredientId: 'salmon', amount: 400 }])
  })

  it('shows a bought item under "Already bought" instead of removing it', () => {
    const approval = approvalOf(BEFORE)
    const list = listFor(approval).map((i) => (i.ingredientId === 'salmon' ? { ...i, bought: true } : i))
    const change = swapListChange(BEFORE, AFTER, approval, list)
    expect(change.remove.map((r) => r.ingredientId)).toEqual(['dill'])
    expect(change.bought).toMatchObject([{ ingredientId: 'salmon', amount: 400 }])
  })

  it('only grows the amount of an item already on the list as "Buy"', () => {
    const before = [need('rice', 300)]
    const after = [need('rice', 500)]
    const approval = approvalOf(before)
    const change = swapListChange(before, after, approval, listFor(approval))
    expect(change.add).toMatchObject([{ ingredientId: 'rice', amount: 200, alreadyBuying: true }])
  })

  it('ignores items the household has at home when the week needs less', () => {
    const approval = approvalOf(BEFORE, { salmon: 'have' })
    const change = swapListChange(BEFORE, AFTER, approval, listFor(approval))
    expect(change.remove.map((r) => r.ingredientId)).toEqual(['dill'])
  })

  it('is empty when the list does not change', () => {
    const approval = approvalOf(BEFORE)
    expect(isEmptyChange(swapListChange(BEFORE, BEFORE, approval, listFor(approval)))).toBe(true)
  })

  it("never lowers the user's own amount (#191)", () => {
    const approval = approvalOf(BEFORE)
    const list = listFor(approval).map((i): ShoppingItem => (i.ingredientId === 'salmon' ? { ...i, amount: 600, planAmount: { amount: 400, unit: 'g' } } : i))
    const change = swapListChange(BEFORE, AFTER, approval, list)
    expect(change.remove.map((r) => r.ingredientId)).toEqual(['dill'])
  })
})

describe('applySwapChange (#197)', () => {
  it('updates the list and the approval, so the banner does not show', () => {
    const approval = approvalOf(BEFORE)
    const list = listFor(approval)
    const change = swapListChange(BEFORE, AFTER, approval, list)
    const result = applySwapChange(list, approval, change, BEFORE, AFTER, NOW, newId, staple)
    const names = result.items.filter((i) => !i.bought).map((i) => i.ingredientId).sort()
    expect(names).toEqual(['chicken', 'pepper', 'rice'])
    // The oil started as "Have" (staple): not on the list. The approval follows the plan.
    const changes = planChanges(AFTER, result.approval)
    expect(changes.added + changes.removed + changes.changed).toBe(0)
  })

  it('"Have" keeps a new item off the list', () => {
    const approval = approvalOf(BEFORE)
    const list = listFor(approval)
    const change = swapListChange(BEFORE, AFTER, approval, list)
    change.add = change.add.map((r) => (r.ingredientId === 'chicken' ? { ...r, choice: 'have' } : r))
    const result = applySwapChange(list, approval, change, BEFORE, AFTER, NOW, newId, staple)
    expect(result.items.some((i) => i.ingredientId === 'chicken')).toBe(false)
    expect(result.approval.items.find((i) => i.ingredientId === 'chicken')?.choice).toBe('have')
  })

  it('"Keep" leaves the item on the list as the user\'s own, with "No longer needed in the plan"', () => {
    const approval = approvalOf(BEFORE)
    const list = listFor(approval)
    const change = swapListChange(BEFORE, AFTER, approval, list)
    change.remove = change.remove.map((r) => (r.ingredientId === 'salmon' ? { ...r, keep: true } : r))
    const result = applySwapChange(list, approval, change, BEFORE, AFTER, NOW, newId, staple)
    const salmon = result.items.find((i) => i.ingredientId === 'salmon')
    expect(salmon).toMatchObject({ amount: 400, notInPlan: true, planAmount: { amount: 0, unit: 'g' } })
    // Approving the week again doesn't remove it (#191).
    const again = applyApproval(result.items, result.approval, NOW, newId, staple).items
    expect(again.some((i) => i.ingredientId === 'salmon')).toBe(true)
  })

  it('leaves items of other ingredients and the user\'s own items untouched', () => {
    const approval = approvalOf(BEFORE)
    const own: ShoppingItem = { id: 'own', customName: 'Toothpaste', source: 'user', bought: false, createdAt: NOW, updatedAt: NOW }
    const list = [...listFor(approval), own]
    const rice = list.find((i) => i.ingredientId === 'rice')!
    const change = swapListChange(BEFORE, AFTER, approval, list)
    const result = applySwapChange(list, approval, change, BEFORE, AFTER, NOW, newId, staple)
    expect(result.items).toContainEqual(own)
    expect(result.items).toContainEqual(rice)
  })

  it('↶ puts the list back, but what was bought in between stays (6a)', () => {
    const approval = approvalOf(BEFORE)
    const list = listFor(approval)
    const change = swapListChange(BEFORE, AFTER, approval, list)
    const result = applySwapChange(list, approval, change, BEFORE, AFTER, NOW, newId, staple)
    const boughtChicken = result.items.map((i) => (i.ingredientId === 'chicken' ? { ...i, bought: true } : i))
    const reverted = revertListUndo(boughtChicken, result.undo)
    const open = reverted.filter((i) => !i.bought).map((i) => i.ingredientId).sort()
    expect(open).toEqual(['dill', 'rice', 'salmon'])
    expect(reverted.find((i) => i.ingredientId === 'chicken')?.bought).toBe(true)
    expect(result.undo.approval).toBe(approval)
  })

})
