import { CheckIcon, SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { allTranslations, localize } from '@/data/localize'
import type { Id, Ingredient } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { cn } from '@/lib/utils'

/** dislikes: soft rule (#70) · notTolerated: strict, like allergies (#181). The text keys live under `household.<kind>`. */
export type IngredientChoiceKind = 'dislikes' | 'notTolerated'

type Props = {
  kind: IngredientChoiceKind
  open: boolean
  name: string
  ingredients: Ingredient[]
  selected: Id[]
  onChange: (selected: Id[]) => void
  onClose: () => void
}

/** Choose what a person doesn't like or doesn't tolerate from the ingredient catalogue (#70, #161, #181). Several can be chosen. */
export function IngredientChoiceSheet({ kind, open, name, ingredients, selected, onChange, onClose }: Props) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [query, setQuery] = useState('')
  const q = query.trim().toLocaleLowerCase(language)

  // Chosen ingredients first, then the rest alphabetically; search matches every language.
  const list = useMemo(() => {
    const byName = (a: Ingredient, b: Ingredient) => localize(a.name, language).localeCompare(localize(b.name, language), language)
    const matches = ingredients.filter((i) => !q || allTranslations(i.name).some((n) => n.toLocaleLowerCase(language).includes(q)))
    return [...matches.filter((i) => selected.includes(i.id)).sort(byName), ...matches.filter((i) => !selected.includes(i.id)).sort(byName)]
  }, [ingredients, q, language, selected])

  const toggle = (id: Id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={t(`household.${kind}.title`, { name })}
      description={t(`household.${kind}.description`, { name })}
      footer={<Button onClick={onClose}>{t('household.dislikes.done')}</Button>}
    >
      <div className="space-y-3">
        <div className="relative">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t('household.dislikes.search')}
            placeholder={t('household.dislikes.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        {kind === 'notTolerated' ? <p className="text-sm text-muted-foreground">{t('household.notTolerated.hint')}</p> : null}
        {list.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">{t('recipes.picker.noResults')}</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {list.map((ingredient) => {
              const on = selected.includes(ingredient.id)
              return (
                <li key={ingredient.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(ingredient.id)}
                    className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span
                      aria-hidden
                      className={cn('flex size-5 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-primary bg-primary text-primary-foreground' : 'border-input')}
                    >
                      {on ? <CheckIcon className="size-3.5" /> : null}
                    </span>
                    {localize(ingredient.name, language)}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </BottomSheet>
  )
}
