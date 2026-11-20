import { PlusIcon, SearchIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { allTranslations, localize } from '@/data/localize'
import { newId, repository } from '@/data/repository'
import { STORE_SECTIONS, type Id, type Ingredient, type StoreSection } from '@/data/types'
import { IngredientFactsFields } from './IngredientFacts'
import { withFacts, type IngredientFacts } from './ingredient-facts'
import { useLanguage } from '@/i18n/useLanguage'

type IngredientPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients: Ingredient[]
  /** What someone in the household doesn't tolerate – asked about for new ingredients (#182). */
  notToleratedIds: Id[]
  onPick: (ingredient: Ingredient) => void
}

const parseNumber = (value: string) => {
  const n = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Sheet for choosing an ingredient from the catalogue, or adding a new one
 * (name + store section; nutrition optional, #89).
 */
export function IngredientPicker({ open, onOpenChange, ingredients, notToleratedIds, onPick }: IngredientPickerProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [query, setQuery] = useState('')

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setMode('search')
      setQuery('')
    }
  }
  const pick = (ingredient: Ingredient) => {
    onPick(ingredient)
    close(false)
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={close}
      title={mode === 'search' ? t('recipes.picker.title') : t('recipes.newIngredient.title')}
    >
      {mode === 'search' ? (
        <SearchList ingredients={ingredients} query={query} setQuery={setQuery} onPick={pick} onCreate={() => setMode('create')} />
      ) : (
        <CreateForm initialName={query.trim()} ingredients={ingredients} notToleratedIds={notToleratedIds} onCreated={pick} onCancel={() => setMode('search')} />
      )}
    </BottomSheet>
  )
}

function SearchList({
  ingredients,
  query,
  setQuery,
  onPick,
  onCreate,
}: {
  ingredients: Ingredient[]
  query: string
  setQuery: (q: string) => void
  onPick: (ingredient: Ingredient) => void
  onCreate: () => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const q = query.trim().toLocaleLowerCase(language)

  // Search names in every language, so e.g. "chicken" also finds "Kyllingfilet".
  const matches = useMemo(
    () =>
      ingredients
        .filter((i) => !q || allTranslations(i.name).some((n) => n.toLocaleLowerCase(language).includes(q)))
        .sort((a, b) => localize(a.name, language).localeCompare(localize(b.name, language), language)),
    [ingredients, q, language],
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={t('recipes.picker.search')}
          placeholder={t('recipes.picker.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
        />
      </div>
      <Button variant="secondary" className="w-full justify-start" onClick={onCreate}>
        <PlusIcon aria-hidden />
        <span className="truncate">
          {query.trim() ? t('recipes.picker.createNamed', { name: query.trim() }) : t('recipes.picker.create')}
        </span>
      </Button>
      {matches.length === 0 ? (
        <p className="py-4 text-center text-muted-foreground">{t('recipes.picker.noResults')}</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {matches.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onClick={() => onPick(ingredient)}
                className="flex min-h-11 w-full items-center px-4 py-2 text-left outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                {localize(ingredient.name, language)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CreateForm({
  initialName,
  ingredients,
  notToleratedIds,
  onCreated,
  onCancel,
}: {
  initialName: string
  ingredients: Ingredient[]
  notToleratedIds: Id[]
  onCreated: (ingredient: Ingredient) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const id = useId()
  const [name, setName] = useState(initialName)
  const [section, setSection] = useState<StoreSection>('produce')
  const [protein, setProtein] = useState('')
  const [kcal, setKcal] = useState('')
  /** Allergens (#180) and what it contains of what the household doesn't tolerate (#182); nothing chosen = not stated. */
  const [facts, setFacts] = useState<IngredientFacts>({ allergens: undefined, contains: { selected: [], none: false } })
  const ingredientMap = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients])
  const [showError, setShowError] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setShowError(true)
      return
    }
    const proteinG = parseNumber(protein)
    const kcalValue = parseNumber(kcal)
    const now = new Date().toISOString()
    const ingredient: Ingredient = withFacts({
      id: newId(),
      name: { [language]: name.trim() },
      // Only with both values; otherwise the recipe shows "nutrition missing" (#89).
      ...(proteinG !== undefined && kcalValue !== undefined
        ? { nutritionPer100g: { proteinG, kcal: kcalValue, fiberG: 0, fruitVegPortions: 0 } }
        : {}),
      gramsPerUnit: {},
      tags: [],
      storeSection: section,
      isStaple: false,
      source: 'user',
      createdAt: now,
      updatedAt: now,
    }, notToleratedIds, facts)
    onCreated(await repository.saveIngredient(ingredient))
  }

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-name`} className="text-sm font-medium">
          {t('recipes.newIngredient.name')}
        </label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={showError && !name.trim()}
          aria-describedby={showError && !name.trim() ? `${id}-name-error` : undefined}
          autoComplete="off"
        />
        {showError && !name.trim() ? (
          <p id={`${id}-name-error`} className="text-sm text-destructive">
            {t('recipes.newIngredient.nameRequired')}
          </p>
        ) : null}
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-section`} className="text-sm font-medium">
          {t('recipes.newIngredient.storeSection')}
        </label>
        <NativeSelect id={`${id}-section`} value={section} onChange={(e) => setSection(e.target.value as StoreSection)}>
          {STORE_SECTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`storeSections.${s}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-protein`} className="text-sm font-medium">
            {t('recipes.newIngredient.protein')}
          </label>
          <Input id={`${id}-protein`} inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-kcal`} className="text-sm font-medium">
            {t('recipes.newIngredient.kcal')}
          </label>
          <Input id={`${id}-kcal`} inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t('recipes.newIngredient.hint')}</p>
      <IngredientFactsFields facts={facts} onChange={setFacts} options={notToleratedIds} ingredients={ingredientMap} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{t('recipes.newIngredient.save')}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.back')}
        </Button>
      </div>
    </form>
  )
}
