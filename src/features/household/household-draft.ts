/**
 * Editable copies of household data for the wizard and the settings pages.
 * Number fields are kept as text while typing and parsed when saving.
 */
import { newId } from '@/data/repository'
import type { Allergen, HouseholdSettings, Id, Person, Weekday } from '@/data/types'

export interface PersonDraft {
  id: Id
  kind: 'adult' | 'child'
  name: string
  /** Adults: daily protein target in grams, as typed (#160). */
  target: string
  /** Everyone: ingredients they don't like – a soft rule (#70, #161, #181). */
  dislikes: Id[]
  /** Everyone: ingredients they don't tolerate – strict (#181). */
  notTolerated: Id[]
  /** Children: eats lunch at home on weekdays (#102). */
  lunchAtHome: boolean
  /** Everyone: allergies and intolerances (#180). */
  allergies: Allergen[]
}

export const MAX_TARGET_G = 500

/** A target in whole grams, or undefined when empty or not a sensible number. */
export function parseTarget(value: string): number | undefined {
  const n = Math.round(Number.parseFloat(value.replace(',', '.')))
  return Number.isFinite(n) && n > 0 && n <= MAX_TARGET_G ? n : undefined
}

/** Whether a typed target is invalid (empty is fine – targets are optional, #160). */
export const targetInvalid = (value: string) => value.trim() !== '' && parseTarget(value) === undefined

export function toDraft(person: Person): PersonDraft {
  return {
    id: person.id,
    kind: person.kind,
    name: person.name,
    target: person.proteinTargetG ? String(person.proteinTargetG) : '',
    dislikes: [...person.dislikedIngredientIds],
    notTolerated: [...(person.notToleratedIngredientIds ?? [])],
    lunchAtHome: person.eatsWeekdayLunchAtHome === true,
    allergies: [...(person.allergies ?? [])],
  }
}

export function newDraft(kind: 'adult' | 'child'): PersonDraft {
  return { id: newId(), kind, name: '', target: '', dislikes: [], notTolerated: [], lunchAtHome: false, allergies: [] }
}

/** Turns a draft back into a person. An empty name gets `fallbackName`. */
export function fromDraft(draft: PersonDraft, fallbackName: string): Person {
  const person: Person = { id: draft.id, name: draft.name.trim() || fallbackName, kind: draft.kind, dislikedIngredientIds: [...draft.dislikes] }
  if (draft.kind === 'adult') {
    const target = parseTarget(draft.target)
    if (target) person.proteinTargetG = target
  } else if (draft.lunchAtHome) {
    person.eatsWeekdayLunchAtHome = true
  }
  if (draft.allergies.length > 0) person.allergies = [...draft.allergies]
  if (draft.notTolerated.length > 0) person.notToleratedIngredientIds = [...draft.notTolerated]
  return person
}

/** "My profile" is the first adult until login exists (#32). */
export function selfOf(household: HouseholdSettings): Person | undefined {
  return household.people.find((p) => p.kind === 'adult')
}

export const sortedDays = (days: Weekday[]) => [...days].sort((a, b) => a - b)
