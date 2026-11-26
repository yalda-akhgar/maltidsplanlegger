/**
 * Names shown for people in the household (#195). A name the user didn't type
 * is stored empty and shown as a default text in the current language:
 * "Me" for the first adult ("My profile", #32), then "Adult 2", "Child 1" …
 * Names the user typed are never changed.
 */
import type { TFunction } from 'i18next'
import type { Id, Person } from '@/data/types'

type Named = { id: Id; kind: Person['kind']; name: string }

/** The default name of `person` by its place in `people` (the whole household, in order). */
export function defaultName(person: Pick<Named, 'id' | 'kind'>, people: readonly Pick<Named, 'id' | 'kind'>[], t: TFunction): string {
  const sameKind = people.filter((p) => p.kind === person.kind)
  const index = Math.max(0, sameKind.findIndex((p) => p.id === person.id))
  if (person.kind === 'adult' && index === 0) return t('onboarding.me')
  return `${t(person.kind === 'adult' ? 'household.adult' : 'household.child')} ${index + 1}`
}

/** The person's own name, or the default name when none was typed. */
export function personName(person: Named, people: readonly Pick<Named, 'id' | 'kind'>[], t: TFunction): string {
  return person.name.trim() || defaultName(person, people, t)
}

/** Looks a person up by id; '' when not found. */
export function nameById(id: Id, people: readonly Named[], t: TFunction): string {
  const person = people.find((p) => p.id === id)
  return person ? personName(person, people, t) : ''
}
