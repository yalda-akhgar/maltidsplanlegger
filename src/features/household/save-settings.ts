/**
 * Saving household settings: the household is stored, and planned weeks are
 * updated from today (#162) with the change recorded for the week plan's top
 * "Undo".
 */
import { localize } from '@/data/localize'
import { atHomeIds } from '@/data/pantry'
import { adaptToSettings, autoPlanWeek, emptyWeekPlan, generateWeekPlan, refreshPortions, unsafeUndo } from '@/data/planner'
import { repository } from '@/data/repository'
import type { HouseholdSettings, IsoDate, WeekPlan } from '@/data/types'
import { diffMeals, revertChanges, type MealChange } from '@/data/undo'
import { shiftWeek, toIsoDate, weekIdOf } from '@/data/week'
import { confirmUnsafeUndo } from '@/features/week/undo-anyway'
import { pushMealStep, pushWeekStep, type WeekAction } from '@/features/week/undo-store'
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

/** A meal whose dish (or status) changed – not just its portions. */
const isReplacement = (c: MealChange) => c.before.status !== c.after.status || c.before.recipeId !== c.after.recipeId

/**
 * Gives every dish a settings change replaced its own ↶ on the week plan (#192). A dinner and the
 * next day's lunch that followed it are undone together.
 */
function pushReplacementSteps(replacements: MealChange[], plansBefore: WeekPlan[]) {
  for (const change of replacements) {
    const nextDay = toIsoDate(new Date(Date.parse(`${change.date}T12:00:00`) + 86_400_000))
    const prevDay = toIsoDate(new Date(Date.parse(`${change.date}T12:00:00`) - 86_400_000))
    const partner =
      change.slot === 'dinner'
        ? replacements.find((c) => c.slot === 'lunch' && c.date === nextDay)
        : change.slot === 'lunch'
          ? replacements.find((c) => c.slot === 'dinner' && c.date === prevDay)
          : undefined
    const swapped = change.before.recipeId && change.after.recipeId && change.after.status === 'planned'
    pushMealStep(
      change.date,
      change.slot,
      { kind: swapped ? 'swap' : 'change', previousRecipeId: change.before.recipeId, changes: partner ? [change, partner] : [change] },
      plansBefore,
    )
  }
}

/**
 * "Undo" in the saved message (#192): brings back the dishes the settings change replaced; the settings stay.
 * A dish that doesn't fit an allergy or something someone doesn't tolerate comes back only after "Pick anyway?" (#194).
 */
export async function undoReplacements(changes: MealChange[], t: TFunction): Promise<void> {
  const [recipes, ingredients, household, plans] = await Promise.all([
    repository.listRecipes(),
    repository.listIngredients(),
    repository.getHousehold(),
    repository.listWeekPlans(),
  ])
  const ctx = { recipes, ingredients: new Map(ingredients.map((i) => [i.id, i])), household }
  const today = toIsoDate(new Date())
  const unsafe = unsafeUndo(ctx, plans, changes)
  let toRevert = changes
  if (unsafe.length > 0) {
    const language = repository.getLanguageSync()
    const names = unsafe.map((c) => localize(recipes.find((r) => r.id === c.before.recipeId)?.name, language))
    if (!(await confirmUnsafeUndo(t, names))) toRevert = changes.filter((c) => !unsafe.includes(c))
  }
  const reverted = revertChanges(plans, toRevert)
  for (let i = 0; i < plans.length; i++) {
    // Portions of the restored dishes follow the new settings.
    if (reverted[i] !== plans[i]) await repository.saveWeekPlan(refreshPortions(ctx, reverted[i], today))
  }
  notifyPlansChanged()
}

/**
 * Saves the household and adapts the planned weeks. Returns how many dishes
 * were replaced because they no longer fit, how many weeks were updated, and
 * the replacements (for "Undo").
 */
export async function saveSettings(
  oldHousehold: HouseholdSettings,
  household: HouseholdSettings,
): Promise<{ replaced: number; weeks: number; replacements: MealChange[] }> {
  const saved = await repository.saveHousehold(household)
  const [recipes, ingredients, plans] = await Promise.all([repository.listRecipes(), repository.listIngredients(), repository.listWeekPlans()])
  const ctx = { recipes, ingredients: new Map(ingredients.map((i) => [i.id, i])), household: saved }
  const today = toIsoDate(new Date())
  const { plans: adapted, replaced } = adaptToSettings(ctx, oldHousehold, plans, today)
  const changed = adapted.filter((p) => !plans.includes(p))
  const replacements = diffMeals(plans, changed).filter(isReplacement)
  pushReplacementSteps(replacements, plans)
  await savePlans(plans, changed, 'settings', saved)
  notifyPlansChanged()
  return { replaced, weeks: changed.length, replacements }
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
  // "Use what we have at home first" (#177, #194) also applies to the automatic week plan.
  const atHome = household.useHomeFirst ? atHomeIds(await repository.listPantry()) : undefined
  const ctx = { recipes, ingredients: new Map(ingredients.map((i) => [i.id, i])), household, ...(atHome ? { atHome } : {}) }
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
export function showSavedToast(t: TFunction, result: { replaced: number; weeks: number; replacements?: MealChange[] }) {
  const description =
    result.replaced > 0 ? t('settings.replaced', { count: result.replaced }) : result.weeks > 0 ? t('settings.recalculated') : undefined
  const replacements = result.replacements ?? []
  toast(t('settings.saved'), {
    description,
    // Undo brings the dishes back, not the settings (#192).
    ...(replacements.length > 0
      ? {
          duration: 10000,
          action: { label: t('settings.undoReplaced'), onClick: () => void undoReplacements(replacements, t).then(() => toast(t('settings.replacedUndone'))) },
        }
      : {}),
  })
}
