import { CheckIcon, PlusIcon, RefreshCwIcon, Undo2Icon, XIcon } from 'lucide-react'
import { unitCount } from '@/data/amounts'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { localize } from '@/data/localize'
import type { RecipeNutrition } from '@/data/nutrition'
import type { PersonDayProtein, PlanNote } from '@/data/planner'
import { BOOST_ITEMS, BOOST_THRESHOLD_G } from '@/data/protein'
import { MEAL_SLOTS, type DayPlan, type Id, type Ingredient, type MealExtra, type MealSlot, type Person, type Recipe } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { cn } from '@/lib/utils'
import { AllergyNotes, type AllergyNoteTexts } from './AllergyNotes'
import { formatDay, weekdayName } from './week-format'

export type DayCardProps = {
  day: DayPlan
  isToday: boolean
  /** The household has this weekday as a fixed day out (#107). */
  fixedDayOut: boolean
  people: Person[]
  protein: PersonDayProtein[]
  notes: PlanNote[]
  recipes: ReadonlyMap<Id, Recipe>
  ingredients: ReadonlyMap<Id, Ingredient>
  /** Nutrition of one portion, as cooked with the meal's safe alternatives (#180). */
  nutritionOf: (id: Id, substitutions?: Record<Id, Id>) => RecipeNutrition | undefined
  onOpenMeal: (slot: MealSlot) => void
  onPickMeal: (slot: MealSlot) => void
  onSwapMeal: (slot: MealSlot) => void
  onRemoveExtra: (index: number) => void
  /** Whether the day still has meals to choose (#155). */
  hasEmptyMeals: boolean
  /** Screen-reader label of each meal's undo button; only meals that can be undone (#146, #147). */
  undoLabels: Partial<Record<MealSlot, string>>
  /** Text under a meal that changed along with the previous day's dinner (#150). */
  followsText: Partial<Record<MealSlot, string>>
  onUndoMeal: (slot: MealSlot) => void
  /** Allergy labels per meal (#180). */
  allergyNotes: Partial<Record<MealSlot, AllergyNoteTexts>>
  /** Empty meals for which no dish fits the allergies (#180). */
  noSafeDish: Partial<Record<MealSlot, boolean>>
}

/** One day of the week plan: date, protein per adult (#118) and the four meals (#117, #126, #127). */
export const DayCard = forwardRef<HTMLElement, DayCardProps>(function DayCard(props, ref) {
  const { day, isToday, fixedDayOut, people, protein, notes, hasEmptyMeals } = props
  const { t } = useTranslation()
  const language = useLanguage()
  const title = formatDay(day.date, language, t)
  const headingId = `day-${day.date}`
  const personName = (id: Id) => people.find((p) => p.id === id)?.name ?? ''

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      className={cn('scroll-mt-4 rounded-2xl border bg-card p-3 sm:p-4', isToday && 'border-2 border-primary')}
    >
      <h2 id={headingId} className="flex flex-wrap items-center gap-2 font-semibold">
        {title}
        {isToday ? (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{t('week.today')}</span>
        ) : null}
      </h2>

      {protein.length > 0 ? (
        <div className="mt-2 space-y-1">
          <ul aria-label={t('week.progress.label')} className="flex flex-wrap gap-1.5">
            {protein.map((p) => {
              const gap = Math.round(p.targetG - p.proteinG)
              const ok = gap < BOOST_THRESHOLD_G
              const value = t('week.progress.value', { protein: Math.round(p.proteinG), target: Math.round(p.targetG) })
              return (
                <li
                  key={p.personId}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold tabular-nums',
                    hasEmptyMeals ? 'bg-muted text-muted-foreground' : ok ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground',
                  )}
                >
                  {personName(p.personId)} {value}
                  {hasEmptyMeals ? null : ok ? (
                    <>
                      <CheckIcon aria-hidden className="size-3.5" />
                      <span className="sr-only">{t('week.progress.onTarget')}</span>
                    </>
                  ) : (
                    <> · {t('week.progress.under', { gap })}</>
                  )}
                </li>
              )
            })}
          </ul>
          {hasEmptyMeals ? <p className="text-xs text-muted-foreground">{t('week.progress.emptyMeals')}</p> : null}
        </div>
      ) : null}

      <ul className="mt-2 divide-y">
        {MEAL_SLOTS.map((slot) => (
          <MealRow key={slot} {...props} slot={slot} title={title} fixedDayOut={fixedDayOut} personName={personName} notes={notes.filter((n) => n.slot === slot)} />
        ))}
      </ul>
    </section>
  )
})

function MealRow({
  day,
  slot,
  title,
  fixedDayOut,
  notes,
  recipes,
  ingredients,
  nutritionOf,
  personName,
  onOpenMeal,
  onPickMeal,
  onSwapMeal,
  onRemoveExtra,
  undoLabels,
  followsText,
  onUndoMeal,
  allergyNotes,
  noSafeDish,
}: DayCardProps & { slot: MealSlot; title: string; personName: (id: Id) => string }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const meal = day.meals[slot]
  const slotName = t(`week.slots.${slot}`)
  const recipe = meal.recipeId ? recipes.get(meal.recipeId) : undefined
  const name = recipe ? localize(recipe.name, language) : ''
  const hasDish = (meal.status === 'planned' || meal.status === 'leftovers') && recipe

  const rowButton = 'min-h-11 min-w-0 flex-1 rounded-lg px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring'

  let content: React.ReactNode
  if (hasDish) {
    const protein = Math.round(nutritionOf(recipe.id, meal.substitutions)?.proteinG ?? 0)
    content = (
      <button type="button" className={rowButton} aria-label={t('week.openMeal', { slot: slotName, name })} onClick={() => onOpenMeal(slot)}>
        {meal.status === 'leftovers' && meal.leftoversFrom ? (
          <>
            <span className="block text-sm font-semibold text-primary-text">
              {t('week.leftoversFrom', { day: weekdayName(meal.leftoversFrom, language) })}
            </span>
            <span className="block text-xs text-muted-foreground">
              {name} · {t('recipes.detail.grams', { value: protein })}
            </span>
          </>
        ) : (
          <>
            <span className="block text-sm font-semibold break-words">{name}</span>
            <span className="block text-xs text-muted-foreground">{t('week.meta', { minutes: recipe.timeMinutes, protein })}</span>
          </>
        )}
      </button>
    )
  } else if (meal.status === 'skipped') {
    content = (
      <button type="button" className={cn(rowButton, 'text-sm text-muted-foreground italic')} onClick={() => onOpenMeal(slot)}>
        {t('week.skipped', { slot: slotName })}
      </button>
    )
  } else if (meal.status === 'eatingOut') {
    content = (
      <button type="button" className={cn(rowButton, 'text-sm text-muted-foreground')} onClick={() => onOpenMeal(slot)}>
        {t('week.eatingOut')}
      </button>
    )
  } else if (slot === 'dinner' && fixedDayOut) {
    content = (
      <button
        type="button"
        className={cn(rowButton, 'text-sm text-muted-foreground italic')}
        aria-label={`${t('week.noDinnerAtHome')}. ${t('week.pickDishFor', { slot: slotName, day: title })}`}
        onClick={() => onPickMeal(slot)}
      >
        {t('week.noDinnerAtHome')}
      </button>
    )
  } else {
    content = (
      <button
        type="button"
        aria-label={t('week.pickDishFor', { slot: slotName, day: title })}
        className="flex min-h-11 flex-1 items-center gap-1 rounded-lg border-2 border-dashed px-2 text-sm font-semibold text-primary-text outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onPickMeal(slot)}
      >
        <PlusIcon aria-hidden className="size-4" />
        {t('week.pickDish')}
      </button>
    )
  }

  const extras = meal.extras ?? []
  const undoLabel = undoLabels[slot]
  const follows = followsText[slot]
  const allergy = hasDish ? allergyNotes[slot] : undefined
  const showAllergy = allergy && (allergy.withText || allergy.conflicts.length > 0 || allergy.unknown)

  return (
    <li className="grid grid-cols-[4.5rem_1fr_auto] items-start gap-x-2 py-1.5 sm:grid-cols-[6rem_1fr_auto]">
      <span className="pt-3 text-xs font-medium text-muted-foreground">{slotName}</span>
      <div className="min-w-0">
        <div className="flex">{content}</div>
        {follows ? <p className="px-1 pb-1 text-xs text-muted-foreground">{follows}</p> : null}
        {showAllergy ? <AllergyNotes notes={allergy} className="px-1 pb-1" /> : null}
        {noSafeDish[slot] && meal.status === 'none' ? <p className="px-1 pb-1 text-xs font-semibold text-destructive">{t('allergens.noSafeDish')}</p> : null}
        {notes.length > 0 || extras.length > 0 ? (
          <div className="flex flex-wrap gap-1 px-1 pb-1">
            {notes.map((note, i) => (
              <span key={i} className="rounded-md bg-warning px-1.5 py-0.5 text-xs font-semibold text-warning-foreground">
                {note.kind === 'dislike'
                  ? t('week.notes.dislike', {
                      name: personName(note.personId),
                      ingredients: note.ingredientIds.map((id) => localize(ingredients.get(id)?.name, language).toLocaleLowerCase(language)).join(', '),
                    })
                  : t(`week.notes.${note.kind}`)}
              </span>
            ))}
            {extras.map((extra, i) => (
              <ExtraLabel key={i} extra={extra} personName={personName(extra.personId)} onRemove={() => onRemoveExtra(i)} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex gap-1">
        {undoLabel ? (
          <Button variant="outline" size="icon" className="rounded-xl border-2 border-primary" aria-label={undoLabel} title={undoLabel} onClick={() => onUndoMeal(slot)}>
            <Undo2Icon aria-hidden />
          </Button>
        ) : null}
        {hasDish ? (
          <Button
            variant="secondary"
            size="icon"
            className="rounded-xl text-primary-text"
            aria-label={t('week.swap', { slot: slotName, day: title })}
            title={t('week.swap', { slot: slotName, day: title })}
            onClick={() => onSwapMeal(slot)}
          >
            <RefreshCwIcon aria-hidden />
          </Button>
        ) : undoLabel ? null : (
          <span aria-hidden className="size-11" />
        )}
      </div>
    </li>
  )
}

function ExtraLabel({ extra, personName, onRemove }: { extra: MealExtra; personName: string; onRemove: () => void }) {
  const { t } = useTranslation()
  const key = BOOST_ITEMS.find((b) => b.ingredientId === extra.ingredientId)?.key
  const item = key ? t(`week.boost.${key}`) : `${extra.amount} ${t(`units.short.${extra.unit}`, { count: unitCount(extra.amount) })}`
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-secondary py-0.5 pl-1.5 text-xs font-semibold text-secondary-foreground">
      {t('week.extra', { name: personName, item })}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t('week.removeExtra', { name: personName, item })}
        className="relative inline-flex size-6 items-center justify-center rounded outline-none after:absolute after:-inset-2.5 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <XIcon aria-hidden className="size-3.5" />
      </button>
    </span>
  )
}
