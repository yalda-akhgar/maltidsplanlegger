/**
 * Saving household settings: the household is stored, and planned weeks are
 * updated from today (#162) with the change recorded for the week plan's top
 * "Undo".
 */
import { adaptToSettings, autoPlanWeek, emptyWeekPlan, generateWeekPlan } from '@/data/planner'
import { repository } from '@/data/repository'
import type { HouseholdSettings, IsoDate, WeekPlan } from '@/data/types'
import { diffMeals } from '@/data/undo'
import { shiftWeek, toIsoDate, weekIdOf } from '@/data/week'
import { pushWeekStep, type WeekAction } from '@/features/week/undo-store'
import { toast } from '@/lib/toast'
import type { TFunction } from 'i18next'

/** Fired when week plans or the household changed outside the week-plan screen, so it reloads. */
export const PLANS_CHANGED = 'mp:plans-changed'
const notifyPlansChanged = () => window.dispatchEvent(new Event(PLANS_CHANGED))

/** Saves changed plans and records each week's changes for its top "Undo". */
async function savePlans(before: WeekPlan[], after: WeekPlan[], action: WeekAction, household: HouseholdSettings) {
  for (const plan of after) {
    const old = before.find((p) => p.weekId === plan.weekId) ?? emptyWeekPlan(plan.weekId, household)
    const changes = diffMeals([old], [plan])
    if (changes.length > 0) pushWeekStep(plan.weekId, { action, changes })
    await repository.saveWeekPlan(plan)
  }
}

/**
 * Saves the household and adapts the planned weeks. Returns how many dishes
 * were replaced because they no longer fit, and how many weeks were updated.
 */
export async function saveSettings(oldHousehold: HouseholdSettings, household: HouseholdSettings): Promise<{ replaced: number; weeks: number }> {
  const saved = await repository.saveHousehold(household)
  const [recipes, ingredients, plans] = await Promise.all([repository.listRecipes(), repository.listIngredients(), repository.listWeekPlans()])
  const ctx = { recipes, ingredients: new Map(ingredients.map((i) => [i.id, i])), household: saved }
  const today = toIsoDate(new Date())
  const { plans: adapted, replaced } = adaptToSettings(ctx, oldHousehold, plans, today)
  const changed = adapted.filter((p) => !plans.includes(p))
  await savePlans(plans, changed, 'settings', saved)
  notifyPlansChanged()
  return { replaced, weeks: changed.length }
}

/** First run of the wizard: make the week plan from today (#24, #158). */
export async function makeFirstWeekPlan(household: HouseholdSettings): Promise<void> {
  const [recipes, ingredients] = await Promise.all([repository.listRecipes(), repository.listIngredients()])
  const ctx = { recipes, ingredients: new Map(ingredients.map((i) => [i.id, i])), household }
  const today = toIsoDate(new Date())
  const weekId = weekIdOf(new Date())
  const [existing, previousWeek] = await Promise.all([repository.getWeekPlan(weekId), repository.getWeekPlan(shiftWeek(weekId, -1))])
  // Start from an empty week, so past days stay empty (#139).
  const plan = generateWeekPlan(ctx, { weekId, today, existing: existing ?? emptyWeekPlan(weekId, household), previousWeek, fillEmptyOnly: true })
  await savePlans(existing ? [existing] : [], [plan], 'make', household)
  notifyPlansChanged()
}

let autoPlanRunning = false

/**
 * Automatic week plan (#164): when due, fills next week's empty meals and
 * returns its week id (for the message). Runs once per app start.
 */
export async function runAutoWeekPlan(today: IsoDate = toIsoDate(new Date())): Promise<string | undefined> {
  if (autoPlanRunning) return undefined
  autoPlanRunning = true
  const household = await repository.getHousehold()
  const weekId = autoPlanWeek(household, today)
  if (!weekId || !household.autoWeekPlan) return undefined
  const [recipes, ingredients, existing, previousWeek] = await Promise.all([
    repository.listRecipes(),
    repository.listIngredients(),
    repository.getWeekPlan(weekId),
    repository.getWeekPlan(shiftWeek(weekId, -1)),
  ])
  const ctx = { recipes, ingredients: new Map(ingredients.map((i) => [i.id, i])), household }
  const plan = generateWeekPlan(ctx, {
    weekId,
    today,
    existing,
    previousWeek,
    fillEmptyOnly: true,
    favoritesOnly: household.autoWeekPlan.favoritesOnly,
  })
  await savePlans(existing ? [existing] : [], [plan], 'auto', household)
  await repository.saveHousehold({ ...household, autoWeekPlan: { ...household.autoWeekPlan, lastMadeFor: weekId } })
  notifyPlansChanged()
  return weekId
}

/** "Saved. 2 dishes in the week plan were replaced …" (#162). */
export function showSavedToast(t: TFunction, result: { replaced: number; weeks: number }) {
  const description =
    result.replaced > 0 ? t('settings.replaced', { count: result.replaced }) : result.weeks > 0 ? t('settings.recalculated') : undefined
  toast(t('settings.saved'), { description })
}
