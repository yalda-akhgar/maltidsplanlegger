import { useTranslation } from 'react-i18next'
import type { RecipeSafety } from '@/data/allergens'
import { localize } from '@/data/localize'
import type { Allergen, Id, Ingredient } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'

/** Texts about allergies on dishes (#180): "Contains …", "With gluten-free pasta", "Contains gluten – not for Noah". */
export function useAllergyText(ingredients: ReadonlyMap<Id, Ingredient>, personName: (id: Id) => string) {
  const { t } = useTranslation()
  const language = useLanguage()

  /** "a, b and c" */
  const join = (items: string[]) =>
    items.length <= 1 ? (items[0] ?? '') : t('allergens.and', { a: items.slice(0, -1).join(', '), b: items[items.length - 1] })
  const allergenList = (allergens: readonly Allergen[]) => join(allergens.map((a) => t(`allergens.short.${a}`)))
  const ingredientName = (id: Id) => localize(ingredients.get(id)?.name, language).toLocaleLowerCase(language)

  return {
    allergenList,
    /** "With gluten-free pasta and lactose-free skyr", or undefined. */
    withText(substitutions: Record<Id, Id> | undefined) {
      const ids = Object.values(substitutions ?? {})
      return ids.length > 0 ? t('allergens.with', { list: join(ids.map(ingredientName)) }) : undefined
    },
    /** One line per allergen still in the dish: "Contains gluten – not for Noah". */
    conflictTexts(safety: RecipeSafety) {
      return safety.conflicts.map((c) => t('allergens.conflict', { allergen: t(`allergens.short.${c.allergen}`), names: join(c.personIds.map(personName)) }))
    },
    /** For the "Pick anyway?" dialog. */
    conflictSummary(safety: RecipeSafety) {
      const people = [...new Set(safety.conflicts.flatMap((c) => c.personIds))]
      return { allergens: allergenList(safety.conflicts.map((c) => c.allergen)), names: join(people.map(personName)) }
    },
    notStatedText(ids: Id[]) {
      return t('allergens.notStated', { list: join([...new Set(ids)].map(ingredientName)) })
    },
  }
}
