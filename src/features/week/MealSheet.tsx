import { ListIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { localize } from '@/data/localize'
import type { MealSlot, PlannedMeal } from '@/data/types'
import { RecipeDetailBody } from '@/features/recipes/RecipeDetailSheet'
import type { RecipeData } from '@/features/recipes/useRecipeData'
import { useLanguage } from '@/i18n/useLanguage'
import { formatQuarters, weekdayName } from './week-format'

export type MealTarget = { date: string; slot: MealSlot; dayTitle: string }

type MealSheetProps = {
  target: MealTarget | null
  meal: PlannedMeal | undefined
  data: RecipeData
  /** Standard portions to cook, incl. guests and tomorrow's leftovers (#31). */
  portionsToCook: number
  onClose: () => void
  onPickAnother: () => void
  onEatingOut: (eatingOut: boolean) => void
  onGuests: (guests: number) => void
}

/**
 * Tapping a meal (#126): the recipe with amounts for the household, plus
 * "Pick another dish", "Eating out" and guests.
 */
export function MealSheet({ target, meal, data, portionsToCook, onClose, onPickAnother, onEatingOut, onGuests }: MealSheetProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const recipe = meal?.recipeId ? data.recipes.find((r) => r.id === meal.recipeId) : undefined
  const open = target !== null && meal !== undefined
  const slotName = target ? t(`week.slots.${target.slot}`) : ''
  const eatingOut = meal?.status === 'eatingOut'
  const showRecipe = recipe && !eatingOut
  const name = (id: string) => data.household.people.find((p) => p.id === id)?.name ?? ''

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={showRecipe ? localize(recipe.name, language) : slotName}
      description={target ? `${slotName} · ${target.dayTitle}` : undefined}
      footer={
        open ? (
          <Button variant="outline" onClick={onPickAnother}>
            <ListIcon aria-hidden />
            {t('week.meal.pickAnother')}
          </Button>
        ) : null
      }
    >
      {open && target && meal ? (
        <div className="space-y-5">
          <div className="space-y-3 rounded-2xl border p-3">
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span className="font-medium">{t('week.meal.eatingOut')}</span>
              <Switch checked={eatingOut} onCheckedChange={(on) => onEatingOut(on)} />
            </label>
            <div className="flex min-h-11 items-center justify-between gap-3">
              <span id="meal-guests" className="font-medium">
                {t('week.meal.guests')}
              </span>
              <div role="group" aria-labelledby="meal-guests" className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label={t('week.meal.fewerGuests')}
                  disabled={meal.guests <= 0}
                  onClick={() => onGuests(meal.guests - 1)}
                >
                  <MinusIcon />
                </Button>
                <output aria-live="polite" className="min-w-8 text-center font-semibold tabular-nums">
                  {meal.guests}
                </output>
                <Button variant="outline" size="icon" className="rounded-full" aria-label={t('week.meal.moreGuests')} onClick={() => onGuests(meal.guests + 1)}>
                  <PlusIcon />
                </Button>
              </div>
            </div>
          </div>

          {eatingOut ? <p className="text-muted-foreground">{t('week.meal.eatingOutText')}</p> : null}

          {showRecipe && Object.keys(meal.portions).length > 0 ? (
            <section aria-labelledby="meal-portions">
              <h3 id="meal-portions" className="mb-2 font-semibold">
                {t('week.meal.portions')}
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {Object.entries(meal.portions).map(([id, portion]) => (
                  <li key={id} className="rounded-lg bg-secondary px-2 py-1 text-sm text-secondary-foreground tabular-nums">
                    {name(id)}: {formatQuarters(portion)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {showRecipe && meal.status === 'leftovers' && meal.leftoversFrom ? (
            <p className="text-muted-foreground">{t('week.meal.leftoversHint', { day: weekdayName(meal.leftoversFrom, language) })}</p>
          ) : null}

          {showRecipe ? <RecipeDetailBody key={recipe.id} recipe={recipe} data={data} initialPortions={portionsToCook} /> : null}
        </div>
      ) : null}
    </BottomSheet>
  )
}
