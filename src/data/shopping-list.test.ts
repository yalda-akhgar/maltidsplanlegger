import { describe, expect, it } from 'vitest'
import { SEED_INGREDIENTS } from './seed/ingredients'
import { matchIngredient, parseEntry, resolveEntry, splitEntries, wordSection } from './shopping-input'
import { addTypedItems, clearBought, dropFinishedBought, planChanges, sectionOf, setBought, shareText } from './shopping-list'
import type { ShoppingNeed } from './shopping'
import type { ShoppingItem, WeekApproval } from './types'

const NOW = '2026-11-25T10:00:00.000Z'
const ing = (key: string) => `seed-ingredient-${key}`
const ingredients = new Map(SEED_INGREDIENTS.map((i) => [i.id, i]))
let counter = 0
const newId = () => `id-${++counter}`

function item(extra: Partial<ShoppingItem>): ShoppingItem {
  return { id: newId(), source: 'user', bought: false, createdAt: NOW, updatedAt: NOW, ...extra }
}

describe('splitEntries', () => {
  it('splits on commas and line breaks', () => {
    expect(splitEntries('melk, couscous, vann, cola')).toEqual(['melk', 'couscous', 'vann', 'cola'])
    expect(splitEntries('melk\nbrød\n\n  egg ')).toEqual(['melk', 'brød', 'egg'])
  })
  it('keeps the decimal comma in an amount', () => {
    expect(splitEntries('cola 1,5 l, brød')).toEqual(['cola 1,5 l', 'brød'])
  })
  it('drops empty entries and entries without letters', () => {
    expect(splitEntries(' , ,12, melk,')).toEqual(['melk'])
  })
})

describe('parseEntry', () => {
  it('reads an amount in front of or behind the name', () => {
    expect(parseEntry('2 l melk')).toEqual({ name: 'melk', amount: 2, unit: 'l' })
    expect(parseEntry('melk 2 l')).toEqual({ name: 'melk', amount: 2, unit: 'l' })
    expect(parseEntry('2l melk')).toEqual({ name: 'melk', amount: 2, unit: 'l' })
    expect(parseEntry('500 g kjøttdeig')).toEqual({ name: 'kjøttdeig', amount: 500, unit: 'g' })
    expect(parseEntry('cola 1,5 l')).toEqual({ name: 'cola', amount: 1.5, unit: 'l' })
    expect(parseEntry('½ l fløte')).toEqual({ name: 'fløte', amount: 0.5, unit: 'l' })
  })
  it('reads a number without a unit as pieces', () => {
    expect(parseEntry('6 egg')).toEqual({ name: 'egg', amount: 6, unit: 'pcs' })
    expect(parseEntry('agurk 2')).toEqual({ name: 'agurk', amount: 2, unit: 'pcs' })
  })
  it('reads unit words in all three languages', () => {
    expect(parseEntry('2 bokser tomater')).toEqual({ name: 'tomater', amount: 2, unit: 'can' })
    expect(parseEntry('1 Packung Nudeln')).toEqual({ name: 'Nudeln', amount: 1, unit: 'pack' })
    expect(parseEntry('3 cans beans')).toEqual({ name: 'beans', amount: 3, unit: 'can' })
  })
  it('does not take the first letter of a name as a unit', () => {
    expect(parseEntry('2 laks')).toEqual({ name: 'laks', amount: 2, unit: 'pcs' })
    expect(parseEntry('2 løk')).toEqual({ name: 'løk', amount: 2, unit: 'pcs' })
  })
  it('uses the whole text as the name when there is no clear amount', () => {
    expect(parseEntry('tannkrem')).toEqual({ name: 'tannkrem' })
    expect(parseEntry('7up')).toEqual({ name: '7up' })
  })
})

describe('matchIngredient (whole names only, #190 point 3a)', () => {
  it('matches catalogue names in every language, ignoring case', () => {
    expect(matchIngredient('kyllingfilet', SEED_INGREDIENTS)?.id).toBe(ing('chicken-breast'))
    expect(matchIngredient('Chicken breast', SEED_INGREDIENTS)?.id).toBe(ing('chicken-breast'))
    expect(matchIngredient('ZWIEBEL', SEED_INGREDIENTS)?.id).toBe(ing('onion'))
  })
  it('matches simple inflections', () => {
    expect(matchIngredient('tomater', SEED_INGREDIENTS)?.id).toBe(ing('tomato'))
    expect(matchIngredient('løken', SEED_INGREDIENTS)?.id).toBe(ing('onion'))
    expect(matchIngredient('bananer', SEED_INGREDIENTS)?.id).toBe(ing('banana'))
    expect(matchIngredient('eggs', SEED_INGREDIENTS)?.id).toBe(ing('egg'))
  })
  it('ignores text in brackets', () => {
    expect(matchIngredient('kikerter', SEED_INGREDIENTS)?.id).toBe(ing('chickpeas'))
  })
  it('does not match part of a name', () => {
    expect(matchIngredient('melk', SEED_INGREDIENTS)).toBeUndefined() // the catalogue has "Lettmelk"
    expect(matchIngredient('melkesjokolade', SEED_INGREDIENTS)).toBeUndefined()
    expect(matchIngredient('laks', SEED_INGREDIENTS)).toBeUndefined() // "Laksefilet"
  })
})

describe('wordSection (#190 point 3z)', () => {
  it('sorts common items that are not in the catalogue', () => {
    expect(wordSection('melk')).toBe('dairy')
    expect(wordSection('couscous')).toBe('dryGoods')
    expect(wordSection('vann')).toBe('drinks')
    expect(wordSection('Cola')).toBe('drinks')
    expect(wordSection('tannkrem')).toBe('household')
    expect(wordSection('Toilet paper')).toBe('household')
    expect(wordSection('Brötchen')).toBe('bread')
  })
  it('matches inflections but not parts of words', () => {
    expect(wordSection('pølsene')).toBe('meatFish')
    expect(wordSection('melkesjokolade')).toBeUndefined()
    expect(wordSection('sjokolademelk')).toBeUndefined()
  })
})

describe('resolveEntry', () => {
  it('uses the household’s chosen section first, then the catalogue, the word list and "Other"', () => {
    expect(resolveEntry('2 paprika', SEED_INGREDIENTS)).toMatchObject({ amount: 2, unit: 'pcs', storeSection: 'produce', ingredient: { id: ing('bell-pepper') } })
    expect(resolveEntry('vann', SEED_INGREDIENTS).storeSection).toBe('drinks')
    expect(resolveEntry('blomsterjord', SEED_INGREDIENTS).storeSection).toBe('other')
    expect(resolveEntry('blomsterjord', SEED_INGREDIENTS, { 'n:blomsterjord': 'household' }).storeSection).toBe('household')
    expect(resolveEntry('Paprika', SEED_INGREDIENTS, { [`i:${ing('bell-pepper')}`]: 'frozen' }).storeSection).toBe('frozen')
  })
})

describe('addTypedItems', () => {
  const add = (list: ShoppingItem[], text: string) => addTypedItems(list, text, { ingredients: SEED_INGREDIENTS, now: NOW, newId })

  it('adds several items at once, each in its section', () => {
    const result = add([], 'melk, couscous, vann, cola, 2 paprika, blomsterjord')
    expect(result.added.map((i) => [i.customName ?? i.ingredientId, i.storeSection])).toEqual([
      ['Melk', 'dairy'],
      ['Couscous', 'dryGoods'],
      ['Vann', 'drinks'],
      ['Cola', 'drinks'],
      [ing('bell-pepper'), 'produce'],
      ['Blomsterjord', 'other'],
    ])
    expect(result.added[4]).toMatchObject({ amount: 2, unit: 'pcs', source: 'user', bought: false })
    expect(result.duplicates).toEqual([])
  })

  it('does not add an item that is already on the list (#190 point 5)', () => {
    const planItem = item({ ingredientId: ing('bell-pepper'), amount: 3, unit: 'pcs', source: 'plan', weekId: '2026-W48' })
    const own = item({ customName: 'Melk', storeSection: 'dairy' })
    const result = add([planItem, own], 'paprika, MELK, brød, brød')
    expect(result.added.map((i) => i.customName)).toEqual(['Brød'])
    expect(result.duplicates).toEqual([planItem, own])
    expect(result.items).toHaveLength(3)
  })

  it('adds an item again when the one on the list is already bought', () => {
    const bought = item({ customName: 'Melk', bought: true })
    expect(add([bought], 'melk').added).toHaveLength(1)
  })
})

describe('ticking off and clearing', () => {
  it('records when an item was bought and what Home said before', () => {
    const milk = item({ customName: 'Melk' })
    const [ticked] = setBought([milk], milk.id, true, NOW, 'none')
    expect(ticked).toMatchObject({ bought: true, boughtAt: NOW, pantryBefore: 'none' })
    const [unticked] = setBought([ticked], milk.id, false, NOW)
    expect(unticked.bought).toBe(false)
    expect(unticked.boughtAt).toBeUndefined()
    expect(unticked.pantryBefore).toBeUndefined()
  })

  it('"Remove bought" keeps what is not bought', () => {
    const open = item({ customName: 'Brød' })
    expect(clearBought([open, item({ customName: 'Melk', bought: true })])).toEqual([open])
  })

  it('bought items disappear once their week is over (#190 point 7)', () => {
    const oldPlan = item({ weekId: '2026-W47', bought: true, boughtAt: '2026-11-20T10:00:00.000Z' })
    const thisPlan = item({ weekId: '2026-W48', bought: true, boughtAt: '2026-11-20T10:00:00.000Z' })
    const oldOwn = item({ bought: true, boughtAt: '2026-11-20T10:00:00.000Z' }) // week 47
    const newOwn = item({ bought: true, boughtAt: NOW }) // week 48
    const openOld = item({ weekId: '2026-W47' })
    expect(dropFinishedBought([oldPlan, thisPlan, oldOwn, newOwn, openOld], '2026-W48')).toEqual([thisPlan, newOwn, openOld])
  })
})

describe('sectionOf', () => {
  it('uses the item’s section, then the household’s choice, then the ingredient’s', () => {
    const pepper = item({ ingredientId: ing('bell-pepper') })
    expect(sectionOf(pepper, ingredients)).toBe('produce')
    expect(sectionOf(pepper, ingredients, { [`i:${ing('bell-pepper')}`]: 'frozen' })).toBe('frozen')
    expect(sectionOf({ ...pepper, storeSection: 'other' }, ingredients)).toBe('other')
    expect(sectionOf(item({ customName: 'X' }), ingredients)).toBe('other')
  })
})

describe('shareText', () => {
  it('lists sections with their items', () => {
    expect(shareText('Handleliste', [{ title: 'Meieri', lines: ['Melk · 2 l', 'Smør'] }, { title: 'Annet', lines: ['Tannkrem'] }])).toBe(
      'Handleliste\n\nMeieri\n• Melk · 2 l\n• Smør\n\nAnnet\n• Tannkrem',
    )
  })
})

describe('planChanges (#184 point 5)', () => {
  const need = (key: string, amount: number, isStaple = false): ShoppingNeed => ({
    ingredientId: ing(key),
    amount,
    unit: 'g',
    storeSection: 'produce',
    isStaple,
    uses: [],
  })
  const approval: WeekApproval = {
    weekId: '2026-W48',
    approvedAt: NOW,
    fromDate: '2026-11-23',
    items: [
      { ingredientId: ing('chicken-breast'), amount: 900, unit: 'g', choice: 'buy' },
      { ingredientId: ing('spinach'), amount: 200, unit: 'g', choice: 'have' },
      { ingredientId: ing('salt'), amount: 5, unit: 'g', choice: 'have' },
      { ingredientId: ing('feta'), amount: 150, unit: 'g', choice: 'buy' },
    ],
  }

  it('counts new, removed and changed items', () => {
    const changes = planChanges([need('chicken-breast', 1050), need('spinach', 200), need('salt', 8, true), need('salmon', 500), need('broccoli', 400)], approval)
    expect(changes).toMatchObject({ added: 2, removed: 1, changed: 1 })
    expect(changes.byKey.get(`${ing('salmon')}|g`)).toBe('new')
    expect(changes.byKey.get(`${ing('chicken-breast')}|g`)).toBe('amount')
    expect(changes.byKey.has(`${ing('salt')}|g`)).toBe(false) // staples have no amount on the list
  })

  it('finds nothing when the plan is unchanged', () => {
    const same = approval.items.map((i) => need(i.ingredientId.replace('seed-ingredient-', ''), i.amount, i.ingredientId === ing('salt')))
    expect(planChanges(same, approval)).toMatchObject({ added: 0, removed: 0, changed: 0 })
  })
})
