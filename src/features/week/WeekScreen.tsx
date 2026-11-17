import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon, SparklesIcon, Undo2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { localize } from '@/data/localize'
import { recipeNutrition } from '@/data/nutrition'
import {
  addExtras,
  boostSuggestions,
  dayProtein,
  dinnerPortionsToCook,
  emptyWeekPlan,
  filledNonFavorites,
  generateWeekPlan,
  planNotes,
  removeExtra,
  setEatingOut,
  setGuests,
  setMeal,
  swapMeal,
  weekdayOf,
  type PlannerContext,
} from '@/data/planner'
import { totalPortions } from '@/data/protein'
import { repository } from '@/data/repository'
import { MEAL_SLOTS, type Id, type IsoDate, type MealSlot, type WeekId, type WeekPlan } from '@/data/types'
import { shiftWeek, toIsoDate, weekIdOf } from '@/data/week'
import { InstallCard } from '@/features/install/InstallCard'
import { useRecipeData } from '@/features/recipes/useRecipeData'
import { useLanguage } from '@/i18n/useLanguage'
import { DayCard } from './DayCard'
import { MealSheet, type MealTarget } from './MealSheet'
import { MoreSheet } from './MoreSheet'
import { PickSheet, type PickTarget } from './PickSheet'
import { formatDay, formatWeek, weekNumber } from './week-format'

/** The plans the screen works on: this week, plus its neighbours for leftovers (#13). */
type Plans = { weekId: WeekId; plan: WeekPlan; previous?: WeekPlan; next?: WeekPlan }
/** One step of undo history (#122, #129). */
type Snapshot = { plan: WeekPlan; next?: WeekPlan }

/** Sheets close with an animation and their own history entry; wait before opening the next one. */
const SHEET_SWITCH_MS = 350

export function WeekScreen() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const { data } = useRecipeData()
  const [today] = useState(() => toIsoDate(new Date()))
  const [weekId, setWeekId] = useState(() => weekIdOf(new Date()))
  const [plans, setPlans] = useState<Plans | null>(null)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [mealTarget, setMealTarget] = useState<MealTarget | null>(null)
  const [pickTarget, setPickTarget] = useState<PickTarget | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  /** Set while asking before replacing the week: with favourites only or not. */
  const [confirmReplace, setConfirmReplace] = useState<{ favoritesOnly: boolean } | null>(null)
  const [alertsOn] = useState(() => repository.getProteinAlertsSync())

  // Refs mirror the latest state for toast buttons, which run after later changes.
  const plansRef = useRef(plans)
  const historyRef = useRef(history)
  useEffect(() => {
    plansRef.current = plans
    historyRef.current = history
  })

  const ctx = useMemo<PlannerContext | null>(
    () => (data ? { recipes: data.recipes, ingredients: data.ingredientMap, household: data.household } : null),
    [data],
  )

  // Load the week and its neighbours. The undo history belongs to one week (#129).
  useEffect(() => {
    if (!data) return
    let active = true
    void Promise.all([
      repository.getWeekPlan(shiftWeek(weekId, -1)),
      repository.getWeekPlan(weekId),
      repository.getWeekPlan(shiftWeek(weekId, 1)),
    ]).then(([previous, plan, next]) => {
      if (!active) return
      setPlans({ weekId, plan: plan ?? emptyWeekPlan(weekId, data.household), previous, next })
      setHistory([])
    })
    return () => {
      active = false
    }
  }, [weekId, data])

  // Scroll to today once the current week is shown (#117).
  const todayRef = useRef<HTMLElement>(null)
  const scrolledFor = useRef<WeekId | null>(null)
  useEffect(() => {
    if (!plans || scrolledFor.current === plans.weekId) return
    scrolledFor.current = plans.weekId
    if (plans.weekId !== weekIdOf(new Date())) return
    // Only scroll when today is not already in the upper half of the screen (e.g. Monday, or two columns on a PC).
    const card = todayRef.current
    if (card && card.getBoundingClientRect().top > window.innerHeight / 2) card.scrollIntoView({ block: 'start' })
  }, [plans])

  const recipesById = useMemo(() => new Map((data?.recipes ?? []).map((r) => [r.id, r])), [data])
  const nutritionById = useMemo(
    () => new Map((data?.recipes ?? []).map((r) => [r.id, recipeNutrition(r, data!.ingredientMap)])),
    [data],
  )
  const nutritionOf = useCallback((id: Id) => nutritionById.get(id), [nutritionById])

  const plan = plans?.plan
  const notes = useMemo(() => (ctx && plan ? planNotes(ctx, plan, plans?.previous) : []), [ctx, plan, plans?.previous])
  const protein = useMemo(() => (ctx && plan ? plan.days.map((d) => dayProtein(ctx, d)) : []), [ctx, plan])

  if (!data || !ctx || !plans || !plan) return <PageHeader title={t('screens.week.title')} />

  const household = data.household
  const fixedDayOut = (date: IsoDate) => household.noDinnerAtHomeDays.includes(weekdayOf(date))
  const isEmpty = (date: IsoDate, slot: MealSlot, status: string) => status === 'none' && !(slot === 'dinner' && fixedDayOut(date))
  const planned = plan.days.some((d) => MEAL_SLOTS.some((s) => d.meals[s].status !== 'none'))
  const hasEmpty = plan.days.some((d) => d.date >= today && MEAL_SLOTS.some((s) => isEmpty(d.date, s, d.meals[s].status)))
  const fillLabel = planned ? t('week.fillEmpty') : t('week.makePlan')
  const hasAdults = household.people.some((p) => p.kind === 'adult')
  const dayTitle = (date: IsoDate) => formatDay(date, language, t, true)
  const recipeName = (id: Id | undefined) => localize(id ? recipesById.get(id)?.name : undefined, language)

  // --- Changing the plan --------------------------------------------------

  /** Saves a change and remembers the previous state for undo. */
  function commit(change: Snapshot) {
    const current = plansRef.current
    if (!current) return
    setHistory((h) => [...h, { plan: current.plan, next: current.next }])
    setPlans({ ...current, plan: change.plan, next: change.next })
    void repository.saveWeekPlan(change.plan)
    if (change.next && change.next !== current.next) void repository.saveWeekPlan(change.next)
  }

  /** Steps back one change (#122, #129). */
  function undo() {
    const current = plansRef.current
    const steps = historyRef.current
    if (!current || steps.length === 0) return
    const last = steps[steps.length - 1]
    setHistory(steps.slice(0, -1))
    setPlans({ ...current, plan: last.plan, next: last.next })
    void repository.saveWeekPlan(last.plan)
    if (last.next && last.next !== current.next) void repository.saveWeekPlan(last.next)
    toast(t('week.toast.undone'))
  }

  /** One message after a swap or pick: Undo, plus a boost if protein is missing (#115, #122, #130). */
  function announce(title: string, date: IsoDate, changed: WeekPlan) {
    const day = changed.days.find((d) => d.date === date)
    const suggestions = alertsOn && day && ctx ? boostSuggestions(ctx, day) : []
    if (suggestions.length === 0) {
      toast(title, { duration: 8000, action: { label: t('week.undo'), onClick: undo } })
      return
    }
    const name = (id: Id) => household.people.find((p) => p.id === id)?.name ?? ''
    const who = suggestions.map((s) => t('week.toast.who', { name: name(s.personId), gap: Math.round(s.gapG) })).join(', ')
    const keys = [...new Set(suggestions.map((s) => s.boost.key))]
    const item = keys.length === 1 ? t(`week.boostShort.${keys[0]}`) : undefined
    toast(title, {
      duration: 12000,
      description: `${t('week.toast.under', { who })} ${item ? t('week.toast.addQuestion', { item }) : t('week.toast.addQuestionMany')}`,
      action: {
        label: item ? t('week.toast.add', { item }) : t('week.toast.addMany'),
        onClick: () => {
          const current = plansRef.current
          if (!current) return
          const extras = suggestions.map((s) => ({ personId: s.personId, ingredientId: s.boost.ingredientId, amount: s.boost.amount, unit: s.boost.unit }))
          commit({ plan: addExtras(current.plan, date, extras), next: current.next })
          toast(t('week.toast.added'))
        },
      },
      cancel: { label: t('week.undo'), onClick: undo },
    })
  }

  function swap(date: IsoDate, slot: MealSlot) {
    const current = plansRef.current
    if (!current || !ctx) return
    const result = swapMeal(ctx, { plan: current.plan, date, slot, previousWeek: current.previous, nextWeek: current.next })
    if (result.plan === current.plan) {
      toast(t('week.toast.noAlternative'))
      return
    }
    commit(result)
    const meal = result.plan.days.find((d) => d.date === date)?.meals[slot]
    announce(t('week.toast.swapped', { name: recipeName(meal?.recipeId) }), date, result.plan)
  }

  function pick(recipeId: Id) {
    const current = plansRef.current
    if (!current || !ctx || !pickTarget) return
    const { date, slot } = pickTarget
    const old = current.plan.days.find((d) => d.date === date)?.meals[slot]
    const result = setMeal(ctx, { plan: current.plan, date, slot, recipeId, nextWeek: current.next })
    setPickTarget(null)
    commit(result)
    const hadDish = old && (old.status === 'planned' || old.status === 'leftovers')
    announce(t(hadDish ? 'week.toast.swapped' : 'week.toast.picked', { name: recipeName(recipeId) }), date, result.plan)
  }

  function eatingOut(date: IsoDate, slot: MealSlot, on: boolean) {
    const current = plansRef.current
    if (!current || !ctx) return
    commit(setEatingOut(ctx, { plan: current.plan, date, slot, eatingOut: on, previousWeek: current.previous, nextWeek: current.next }))
    if (on) toast(t('week.toast.eatingOut'), { action: { label: t('week.undo'), onClick: undo } })
  }

  function fill(favoritesOnly: boolean, replace = false) {
    const current = plansRef.current
    if (!current || !ctx) return
    const generated = generateWeekPlan(ctx, {
      weekId: current.weekId,
      today,
      existing: current.plan,
      previousWeek: current.previous,
      fillEmptyOnly: !replace,
      favoritesOnly,
    })
    commit({ plan: generated, next: current.next })
    const others = favoritesOnly ? filledNonFavorites(ctx, current.plan, generated) : 0
    toast(t(replace ? 'week.toast.replaced' : 'week.toast.filled'), {
      description: others > 0 ? t('week.toast.tooFewFavorites', { count: others }) : undefined,
      duration: others > 0 ? 10000 : 6000,
      action: { label: t('week.undo'), onClick: undo },
    })
  }

  const openPickAfterSheet = (target: PickTarget) => window.setTimeout(() => setPickTarget(target), SHEET_SWITCH_MS)

  // --- Rendering -----------------------------------------------------------

  const mealDay = mealTarget ? plan.days.find((d) => d.date === mealTarget.date) : undefined
  const meal = mealDay && mealTarget ? mealDay.meals[mealTarget.slot] : undefined
  const portionsToCook =
    meal && mealTarget
      ? mealTarget.slot === 'dinner'
        ? dinnerPortionsToCook(ctx, plan, mealTarget.date, plans.next)
        : totalPortions(meal.portions, meal.guests)
      : 0
  const pickMeal = pickTarget ? plan.days.find((d) => d.date === pickTarget.date)?.meals[pickTarget.slot] : undefined

  return (
    <>
      <PageHeader
        title={t('screens.week.title')}
        actions={
          history.length > 0 ? (
            <Button variant="secondary" onClick={undo} aria-label={t('week.undoLabel')}>
              <Undo2Icon aria-hidden />
              {t('week.undo')}
            </Button>
          ) : null
        }
      />
      <InstallCard />

      <div className="space-y-4">
        <nav aria-label={t('week.weekNav')} className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" aria-label={t('week.previousWeek')} onClick={() => setWeekId((w) => shiftWeek(w, -1))}>
            <ChevronLeftIcon />
          </Button>
          <p aria-live="polite" className="text-center font-semibold">
            {formatWeek(weekId, language, t)}
          </p>
          <Button variant="outline" size="icon" aria-label={t('week.nextWeek')} onClick={() => setWeekId((w) => shiftWeek(w, 1))}>
            <ChevronRightIcon />
          </Button>
        </nav>

        {!hasAdults ? <p className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">{t('week.noPeople')}</p> : null}

        {!planned ? (
          <div className="rounded-2xl bg-secondary p-4 text-sm">
            <p className="font-semibold text-secondary-foreground">{t('week.emptyTitle', { week: weekNumber(weekId) })}</p>
            <p className="mt-1">{t('week.emptyText')}</p>
          </div>
        ) : null}

        <div className="flex gap-2">
          {hasEmpty ? (
            <Button className="flex-1" onClick={() => fill(false)}>
              <SparklesIcon aria-hidden />
              {fillLabel}
            </Button>
          ) : null}
          {hasEmpty || planned ? (
            <Button variant="secondary" className={hasEmpty ? undefined : 'flex-1'} aria-label={t('week.moreLabel')} onClick={() => setMoreOpen(true)}>
              <EllipsisIcon aria-hidden />
              {t('week.more')}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {plan.days.map((day, i) => (
            <DayCard
              key={day.date}
              ref={day.date === today ? todayRef : undefined}
              day={day}
              isToday={day.date === today}
              fixedDayOut={fixedDayOut(day.date)}
              people={household.people}
              protein={protein[i] ?? []}
              notes={notes.filter((n) => n.date === day.date)}
              recipes={recipesById}
              ingredients={data.ingredientMap}
              nutritionOf={nutritionOf}
              onOpenMeal={(slot) => setMealTarget({ date: day.date, slot, dayTitle: dayTitle(day.date) })}
              onPickMeal={(slot) => setPickTarget({ date: day.date, slot, dayTitle: dayTitle(day.date) })}
              onSwapMeal={(slot) => swap(day.date, slot)}
              onRemoveExtra={(index) => {
                const current = plansRef.current
                if (current) commit({ plan: removeExtra(current.plan, day.date, index), next: current.next })
              }}
            />
          ))}
        </div>
      </div>

      <MealSheet
        target={mealTarget}
        meal={meal}
        data={data}
        portionsToCook={portionsToCook}
        onClose={() => setMealTarget(null)}
        onPickAnother={() => {
          const target = mealTarget
          setMealTarget(null)
          if (target) openPickAfterSheet(target)
        }}
        onEatingOut={(on) => mealTarget && eatingOut(mealTarget.date, mealTarget.slot, on)}
        onGuests={(guests) => {
          const current = plansRef.current
          if (current && mealTarget) commit({ plan: setGuests(current.plan, mealTarget.date, mealTarget.slot, guests), next: current.next })
        }}
      />

      <PickSheet
        target={pickTarget}
        ctx={ctx}
        plan={plan}
        people={household.people}
        canMarkEatingOut={pickMeal?.status === 'none'}
        onClose={() => setPickTarget(null)}
        onPick={pick}
        onEatingOut={() => {
          const target = pickTarget
          setPickTarget(null)
          if (target) eatingOut(target.date, target.slot, true)
        }}
        // Replace the sheet's history entry, so Back from the form returns to the week plan.
        onNewRecipe={() => navigate('/recipes/new', { replace: true })}
      />

      <MoreSheet
        open={moreOpen}
        title={t('week.moreTitle', { week: weekNumber(weekId) })}
        action={fillLabel}
        canFill={hasEmpty}
        canReplace={planned}
        onClose={() => setMoreOpen(false)}
        onFill={(favoritesOnly) => {
          setMoreOpen(false)
          fill(favoritesOnly)
        }}
        onReplace={(favoritesOnly) => {
          setMoreOpen(false)
          window.setTimeout(() => setConfirmReplace({ favoritesOnly }), SHEET_SWITCH_MS)
        }}
      />

      <ConfirmDialog
        open={confirmReplace !== null}
        title={t('week.replaceConfirm.title')}
        description={t('week.replaceConfirm.description')}
        cancelLabel={t('week.replaceConfirm.cancel')}
        confirmLabel={t('week.replaceConfirm.confirm')}
        onCancel={() => setConfirmReplace(null)}
        onConfirm={() => {
          const favoritesOnly = confirmReplace?.favoritesOnly ?? false
          setConfirmReplace(null)
          fill(favoritesOnly, true)
        }}
      />
    </>
  )
}
