import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { isOldDefaultName } from '@/data/default-names'
import { defaultHousehold } from '@/data/defaults'
import { createRepository, deviceLanguage, type KeyValueStorage } from '@/data/repository'
import type { Person } from '@/data/types'
import { toWizardDraft } from '@/features/onboarding/wizard-draft'
import { withExampleFamily } from './example-family'
import { fromDraft, newDraft } from './household-draft'
import { defaultName, personName } from './person-name'

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial))
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
}

// A tiny stand-in for i18next: "onboarding.me" → "Me", "household.adult" → "Adult" …
const TEXTS: Record<string, string> = { 'onboarding.me': 'Me', 'household.adult': 'Adult', 'household.child': 'Child' }
const t = ((key: string) => TEXTS[key] ?? key) as unknown as TFunction

describe('nothing is pre-selected for a new household (#188, #195)', () => {
  it('the stored default household chooses nothing on behalf of the user', async () => {
    const household = await createRepository(memoryStorage()).getHousehold()
    expect(household.excludedTags).toEqual([])
    expect(household.excludedTerms).toEqual([])
    expect(household.cheatDays).toEqual([])
    expect(household.noDinnerAtHomeDays).toEqual([])
    expect(household.people).toEqual([])
    expect(household.useHomeFirst).toBeFalsy()
    expect(household.autoWeekPlan).toBeFalsy()
  })
  it('the wizard starts with nothing selected', () => {
    const draft = toWizardDraft(defaultHousehold())
    expect(draft.excludedTags).toEqual([])
    expect(draft.excludedTerms).toEqual([])
    expect(draft.cheatDays).toEqual([])
    expect(draft.noDinnerAtHomeDays).toEqual([])
    expect(draft.allergies).toEqual([])
    expect(draft.notTolerated).toEqual([])
    expect(draft.dislikes).toEqual([])
    expect(draft.others).toEqual([])
    expect(draft.name).toBe('')
  })
  it('the example family excludes nothing, also when an older household had pork saved', () => {
    const example = withExampleFamily({ ...defaultHousehold(), excludedTags: ['pork'], excludedTerms: ['sopp'] })
    expect(example.excludedTags).toEqual([])
    expect(example.excludedTerms).toEqual([])
  })
})

describe('default names follow the language (#195)', () => {
  const people: Person[] = [
    { id: 'me', name: '', kind: 'adult', dislikedIngredientIds: [] },
    { id: 'a2', name: '', kind: 'adult', dislikedIngredientIds: [] },
    { id: 'c1', name: 'Noah', kind: 'child', dislikedIngredientIds: [] },
    { id: 'c2', name: '', kind: 'child', dislikedIngredientIds: [] },
  ]
  it('an empty name is saved empty, never as "Me" or "Adult 2"', () => {
    expect(fromDraft(newDraft('adult')).name).toBe('')
    expect(fromDraft({ ...newDraft('child'), name: '  Ella ' }).name).toBe('Ella')
  })
  it('shows "Me" for the first adult and numbers the others by kind', () => {
    expect(people.map((p) => personName(p, people, t))).toEqual(['Me', 'Adult 2', 'Noah', 'Child 2'])
    expect(defaultName(people[3], people, t)).toBe('Child 2')
  })
  it('recognises default names saved before #195 in every language, and nothing else', () => {
    for (const name of ['Meg', 'Me', 'Ich', 'Voksen 2', 'Adult 3', 'Erwachsene/r 2']) expect(isOldDefaultName(name, 'adult')).toBe(true)
    for (const name of ['Barn 1', 'Child 2', 'Kind 1']) expect(isOldDefaultName(name, 'child')).toBe(true)
    for (const name of ['Yalda', 'Meghan', 'Voksen', 'Barn 1 og 2']) expect(isOldDefaultName(name, 'adult')).toBe(false)
    expect(isOldDefaultName('Meg', 'child')).toBe(false)
  })
  it('the one-time clean-up (schema v6) empties saved default names and keeps typed ones', async () => {
    const saved = (name: string, kind: Person['kind'], id: string): Person => ({ id, name, kind, dislikedIngredientIds: [] })
    const storage = memoryStorage({
      'mp:schemaVersion': '5',
      'mp:household': JSON.stringify({
        ...defaultHousehold(),
        excludedTags: ['pork'],
        people: [saved('Meg', 'adult', 'a'), saved('Voksen 2', 'adult', 'b'), saved('Barn 1', 'child', 'c'), saved('Ola', 'adult', 'd')],
      }),
    })
    const household = await createRepository(storage).getHousehold()
    expect(household.people.map((p) => p.name)).toEqual(['', '', '', 'Ola'])
    expect(household.excludedTags).toEqual(['pork']) // the user's saved choices are never changed (#192, #195)
  })
})

describe('first start language (#195)', () => {
  it("follows the phone's language, otherwise English", () => {
    expect(deviceLanguage(['de-DE'])).toBe('de')
    expect(deviceLanguage(['nb-NO'])).toBe('nb')
    expect(deviceLanguage(['fr-FR'])).toBe('en')
    expect(deviceLanguage([])).toBe('en')
  })
})
