import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { localize } from '@/data/localize'
import type { Allergen, Id, Ingredient } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { AllergyRow } from './AllergiesSheet'
import { IngredientChoiceSheet, type IngredientChoiceKind } from './IngredientChoiceSheet'

export type FoodChoices = { allergies: Allergen[]; notTolerated: Id[]; dislikes: Id[] }

/**
 * The three food levels on a person card (#181), strictest first:
 * allergies (fixed EU list) → doesn't tolerate (strict, any ingredient) → dislikes (soft).
 */
export function FoodRows({
  name,
  value,
  ingredients,
  onChange,
}: {
  name: string
  value: FoodChoices
  ingredients: Ingredient[]
  onChange: (value: FoodChoices) => void
}) {
  return (
    <div>
      <AllergyRow name={name} allergies={value.allergies} onChange={(allergies) => onChange({ ...value, allergies })} />
      <IngredientRow kind="notTolerated" name={name} ingredients={ingredients} selected={value.notTolerated} onChange={(notTolerated) => onChange({ ...value, notTolerated })} />
      <IngredientRow kind="dislikes" name={name} ingredients={ingredients} selected={value.dislikes} onChange={(dislikes) => onChange({ ...value, dislikes })} />
    </div>
  )
}

function IngredientRow({
  kind,
  name,
  ingredients,
  selected,
  onChange,
}: {
  kind: IngredientChoiceKind
  name: string
  ingredients: Ingredient[]
  selected: Id[]
  onChange: (selected: Id[]) => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [open, setOpen] = useState(false)
  const names = selected
    .map((id) => ingredients.find((i) => i.id === id))
    .filter((i): i is Ingredient => !!i)
    .map((i) => localize(i.name, language).toLocaleLowerCase(language))
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
      <span className="min-w-0">
        {t(`household.${kind}.label`)}{' '}
        <span className={names.length > 0 ? 'font-semibold' : 'text-muted-foreground'}>{names.length > 0 ? names.join(', ') : t(`household.${kind}.none`)}</span>
      </span>
      <Button variant="ghost" className="shrink-0 text-primary-text" aria-label={t(`household.${kind}.edit`, { name })} onClick={() => setOpen(true)}>
        {t(`household.${kind}.change`)}
      </Button>
      <IngredientChoiceSheet kind={kind} open={open} name={name} ingredients={ingredients} selected={selected} onChange={onChange} onClose={() => setOpen(false)} />
    </div>
  )
}
