import { useTranslation } from 'react-i18next'
import type { RecipeSafety, UnstatedContents } from '@/data/allergens'
import { localize } from '@/data/localize'
import type { Allergen, Id, Ingredient } from '@/data/types'
import type { AllergyNoteTexts } from '@/features/week/AllergyNotes'
import { useLanguage } from '@/i18n/useLanguage'

/** Whether there is any allergy label to show. */
export const hasAllergyNotes = (notes: AllergyNoteTexts | undefined): notes is AllergyNoteTexts =>
  !!notes && (!!notes.withText || notes.conflicts.length > 0 || (notes.omitted?.length ?? 0) > 0 || (notes.unknown?.length ?? 0) > 0)

/**
 * Texts about allergies (#180) and food people don't tolerate (#181) on dishes:
 * "Contains …", "With gluten-free pasta", "Contains gluten – not for Noah",
 * "Without black pepper for Yalda".
 */
export function useAllergyText(ingredients: ReadonlyMap<Id, Ingredient>, personName: (id: Id) => string) {
  const { t } = useTranslation()
  const language = useLanguage()

  /** "a, b and c" */
  const join = (items: string[]) =>
    items.length <= 1 ? (items[0] ?? '') : t('allergens.and', { a: items.slice(0, -1).join(', '), b: items[items.length - 1] })
  const allergenList = (allergens: readonly Allergen[]) => join(allergens.map((a) => t(`allergens.short.${a}`)))
  const ingredientName = (id: Id) => localize(ingredients.get(id)?.name, language).toLocaleLowerCase(language)
  const names = (ids: Id[]) => join(ids.map(personName))
  /** "a, b or c" */
  const joinOr = (items: string[]) =>
    items.length <= 1 ? (items[0] ?? '') : t('allergens.or', { a: items.slice(0, -1).join(', '), b: items[items.length - 1] })
  /** "Not stated whether chili oil contains chili or pepper" (#182). */
  const unstatedText = (u: UnstatedContents) =>
    t('household.notTolerated.unknown', { ingredient: ingredientName(u.ingredientId), list: joinOr(u.missing.map(ingredientName)) })

  const withText = (substitutions: Record<Id, Id> | undefined) => {
    const ids = Object.values(substitutions ?? {})
    return ids.length > 0 ? t('allergens.with', { list: join(ids.map(ingredientName)) }) : undefined
  }
  /** One line per allergen or not-tolerated ingredient still in the dish: "Contains gluten – not for Noah". */
  const conflictTexts = (safety: RecipeSafety) => [
    ...safety.conflicts.map((c) => t('allergens.conflict', { allergen: t(`allergens.short.${c.allergen}`), names: names(c.personIds) })),
    ...safety.intolerances.map((c) => t('allergens.conflict', { allergen: ingredientName(c.ingredientId), names: names(c.personIds) })),
  ]
  /** "Without black pepper for Yalda" (#181). */
  const omitTexts = (safety: RecipeSafety) =>
    safety.omissions.map((o) => t('household.notTolerated.omit', { ingredient: ingredientName(o.ingredientId), names: names(o.personIds) }))

  return {
    allergenList,
    withText,
    conflictTexts,
    omitTexts,
    unstatedText,
    /** All labels for a dish. `substitutions`: the ones stored on the meal, if it is planned. */
    notes(safety: RecipeSafety, substitutions: Record<Id, Id> | undefined = safety.substitutions): AllergyNoteTexts {
      return {
        withText: withText(substitutions),
        conflicts: conflictTexts(safety),
        omitted: omitTexts(safety),
        unknown:
          safety.status === 'unknown'
            ? [...(safety.unknownIngredientIds.length > 0 ? [t('allergens.unknown')] : []), ...safety.unstatedContents.map(unstatedText)]
            : undefined,
      }
    },
    /** For the "Pick anyway?" dialog. */
    conflictSummary(safety: RecipeSafety) {
      const people = [...new Set([...safety.conflicts, ...safety.intolerances].flatMap((c) => c.personIds))]
      const what = [...safety.conflicts.map((c) => t(`allergens.short.${c.allergen}`)), ...safety.intolerances.map((c) => ingredientName(c.ingredientId))]
      return { allergens: join(what), names: names(people) }
    },
    notStatedText(ids: Id[]) {
      return t('allergens.notStated', { list: join([...new Set(ids)].map(ingredientName)) })
    },
  }
}
