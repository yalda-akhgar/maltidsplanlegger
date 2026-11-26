/** The wizard's editable copy of the household (#158), kept apart from the screen so it can be tested. */
import { newId } from '@/data/repository'
import type { Allergen, HouseholdSettings, Id, ProteinSplit, Weekday } from '@/data/types'
import { selfOf, toDraft, type PersonDraft } from '@/features/household/household-draft'

export type Draft = {
  selfId: string
  name: string
  target: string
  /** My own allergies (#180), food I don't tolerate and dislikes (#181). */
  allergies: Allergen[]
  notTolerated: Id[]
  dislikes: Id[]
  others: PersonDraft[]
  excludedTags: string[]
  excludedTerms: string[]
  noDinnerAtHomeDays: Weekday[]
  cheatDays: Weekday[]
  /** Which meals the household eats: 0 % = off (#183). */
  proteinSplit: ProteinSplit
}

export function toWizardDraft(household: HouseholdSettings): Draft {
  const self = selfOf(household)
  return {
    selfId: self?.id ?? newId(),
    name: self?.name ?? '',
    target: self?.proteinTargetG ? String(self.proteinTargetG) : '',
    allergies: [...(self?.allergies ?? [])],
    notTolerated: [...(self?.notToleratedIngredientIds ?? [])],
    dislikes: [...(self?.dislikedIngredientIds ?? [])],
    others: household.people.filter((p) => p !== self).map(toDraft),
    excludedTags: [...household.excludedTags],
    excludedTerms: [...household.excludedTerms],
    noDinnerAtHomeDays: [...household.noDinnerAtHomeDays],
    cheatDays: [...household.cheatDays],
    proteinSplit: { ...household.proteinSplit },
  }
}
