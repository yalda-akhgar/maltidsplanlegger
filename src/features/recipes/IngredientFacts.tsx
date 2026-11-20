import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { localize } from '@/data/localize'
import { repository } from '@/data/repository'
import { ALLERGENS, type Allergen, type Id, type Ingredient } from '@/data/types'
import { factsOf, withFacts, type IngredientFacts } from './ingredient-facts'
import { useLanguage } from '@/i18n/useLanguage'

/**
 * Allergen chips (#180) and "Does it contain anything the household doesn't
 * tolerate?" (#182) for the user's own ingredients.
 */
export function IngredientFactsFields({
  facts,
  onChange,
  options,
  ingredients,
}: {
  facts: IngredientFacts
  onChange: (facts: IngredientFacts) => void
  /** What someone in the household doesn't tolerate. */
  options: Id[]
  ingredients: ReadonlyMap<Id, Ingredient>
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const { allergens, contains } = facts
  const toggleAllergen = (a: Allergen) => {
    const current = allergens ?? []
    onChange({ ...facts, allergens: current.includes(a) ? current.filter((x) => x !== a) : ALLERGENS.filter((x) => x === a || current.includes(x)) })
  }
  const toggleContains = (id: Id) => {
    const selected = contains.selected.includes(id) ? contains.selected.filter((x) => x !== id) : options.filter((x) => x === id || contains.selected.includes(x))
    onChange({ ...facts, contains: { selected, none: false } })
  }

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('allergens.ingredient.label')}</legend>
        <p className="text-sm text-muted-foreground">{t('allergens.ingredient.hint')}</p>
        <div className="flex flex-wrap gap-2">
          <Chip
            selected={allergens !== undefined && allergens.length === 0}
            onClick={() => onChange({ ...facts, allergens: allergens?.length === 0 ? undefined : [] })}
          >
            {t('allergens.ingredient.none')}
          </Chip>
          {ALLERGENS.map((a) => (
            <Chip key={a} selected={allergens?.includes(a) ?? false} onClick={() => toggleAllergen(a)}>
              {t(`allergens.names.${a}`)}
            </Chip>
          ))}
        </div>
      </fieldset>
      {options.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('household.notTolerated.ingredientLabel')}</legend>
          <p className="text-sm text-muted-foreground">{t('household.notTolerated.ingredientHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Chip selected={contains.none} onClick={() => onChange({ ...facts, contains: { selected: [], none: !contains.none } })}>
              {t('household.notTolerated.ingredientNone')}
            </Chip>
            {options.map((id) => (
              <Chip key={id} selected={contains.selected.includes(id)} onClick={() => toggleContains(id)}>
                {localize(ingredients.get(id)?.name, language)}
              </Chip>
            ))}
          </div>
        </fieldset>
      ) : null}
    </>
  )
}

/** "Fill in" for an own ingredient whose contents are not stated (#182): allergens and what the household doesn't tolerate. */
export function IngredientFactsSheet({
  ingredient,
  options,
  ingredients,
  onClose,
  onSaved,
}: {
  ingredient: Ingredient | null
  options: Id[]
  ingredients: ReadonlyMap<Id, Ingredient>
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  return (
    <BottomSheet
      open={ingredient !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={ingredient ? t('household.notTolerated.fillInTitle', { name: localize(ingredient.name, language) }) : ''}
    >
      {ingredient ? (
        <FactsForm
          key={ingredient.id}
          ingredient={ingredient}
          options={options.filter((id) => id !== ingredient.id)}
          ingredients={ingredients}
          onCancel={onClose}
          onSaved={() => {
            onSaved()
            onClose()
          }}
        />
      ) : null}
    </BottomSheet>
  )
}

function FactsForm({
  ingredient,
  options,
  ingredients,
  onCancel,
  onSaved,
}: {
  ingredient: Ingredient
  options: Id[]
  ingredients: ReadonlyMap<Id, Ingredient>
  onCancel: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [facts, setFacts] = useState(() => factsOf(ingredient, options))
  const save = async () => {
    await repository.saveIngredient({ ...withFacts(ingredient, options, facts), updatedAt: new Date().toISOString() })
    onSaved()
  }
  return (
    <div className="space-y-4">
      <IngredientFactsFields facts={facts} onChange={setFacts} options={options} ingredients={ingredients} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save()}>{t('common.save')}</Button>
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}
