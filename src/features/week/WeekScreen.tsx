import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon, SparklesIcon, Undo2Icon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { selfOf } from '@/features/household/household-draft'
import { PLANS_CHANGED } from '@/features/household/save-settings'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { localize } from '@/data/localize'
import { substitutionKey, withSubstitutions } from '@/data/allergens'
import { recipeNutrition } from '@/data/nutrition'
import { useAllergyText } from '@/features/household/allergy-text'
import {
  addExtras,
  boostSuggestions,
  dayProtein,
  dayStarted,
  emptyMeals,
  dinnerPortionsToCook,
  followSundayDinner,
  refreshPortions,
  refillMeal,
  skipMeal,
  emptyWeekPlan,
  filledNonFavorites,
  generateWeekPlan,
  mealSafety,
  noSafeDish,
  pickSafety,
  planNotes,
  removeExtra,
  setEatingOut,
  setGuests,
  setMeal,
  swapMeal,
  weekdayOf,
  type PlannerContext,
} from '@/data/planner'
import { BOOST_THRESHOLD_G, totalPortions } from '@/data/protein'
import { repository } from '@/data/repository'
import { MEAL_SLOTS, type DayPlan, type Id, type IsoDate, type MealSlot, type WeekId, type WeekPlan } from '@/data/types'
import { diffMeals, isCurrent, revertChanges, type MealChange } from '@/data/undo'
import { shiftWeek, toIsoDate, weekIdOf } from '@/data/week'
import { InstallCard } from '@/features/install/InstallCard'
import { useRecipeData } from '@/features/recipes/useRecipeData'
import { withExampleFamily } from '@/features/household/example-family'
import { useLanguage } from '@/i18n/useLanguage'
import type { AllergyNoteTexts } from './AllergyNotes'
import { DayCard } from './DayCard'
import { MealSheet, type MealTarget } from './MealSheet'
import { MoreSheet } from './MoreSheet'
import { PickSheet, type PickTarget } from './PickSheet'
import { mealUndo, popMealStep, popWeekStep, pushMealStep, pushWeekStep, weekUndo, type MealUndoKind, type WeekAction } from './undo-store'
import { formatDay, formatWeek, weekdayName, weekNumber } from './week-format'

/** The plans the screen works on: this week, plus its neighbours for leftovers (#13). */
type Plans = { weekId: WeekId; plan: WeekPlan; previous?: WeekPlan; next?: WeekPlan }
/** A new version of the shown week and the next one (for Monday's leftovers). */
type Change = { plan: WeekPlan; next?: WeekPlan }
/** Which undo button a change belongs to: one meal's ↶ or the top button for a whole-week action (#146). */
type UndoTarget = { meal: { date: IsoDate; slot: MealSlot } } | { week: WeekAction }

/** Sheets close with an animation and their own history entry; wait before opening the next one. */
const SHEET_SWITCH_MS = 350

export function WeekScreen() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const { data, reload } = useRecipeData()
  const [today] = useState(() => toIsoDate(new Date()))
  const [weekId, setWeekId] = useState(() => weekIdOf(new Date()))
  const [plans, setPlans] = useState<Plans | null>(null)
  /** Screen-reader announcement of the last change; replaces the old undo toasts (#146). */
  const [announcement, setAnnouncement] = useState('')
  const [mealTarget, setMealTarget] = useState<MealTarget | null>(null)
  const [pickTarget, setPickTarget] = useState<PickTarget | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  /** Set while asking before replacing the week: with favourites only or not. */
  const [confirmReplace, setConfirmReplace] = useState<{ favoritesOnly: boolean } | null>(null)
  const [alertsOn] = useState(() => repository.getProteinAlertsSync())

  // The ref mirrors the latest state for toast buttons, which run after later changes.
  const plansRef = useRef(plans)
  useEffect(() => {
    plansRef.current = plans
  })

  const ctx = useMemo<PlannerContext | null>(
    () => (data ? { recipes: data.recipes, ingredients: data.ingredientMap, household: data.household } : null),
    [data],
  )

  // Load the week and its neighbours. The undo history lives in undo-store while the app is open (#149).
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
    })
    return () => {
      active = false
    }
  }, [weekId, data])

  // Plans or settings changed elsewhere (settings, wizard, automatic plan): load again (#162, #164).
  useEffect(() => {
    const onChange = () => void reload()
    window.addEventListener(PLANS_CHANGED, onChange)
    return () => window.removeEventListener(PLANS_CHANGED, onChange)
  }, [reload])

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
  // With safe alternatives (#180) the nutrition is computed for the dish as cooked (cheap, so not cached).
  const nutritionOf = useCallback(
    (id: Id, substitutions?: Record<Id, Id>) => {
      if (!substitutionKey(substitutions)) return nutritionById.get(id)
      const recipe = recipesById.get(id)
      return recipe && data ? recipeNutrition(withSubstitutions(recipe, substitutions), data.ingredientMap) : undefined
    },
    [nutritionById, recipesById, data],
  )
  const allergyText = useAllergyText(data?.ingredientMap ?? new Map(), (id) => data?.household.people.find((p) => p.id === id)?.name ?? '')
  /** Safety of every dish for the meal being picked (#180). */
  const pickSafetyMap = useMemo(() => (ctx && pickTarget ? pickSafety(ctx, pickTarget.date, pickTarget.slot) : undefined), [ctx, pickTarget])
  /** Set while asking "Pick anyway?" for a dish with an allergen (#180). */
  const [confirmPick, setConfirmPick] = useState<Id | null>(null)

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
  const withoutTarget = household.people.filter((p) => p.kind === 'adult' && !p.proteinTargetG)
  const dayTitle = (date: IsoDate) => formatDay(date, language, t, true)
  const recipeName = (id: Id | undefined) => localize(id ? recipesById.get(id)?.name : undefined, language)

  // --- Changing the plan --------------------------------------------------

  const personName = (id: Id) => household.people.find((p) => p.id === id)?.name ?? ''

  /** Saves new plan versions and shows them. Only weeks that actually changed are written. */
  function show(current: Plans, change: Change) {
    const updated = { ...current, plan: change.plan, next: change.next }
    plansRef.current = updated
    setPlans(updated)
    if (change.plan !== current.plan) void repository.saveWeekPlan(change.plan)
    if (change.next && change.next !== current.next) void repository.saveWeekPlan(change.next)
  }

  /** Saves a change and records it for the matching undo button (#146). Returns the meals that changed. */
  function apply(change: Change, undoTarget: UndoTarget): MealChange[] {
    const current = plansRef.current
    if (!current) return []
    const before = [current.plan, current.next]
    const changes = diffMeals(before, [change.plan, change.next])
    if (changes.length === 0) return []
    if ('meal' in undoTarget) {
      const { date, slot } = undoTarget.meal
      const own = changes.find((c) => c.date === date && c.slot === slot)
      const hadDish = own?.before.recipeId && (own.before.status === 'planned' || own.before.status === 'leftovers')
      const kind: MealUndoKind = hadDish && own.after.recipeId && own.after.recipeId !== own.before.recipeId ? 'swap' : 'change'
      pushMealStep(date, slot, { kind, previousRecipeId: kind === 'swap' ? own?.before.recipeId : undefined, changes }, before)
    } else {
      pushWeekStep(current.weekId, { action: undoTarget.week, changes })
    }
    show(current, change)
    return changes
  }

  /** ↶ on one meal: one step back (#146). The leftovers lunch that followed a dinner goes back too (#150). */
  function undoMeal(date: IsoDate, slot: MealSlot) {
    const current = plansRef.current
    const step = current && mealUndo(date, slot, [current.plan, current.next]) ? popMealStep(date, slot) : undefined
    if (!current || !step) return
    const [plan] = revertChanges([current.plan], step.changes)
    const [next] = revertChanges([current.next], step.changes)
    show(current, { plan, next })
    afterMealChange(date, plan, t('week.toast.undone'))
  }

  /** The top ↶: undoes the last whole-week action, but not meals changed since (#146, #151). */
  function undoWeek() {
    const current = plansRef.current
    const step = current && weekUndo(current.weekId, [current.plan, current.next]) ? popWeekStep(current.weekId) : undefined
    if (!current || !step) return
    const [plan] = revertChanges([current.plan], step.changes)
    const [next] = revertChanges([current.next], step.changes)
    show(current, { plan, next })
    toast.dismiss()
    setAnnouncement(t('week.toast.undone'))
  }

  /**
   * After a change to a meal: outdated messages go away (#148), screen readers
   * hear what happened, and a finished day gets its summary (#152).
   */
  function afterMealChange(date: IsoDate, changed: WeekPlan, message: string) {
    toast.dismiss()
    setAnnouncement(message)
    const day = changed.days.find((d) => d.date === date)
    if (day) summarizeDay(day)
  }

  /** "Tuesday is planned. Anna: 112 / 120 g (8 g missing) · Ola ✓ [Add boost]" (#152, #153, #154). */
  function summarizeDay(day: DayPlan) {
    if (!alertsOn || !ctx || emptyMeals(household, day).length > 0) return
    const people = dayProtein(ctx, day)
    if (people.length === 0) return
    const status = people
      .map((p) => {
        const values = { name: personName(p.personId), protein: Math.round(p.proteinG), target: Math.round(p.targetG), gap: Math.round(p.targetG - p.proteinG) }
        return values.gap < BOOST_THRESHOLD_G ? t('week.summary.onTarget', values) : t('week.summary.under', values)
      })
      .join(' · ')
    type Suggestion = ReturnType<typeof boostSuggestions>[number]
    const suggestions = boostSuggestions(ctx, day)
    const items = (s: Suggestion) => s.boost.items.map((i) => t(`week.boostShort.${i.key}`)).join(' + ')
    const covers = (s: Suggestion) => s.boost.proteinG >= s.gapG
    const suggestionText = (s: Suggestion) => {
      const values = { name: personName(s.personId), items: items(s), protein: Math.round(s.boost.proteinG), gap: Math.round(s.gapG) }
      return covers(s) ? t('week.summary.boostFor', values) : t('week.summary.boostPartial', values)
    }
    let label = ''
    let detail: string | undefined
    if (suggestions.length === 1) {
      const s = suggestions[0]
      label = t('week.summary.add', { items: items(s), name: personName(s.personId), protein: Math.round(s.boost.proteinG) })
      detail = covers(s) ? undefined : suggestionText(s)
    } else if (suggestions.length > 1) {
      label = t('week.summary.addMany', { names: suggestions.map((s) => personName(s.personId)).join(' + ') })
      detail = t('week.summary.suggestion', { list: suggestions.map(suggestionText).join(' · ') })
    }
    toast(t('week.summary.title', { day: formatDay(day.date, language, t) }), {
      description: (
        <>
          <span className="block">{status}</span>
          {detail ? <span className="mt-1 block">{detail}</span> : null}
        </>
      ),
      duration: suggestions.length > 0 ? 12000 : 6000,
      action:
        suggestions.length > 0
          ? {
              label,
              onClick: () => {
                const current = plansRef.current
                if (!current) return
                const extras = suggestions.flatMap((s) =>
                  s.boost.items.map((b) => ({ personId: s.personId, ingredientId: b.ingredientId, amount: b.amount, unit: b.unit })),
                )
                const plan = addExtras(current.plan, day.date, extras)
                apply({ plan, next: current.next }, { meal: { date: day.date, slot: 'snack' } })
                afterMealChange(day.date, plan, t('week.toast.added'))
              },
            }
          : undefined,
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
    apply(result, { meal: { date, slot } })
    const meal = result.plan.days.find((d) => d.date === date)?.meals[slot]
    afterMealChange(date, result.plan, t('week.toast.swapped', { name: recipeName(meal?.recipeId) }))
  }

  /** A dish with an allergen for someone at the meal needs "Pick anyway" first (#180). */
  function pick(recipeId: Id, confirmed = false) {
    const current = plansRef.current
    if (!current || !ctx || !pickTarget) return
    if (!confirmed && pickSafetyMap?.get(recipeId)?.status === 'unsafe') {
      setConfirmPick(recipeId)
      return
    }
    const { date, slot } = pickTarget
    const old = current.plan.days.find((d) => d.date === date)?.meals[slot]
    const result = setMeal(ctx, { plan: current.plan, date, slot, recipeId, nextWeek: current.next })
    setPickTarget(null)
    apply(result, { meal: { date, slot } })
    const hadDish = old && (old.status === 'planned' || old.status === 'leftovers')
    afterMealChange(date, result.plan, t(hadDish ? 'week.toast.swapped' : 'week.toast.picked', { name: recipeName(recipeId) }))
  }

  function eatingOut(date: IsoDate, slot: MealSlot, on: boolean) {
    const current = plansRef.current
    if (!current || !ctx) return
    const result = setEatingOut(ctx, { plan: current.plan, date, slot, eatingOut: on, previousWeek: current.previous, nextWeek: current.next })
    apply(result, { meal: { date, slot } })
    afterMealChange(date, result.plan, on ? t('week.toast.eatingOut') : t('week.toast.notEatingOut'))
  }

  /** "Remove meal" (#168): a short message, no day summary or boost for the skipped meal. */
  function skip(date: IsoDate, slot: MealSlot) {
    const current = plansRef.current
    if (!current || !ctx) return
    const result = skipMeal(ctx, { plan: current.plan, date, slot, previousWeek: current.previous, nextWeek: current.next })
    apply(result, { meal: { date, slot } })
    const message = t('week.toast.skipped', { slot: t(`week.slots.${slot}`) })
    setAnnouncement(message)
    toast(message)
  }

  /** "Fill in again" on a skipped meal (#168). */
  function refill(date: IsoDate, slot: MealSlot) {
    const current = plansRef.current
    if (!current || !ctx) return
    const result = refillMeal(ctx, { plan: current.plan, date, slot, previousWeek: current.previous, nextWeek: current.next })
    if (result.plan === current.plan) {
      toast(t('week.toast.noAlternative'))
      return
    }
    apply(result, { meal: { date, slot } })
    const meal = result.plan.days.find((d) => d.date === date)?.meals[slot]
    afterMealChange(date, result.plan, t('week.toast.refilled', { name: recipeName(meal?.recipeId) }))
  }

  function changeGuests(date: IsoDate, slot: MealSlot, guests: number) {
    const current = plansRef.current
    if (!current) return
    const plan = setGuests(current.plan, date, slot, guests)
    apply({ plan, next: current.next }, { meal: { date, slot } })
    afterMealChange(date, plan, t('week.toast.guests', { count: guests }))
  }

  function deleteExtra(date: IsoDate, index: number) {
    const current = plansRef.current
    if (!current) return
    const plan = removeExtra(current.plan, date, index)
    apply({ plan, next: current.next }, { meal: { date, slot: 'snack' } })
    afterMealChange(date, plan, t('week.toast.extraRemoved'))
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
    const action: WeekAction = replace ? 'replace' : favoritesOnly ? 'favorites' : planned ? 'fill' : 'make'
    // Next week's Monday lunch follows a changed Sunday dinner (#143).
    apply({ plan: generated, next: followSundayDinner(ctx, generated, current.next) }, { week: action })

    // One short summary for the whole week, without a button (#152).
    const days = generated.days.filter((d) => d.date >= today)
    const lines: string[] = []
    if (alertsOn && days.some((d) => dayProtein(ctx, d).length > 0)) {
      const ok = days.filter(
        (d) => emptyMeals(household, d).length === 0 && dayProtein(ctx, d).every((p) => p.targetG - p.proteinG < BOOST_THRESHOLD_G),
      ).length
      lines.push(t('week.summary.weekDays', { ok, total: days.length }))
    }
    const others = favoritesOnly ? filledNonFavorites(ctx, current.plan, generated) : 0
    if (others > 0) lines.push(t('week.toast.tooFewFavorites', { count: others }))
    const title = t('week.summary.weekTitle', { week: weekNumber(current.weekId) })
    setAnnouncement(title)
    toast(title, { description: lines.length > 0 ? lines.join(' ') : undefined, duration: 8000 })
  }

  /** Development only: puts in the example family and recalculates the shown weeks from today (#142). */
  async function fillExampleFamily() {
    const current = plansRef.current
    if (!current || !ctx) return
    const household = await repository.saveHousehold(withExampleFamily(ctx.household))
    const newCtx = { ...ctx, household }
    for (const week of [current.plan, current.next]) {
      if (week && week.days.some((d) => MEAL_SLOTS.some((s) => d.meals[s].status !== 'none'))) {
        await repository.saveWeekPlan(refreshPortions(newCtx, week, today))
      }
    }
    await reload()
    toast(t('week.dev.done'))
  }

  function changeWeek(step: number) {
    toast.dismiss()
    setWeekId((w) => shiftWeek(w, step))
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
  const shownPlans = [plans.previous, plan, plans.next]
  const topUndo = weekUndo(plans.weekId, shownPlans)

  /** Undo labels and "follows the dinner" texts for one day's meals (#147, #150). */
  function undoInfo(dayIndex: number) {
    const day = plan!.days[dayIndex]
    const undoLabels: Partial<Record<MealSlot, string>> = {}
    for (const slot of MEAL_SLOTS) {
      const step = mealUndo(day.date, slot, shownPlans)
      if (!step) continue
      const values = { slot: t(`week.slots.${slot}`), day: dayTitle(day.date), name: recipeName(step.previousRecipeId) }
      undoLabels[slot] = step.kind === 'swap' ? t('week.undoSwap', values) : t('week.undoChange', values)
    }
    const followsText: Partial<Record<MealSlot, string>> = {}
    const previousDate = dayIndex > 0 ? plan!.days[dayIndex - 1].date : plans!.previous?.days[6]?.date
    const dinnerStep = previousDate ? mealUndo(previousDate, 'dinner', shownPlans) : undefined
    const lunchChange = dinnerStep?.changes.find((c) => c.date === day.date && c.slot === 'lunch')
    if (previousDate && lunchChange && isCurrent(lunchChange, shownPlans)) {
      followsText.lunch = t('week.followsDinner', { day: weekdayName(previousDate, language) })
    }
    return { undoLabels, followsText }
  }

  const pickMeal = pickTarget ? plan.days.find((d) => d.date === pickTarget.date)?.meals[pickTarget.slot] : undefined

  /** Allergy labels for each meal of a day (#180). */
  function allergyInfo(day: DayPlan) {
    const allergyNotes: Partial<Record<MealSlot, AllergyNoteTexts>> = {}
    const noSafe: Partial<Record<MealSlot, boolean>> = {}
    for (const slot of MEAL_SLOTS) {
      const safety = mealSafety(ctx!, day, slot)
      if (safety) {
        allergyNotes[slot] = {
          withText: allergyText.withText(day.meals[slot].substitutions),
          conflicts: allergyText.conflictTexts(safety),
          unknown: safety.status === 'unknown' ? t('allergens.unknown') : undefined,
        }
      } else if (day.date >= today && isEmpty(day.date, slot, day.meals[slot].status)) {
        noSafe[slot] = noSafeDish(ctx!, day.date, slot)
      }
    }
    return { allergyNotes, noSafeDish: noSafe }
  }
  const confirmSafety = confirmPick ? pickSafetyMap?.get(confirmPick) : undefined

  return (
    <>
      <PageHeader
        title={t('screens.week.title')}
        actions={
          topUndo ? (
            <Button variant="secondary" onClick={undoWeek}>
              <Undo2Icon aria-hidden />
              {t('week.undoAction', { action: t(`week.undoActions.${topUndo.action}`) })}
            </Button>
          ) : null
        }
      />
      <InstallCard />

      <div className="space-y-4">
        <nav aria-label={t('week.weekNav')} className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" aria-label={t('week.previousWeek')} onClick={() => changeWeek(-1)}>
            <ChevronLeftIcon />
          </Button>
          <p aria-live="polite" className="text-center font-semibold">
            {formatWeek(weekId, language, t)}
          </p>
          <Button variant="outline" size="icon" aria-label={t('week.nextWeek')} onClick={() => changeWeek(1)}>
            <ChevronRightIcon />
          </Button>
        </nav>

        {!hasAdults ? (
          <p className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
            {t('week.noPeople')}{' '}
            <Link to="/settings/household" className="font-semibold underline underline-offset-2">
              {t('week.noPeopleLink')}
            </Link>
          </p>
        ) : withoutTarget.length > 0 ? (
          <p className="rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
            {t('week.noTarget', { names: withoutTarget.map((p) => p.name).join(', ') })}{' '}
            <Link
              to={withoutTarget[0] === selfOf(household) ? '/settings/profile' : '/settings/household'}
              className="font-semibold underline underline-offset-2"
            >
              {t('week.noTargetLink')}
            </Link>
          </p>
        ) : null}

        {/* Development only (npm run dev), never in the published app (#142). */}
        {import.meta.env.DEV ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-3 text-sm">
            <span className="text-muted-foreground">{t('week.dev.label')}</span>
            <Button variant="outline" size="sm" onClick={() => void fillExampleFamily()}>
              {t('week.dev.exampleFamily')}
            </Button>
          </div>
        ) : null}

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

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <div className="grid gap-3 lg:grid-cols-2">
          {plan.days.map((day, i) => (
            <DayCard
              key={day.date}
              ref={day.date === today ? todayRef : undefined}
              day={day}
              isToday={day.date === today}
              fixedDayOut={fixedDayOut(day.date)}
              people={household.people}
              protein={dayStarted(day) ? (protein[i] ?? []) : []}
              hasEmptyMeals={emptyMeals(household, day).length > 0}
              {...undoInfo(i)}
              {...allergyInfo(day)}
              onUndoMeal={(slot) => undoMeal(day.date, slot)}
              notes={notes.filter((n) => n.date === day.date)}
              recipes={recipesById}
              ingredients={data.ingredientMap}
              nutritionOf={nutritionOf}
              onOpenMeal={(slot) => setMealTarget({ date: day.date, slot, dayTitle: dayTitle(day.date) })}
              onPickMeal={(slot) => setPickTarget({ date: day.date, slot, dayTitle: dayTitle(day.date) })}
              onSwapMeal={(slot) => swap(day.date, slot)}
              onRemoveExtra={(index) => deleteExtra(day.date, index)}
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
        onSkip={() => {
          const target = mealTarget
          setMealTarget(null)
          if (target) skip(target.date, target.slot)
        }}
        onRefill={() => {
          const target = mealTarget
          setMealTarget(null)
          if (target) refill(target.date, target.slot)
        }}
        onEatingOut={(on) => mealTarget && eatingOut(mealTarget.date, mealTarget.slot, on)}
        onGuests={(guests) => mealTarget && changeGuests(mealTarget.date, mealTarget.slot, guests)}
        allergyNotes={mealDay && mealTarget ? allergyInfo(mealDay).allergyNotes[mealTarget.slot] : undefined}
      />

      <PickSheet
        target={pickTarget}
        ctx={ctx}
        plan={plan}
        people={household.people}
        canMarkEatingOut={pickMeal?.status === 'none'}
        onClose={() => setPickTarget(null)}
        onPick={(id) => pick(id)}
        safety={pickSafetyMap}
        allergyText={allergyText}
        onEatingOut={() => {
          const target = pickTarget
          setPickTarget(null)
          if (target) eatingOut(target.date, target.slot, true)
        }}
        // Replace the sheet's history entry, so Back from the form returns to the week plan.
        onNewRecipe={() => navigate('/recipes/new', { replace: true })}
      />

      <ConfirmDialog
        open={confirmPick !== null}
        title={t('allergens.pickAnyway.title')}
        description={
          confirmPick && confirmSafety
            ? t('allergens.pickAnyway.description', { dish: recipeName(confirmPick), ...allergyText.conflictSummary(confirmSafety) })
            : ''
        }
        cancelLabel={t('allergens.pickAnyway.cancel')}
        confirmLabel={t('allergens.pickAnyway.confirm')}
        onCancel={() => setConfirmPick(null)}
        onConfirm={() => {
          const id = confirmPick
          setConfirmPick(null)
          if (id) pick(id, true)
        }}
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
