import { HeartIcon, PlusIcon, SearchIcon, UtensilsIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { localize } from '@/data/localize'
import { isRecipeAllowed, pickImpacts, type PlannerContext } from '@/data/planner'
import type { Id, IsoDate, MealSlot, Person, WeekPlan } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { cn } from '@/lib/utils'

export type PickTarget = { date: IsoDate; slot: MealSlot; dayTitle: string }

type PickSheetProps = {
  target: PickTarget | null
  ctx: PlannerContext
  plan: WeekPlan
  people: Person[]
  /** The meal is empty, so "eating out" is offered here too. */
  canMarkEatingOut: boolean
  onClose: () => void
  onPick: (recipeId: Id) => void
  onEatingOut: () => void
  onNewRecipe: () => void
}

/** Within this many grams of the target counts as "on target". */
const ON_TARGET_G = 2

/**
 * "Pick a dish yourself" (#112): search, filters and the protein impact per
 * adult for every dish (#115, #119). Can be closed without picking (#122).
 */
export function PickSheet({ target, ...rest }: PickSheetProps) {
  const { t } = useTranslation()
  return (
    <BottomSheet
      open={target !== null}
      onOpenChange={(open) => (open ? undefined : rest.onClose())}
      title={target ? t('week.pick.title', { slot: t(`week.slots.${target.slot}`), day: target.dayTitle }) : ''}
      description={t('week.pick.description')}
      footer={
        <div className="flex flex-wrap gap-2 [&>*]:min-w-fit [&>*]:flex-1">
          <Button variant="outline" size="sm" onClick={rest.onNewRecipe}>
            <PlusIcon aria-hidden />
            {t('recipes.newRecipe')}
          </Button>
          {rest.canMarkEatingOut ? (
            <Button variant="outline" size="sm" onClick={rest.onEatingOut}>
              <UtensilsIcon aria-hidden />
              {t('week.pick.eatingOut')}
            </Button>
          ) : null}
        </div>
      }
    >
      {target ? <PickList key={`${target.date}-${target.slot}`} target={target} {...rest} /> : null}
    </BottomSheet>
  )
}

function PickList({ target, ctx, plan, people, onPick }: Omit<PickSheetProps, 'target'> & { target: PickTarget }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [query, setQuery] = useState('')
  const [inSlot, setInSlot] = useState(true)
  const [favorites, setFavorites] = useState(false)
  const [kidFriendly, setKidFriendly] = useState(false)

  const allowed = useMemo(
    () =>
      ctx.recipes
        .filter((r) => isRecipeAllowed(r, ctx.ingredients, ctx.household)) // never excluded food (#18)
        .sort((a, b) => localize(a.name, language).localeCompare(localize(b.name, language), language)),
    [ctx, language],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(language)
    return allowed.filter((r) => {
      if (inSlot && !r.categoryIds.includes(target.slot)) return false
      if (favorites && !r.favorite) return false
      if (kidFriendly && !r.kidFriendly) return false
      if (!q) return true
      const names = [r.name, ...r.ingredients.map((line) => ctx.ingredients.get(line.ingredientId)?.name)]
      return names.some((name) => localize(name, language).toLocaleLowerCase(language).includes(q))
    })
  }, [allowed, query, inSlot, favorites, kidFriendly, target.slot, ctx.ingredients, language])

  const impacts = useMemo(
    () => pickImpacts(ctx, { plan, date: target.date, slot: target.slot, recipeIds: visible.map((r) => r.id) }),
    [ctx, plan, target, visible],
  )
  const name = (id: Id) => people.find((p) => p.id === id)?.name ?? ''

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={t('recipes.search')}
          placeholder={t('recipes.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11"
        />
      </div>
      <div role="group" aria-label={t('recipes.filters')} className="flex flex-wrap gap-2">
        <Chip selected={inSlot} onClick={() => setInSlot((v) => !v)}>
          {t(`week.slots.${target.slot}`)}
        </Chip>
        <Chip selected={favorites} onClick={() => setFavorites((v) => !v)}>
          {t('recipes.favorites')}
        </Chip>
        <Chip selected={kidFriendly} onClick={() => setKidFriendly((v) => !v)}>
          {t('recipes.kidFriendly')}
        </Chip>
      </div>
      <p role="status" className="sr-only">
        {t('recipes.showing', { count: visible.length })}
      </p>
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-6 py-8 text-center text-muted-foreground">{t('recipes.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((recipe) => {
            const recipeName = localize(recipe.name, language)
            const labels = (impacts.get(recipe.id) ?? []).map((p) => {
              const diff = Math.round(p.diffG)
              const kind = Math.abs(diff) <= ON_TARGET_G ? 'onTarget' : diff > 0 ? 'over' : 'under'
              return { id: p.personId, kind, text: t(`week.pick.${kind}`, { name: name(p.personId), diff: Math.abs(diff) }) }
            })
            return (
              <li key={recipe.id}>
                <button
                  type="button"
                  onClick={() => onPick(recipe.id)}
                  className="flex min-h-11 w-full flex-col gap-1 rounded-2xl border bg-card px-3 py-2 text-left outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex w-full items-baseline justify-between gap-2">
                    <span className="font-semibold break-words">{recipeName}</span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      {recipe.favorite ? (
                        <>
                          <HeartIcon aria-hidden className="size-3.5 fill-current text-primary-text" />
                          <span className="sr-only">{t('recipes.favorites')}</span>
                        </>
                      ) : null}
                      {t('recipes.minutes', { count: recipe.timeMinutes })}
                    </span>
                  </span>
                  {labels.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {labels.map((l) => (
                        <span
                          key={l.id}
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                            l.kind === 'under' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground',
                          )}
                        >
                          {l.text}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
