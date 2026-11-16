/**
 * The week-plan generator (milestone E). Pure functions: the caller loads the
 * data through the repository and saves the result.
 *
 * Rules (see docs/DECISIONS.md):
 * - Friday has no dinner. Lunch = leftovers from the previous day's dinner;
 *   Monday uses the previous week's Sunday; Saturday, or a day after
 *   "eating out", gets a quick lunch (#13, #30).
 * - Excluded food is never suggested (#18, #68). Dinners take ≤ 30 min (#97).
 * - No repeated dinner within a week, no same protein source two days in a
 *   row, favourites twice as likely (#14, #96). Other meals never repeat on
 *   consecutive days (#95). Children's dislikes are avoided where possible (#28).
 * - Evening snack every day; cheat snack only on cheat days (#21, #98).
 * - If rules cannot all be met they are relaxed in a fixed order (#100).
 * - Portions are scaled per person to the protein target (#19, #27, #101).
 */
import { addDays, parseISO } from 'date-fns'
import { allTranslations } from './localize'
import { recipeNutrition, recipeTags, type RecipeNutrition } from './nutrition'
import { currentTargets, FRIDAY, mealPortions, SATURDAY, eatsMeal, totalPortions } from './protein'
import type {
  DayPlan,
  HouseholdSettings,
  Id,
  Ingredient,
  IsoDate,
  MealSlot,
  PlannedMeal,
  Recipe,
  Timestamp,
  WeekId,
  Weekday,
  WeekPlan,
} from './types'
import { datesOfWeek, toIsoDate } from './week'

export const MAX_DINNER_MINUTES = 30

/** Protein sources that count as the same for the variety rule (#96). */
const SOURCE_GROUPS: Record<string, string> = { chicken: 'poultry', turkey: 'poultry' }

export interface PlannerContext {
  recipes: Recipe[]
  ingredients: ReadonlyMap<Id, Ingredient>
  household: HouseholdSettings
  /** Random number in [0, 1). Injected so tests are repeatable. */
  random?: () => number
}

// ---------------------------------------------------------------------------
// Recipe facts
// ---------------------------------------------------------------------------

/** True if an ingredient matches a household exclusion (tag or free text, all languages). */
export function isIngredientExcluded(ingredient: Ingredient, household: HouseholdSettings): boolean {
  if (ingredient.tags.some((tag) => household.excludedTags.includes(tag))) return true
  const terms = household.excludedTerms.map((t) => t.trim().toLowerCase()).filter(Boolean)
  if (terms.length === 0) return false
  const names = allTranslations(ingredient.name).map((n) => n.toLowerCase())
  return terms.some((term) => names.some((name) => name.includes(term)))
}

/** True if a recipe may be suggested: no excluded tag or ingredient (#18, #68). */
export function isRecipeAllowed(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>, household: HouseholdSettings): boolean {
  if (recipeTags(recipe, ingredients).some((tag) => household.excludedTags.includes(tag))) return false
  return recipe.ingredients.every((line) => {
    const ingredient = ingredients.get(line.ingredientId)
    return !ingredient || !isIngredientExcluded(ingredient, household)
  })
}

/** Main protein source: the source of the ingredient giving the most protein, grouped (#96). */
export function mainProteinSource(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>): string | undefined {
  let best: { source: string; protein: number } | undefined
  for (const line of recipe.ingredients) {
    const ingredient = ingredients.get(line.ingredientId)
    if (!ingredient?.proteinSource) continue
    const single = recipeNutrition({ ...recipe, ingredients: [line], servings: 1 }, ingredients)
    if (!best || single.proteinG > best.protein) best = { source: ingredient.proteinSource, protein: single.proteinG }
  }
  return best ? (SOURCE_GROUPS[best.source] ?? best.source) : undefined
}

/** Ids of the household's children who dislike something in the recipe (#28). */
function dislikedBy(recipe: Recipe, household: HouseholdSettings, eaters: (person: HouseholdSettings['people'][number]) => boolean): Id[] {
  const ids = new Set(recipe.ingredients.map((l) => l.ingredientId))
  return household.people
    .filter((p) => p.kind === 'child' && eaters(p) && p.dislikedIngredientIds.some((id) => ids.has(id)))
    .map((p) => p.id)
}

const inCategory = (recipe: Recipe, slot: MealSlot) => recipe.categoryIds.includes(slot)

// ---------------------------------------------------------------------------
// Picking with soft rules
// ---------------------------------------------------------------------------

type Rule = (recipe: Recipe) => boolean

/**
 * Picks a recipe at random (favourites count twice, #14). Rules are listed
 * in the order they may be dropped: if no recipe meets all of them, the
 * first rule is dropped, then the next, and so on (#100).
 */
function pick(candidates: Recipe[], rules: Rule[], random: () => number): Recipe | undefined {
  for (let skip = 0; skip <= rules.length; skip++) {
    const active = rules.slice(skip)
    const ok = candidates.filter((r) => active.every((rule) => rule(r)))
    if (ok.length > 0) return weightedPick(ok, random)
  }
  return undefined
}

function weightedPick(recipes: Recipe[], random: () => number): Recipe {
  const weights = recipes.map((r) => (r.favorite ? 2 : 1))
  let roll = random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < recipes.length; i++) {
    roll -= weights[i]
    if (roll < 0) return recipes[i]
  }
  return recipes[recipes.length - 1]
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

const emptyMeal = (status: PlannedMeal['status'] = 'none', guests = 0): PlannedMeal => ({ status, portions: {}, guests })

class Planner {
  readonly random: () => number
  readonly household: HouseholdSettings
  private readonly nutrition = new Map<Id, RecipeNutrition>()
  private readonly sources = new Map<Id, string | undefined>()
  private readonly allowed: Recipe[]

  readonly ctx: PlannerContext

  constructor(ctx: PlannerContext) {
    this.ctx = ctx
    this.random = ctx.random ?? Math.random
    this.household = ctx.household
    this.allowed = ctx.recipes.filter((r) => isRecipeAllowed(r, ctx.ingredients, ctx.household))
  }

  recipe(id: Id | undefined): Recipe | undefined {
    return id ? this.ctx.recipes.find((r) => r.id === id) : undefined
  }

  nutritionOf(id: Id): RecipeNutrition | undefined {
    if (!this.nutrition.has(id)) {
      const recipe = this.recipe(id)
      if (recipe) this.nutrition.set(id, recipeNutrition(recipe, this.ctx.ingredients))
    }
    return this.nutrition.get(id)
  }

  sourceOf(id: Id | undefined): string | undefined {
    if (!id) return undefined
    if (!this.sources.has(id)) {
      const recipe = this.recipe(id)
      this.sources.set(id, recipe ? mainProteinSource(recipe, this.ctx.ingredients) : undefined)
    }
    return this.sources.get(id)
  }

  dinners = () => this.allowed.filter((r) => inCategory(r, 'dinner') && r.timeMinutes <= MAX_DINNER_MINUTES)
  breakfasts = () => this.allowed.filter((r) => inCategory(r, 'breakfast'))
  quickLunches = () => this.allowed.filter((r) => inCategory(r, 'lunch'))
  snacks(dayIndex: number) {
    const all = this.allowed.filter((r) => inCategory(r, 'snack'))
    const healthy = all.filter((r) => r.snackKind !== 'cheat')
    if (!this.household.cheatDays.includes(dayIndex as Weekday)) return healthy
    const cheat = all.filter((r) => r.snackKind === 'cheat')
    return cheat.length > 0 ? cheat : healthy // #98
  }

  /** Rule: no child eating this meal dislikes the recipe. */
  noDislikes(slot: MealSlot, dayIndex: number): Rule {
    return (r) => dislikedBy(r, this.household, (p) => eatsMeal(p, slot, dayIndex)).length === 0
  }

  /** Rule: not the same recipe as the neighbouring days' meal (#95). */
  notSameAs(...recipeIds: (Id | undefined)[]): Rule {
    return (r) => !recipeIds.includes(r.id)
  }

  /** Rule: different protein source than the neighbouring days' dinners (#96). */
  differentSource(...recipeIds: (Id | undefined)[]): Rule {
    const sources = recipeIds.map((id) => this.sourceOf(id)).filter(Boolean)
    return (r) => {
      const source = this.sourceOf(r.id)
      return !source || !sources.includes(source)
    }
  }

  /** Fills in portions for every person eating a meal (#19, #27). */
  withPortions(day: DayPlan, dayIndex: number): DayPlan {
    const meals = { ...day.meals }
    for (const slot of Object.keys(meals) as MealSlot[]) {
      const meal = meals[slot]
      const active = (meal.status === 'planned' || meal.status === 'leftovers') && meal.recipeId
      const protein = active ? (this.nutritionOf(meal.recipeId!)?.proteinG ?? 0) : 0
      meals[slot] = { ...meal, portions: active ? mealPortions(this.household, slot, dayIndex, protein, day.targetsG) : {} }
    }
    return { ...day, meals }
  }
}

/** Lunch for a day: leftovers from yesterday's dinner, or a quick lunch (#13, #30). */
function lunchFor(
  planner: Planner,
  dayIndex: number,
  yesterday: { dinner?: PlannedMeal; date: IsoDate; lunchId?: Id },
  guests: number,
): PlannedMeal {
  const dinner = yesterday.dinner
  if (dayIndex !== SATURDAY && dinner?.status === 'planned' && dinner.recipeId) {
    return { status: 'leftovers', recipeId: dinner.recipeId, leftoversFrom: yesterday.date, portions: {}, guests }
  }
  const recipe = pick(
    planner.quickLunches(),
    [planner.noDislikes('lunch', dayIndex), planner.notSameAs(yesterday.lunchId)],
    planner.random,
  )
  return recipe ? { status: 'planned', recipeId: recipe.id, portions: {}, guests } : emptyMeal('none', guests)
}

const previousDate = (date: IsoDate) => toIsoDate(addDays(parseISO(date), -1))

export interface GenerateOptions {
  weekId: WeekId
  /** Today's date: earlier days of an existing plan are kept (#104). */
  today: IsoDate
  /** The current plan for this week, if any. */
  existing?: WeekPlan
  /** The previous week's plan, for Monday's leftovers (#13). */
  previousWeek?: WeekPlan
  now?: Timestamp
}

const previousDinnerId = (day: DayPlan | undefined) =>
  day?.meals.dinner.status === 'planned' ? day.meals.dinner.recipeId : undefined

/** How many random attempts are made to meet every dinner rule before relaxing any. */
const DINNER_ATTEMPTS = 50

/**
 * Picks the dinners of a week. Picking day by day can run into a dead end
 * (e.g. only chicken dishes left for two days in a row), so it first tries
 * several times to meet every rule, and only then relaxes rules (#100).
 */
function planDinners(
  planner: Planner,
  days: Array<{ kept?: Id; cook?: boolean }>,
  previousWeekSunday: Id | undefined,
): (Id | undefined)[] {
  const run = (strict: boolean): (Id | undefined)[] | undefined => {
    const used = new Set(days.map((d) => d.kept).filter((id): id is Id => id !== undefined))
    const ids: (Id | undefined)[] = []
    for (let i = 0; i < days.length; i++) {
      if (!days[i].cook) {
        ids.push(days[i].kept)
        continue
      }
      const rules: Rule[] = [
        planner.noDislikes('dinner', i),
        (r) => !used.has(r.id),
        planner.differentSource(i === 0 ? previousWeekSunday : ids[i - 1]),
      ]
      const candidates = planner.dinners()
      const recipe = strict
        ? (() => {
            const ok = candidates.filter((r) => rules.every((rule) => rule(r)))
            return ok.length > 0 ? weightedPick(ok, planner.random) : undefined
          })()
        : pick(candidates, rules, planner.random)
      if (!recipe && strict && candidates.length > 0) return undefined
      if (recipe) used.add(recipe.id)
      ids.push(recipe?.id)
    }
    return ids
  }
  for (let attempt = 0; attempt < DINNER_ATTEMPTS; attempt++) {
    const ids = run(true)
    if (ids) return ids
  }
  return run(false)!
}

/** Creates (or re-creates from today onwards) the plan for a week. */
export function generateWeekPlan(ctx: PlannerContext, options: GenerateOptions): WeekPlan {
  const planner = new Planner(ctx)
  const now = options.now ?? new Date().toISOString()
  const dates = datesOfWeek(options.weekId)
  const targets = currentTargets(ctx.household)
  const days: DayPlan[] = []
  const existingDay = (date: IsoDate) => options.existing?.days.find((d) => d.date === date)
  const isKept = (date: IsoDate) => existingDay(date) !== undefined && date < options.today

  const dinnerIds = planDinners(
    planner,
    dates.map((date, i) => {
      if (isKept(date)) {
        const dinner = existingDay(date)!.meals.dinner
        return { kept: dinner.status === 'planned' ? dinner.recipeId : undefined }
      }
      return { cook: i !== FRIDAY && existingDay(date)?.meals.dinner.status !== 'eatingOut' }
    }),
    previousDinnerId(options.previousWeek?.days[6]),
  )

  dates.forEach((date, i) => {
    const old = existingDay(date)
    if (old && isKept(date)) {
      days.push(old)
      return
    }
    const yesterday = i === 0 ? options.previousWeek?.days[6] : days[i - 1]
    const keep = (slot: MealSlot) => ({
      guests: old?.meals[slot].guests ?? 0,
      eatingOut: old?.meals[slot].status === 'eatingOut',
    })

    // Dinner
    const d = keep('dinner')
    let dinner: PlannedMeal
    if (i === FRIDAY) dinner = emptyMeal('none', d.guests)
    else if (d.eatingOut) dinner = emptyMeal('eatingOut', d.guests)
    else {
      const recipeId = dinnerIds[i]
      dinner = recipeId ? { status: 'planned', recipeId, portions: {}, guests: d.guests } : emptyMeal('none', d.guests)
    }

    // Lunch
    const l = keep('lunch')
    const lunch = l.eatingOut
      ? emptyMeal('eatingOut', l.guests)
      : lunchFor(
          planner,
          i,
          { dinner: yesterday?.meals.dinner, date: yesterday?.date ?? previousDate(date), lunchId: yesterday?.meals.lunch.recipeId },
          l.guests,
        )

    // Breakfast and snack
    const simple = (slot: 'breakfast' | 'snack', candidates: Recipe[]): PlannedMeal => {
      const k = keep(slot)
      if (k.eatingOut) return emptyMeal('eatingOut', k.guests)
      const recipe = pick(
        candidates,
        [planner.noDislikes(slot, i), planner.notSameAs(yesterday?.meals[slot].recipeId)],
        planner.random,
      )
      return recipe ? { status: 'planned', recipeId: recipe.id, portions: {}, guests: k.guests } : emptyMeal('none', k.guests)
    }

    const day: DayPlan = {
      date,
      meals: { breakfast: simple('breakfast', planner.breakfasts()), lunch, dinner, snack: simple('snack', planner.snacks(i)) },
      targetsG: { ...targets },
    }
    days.push(planner.withPortions(day, i))
  })

  return {
    weekId: options.weekId,
    days,
    createdAt: options.existing?.createdAt ?? now,
    updatedAt: now,
  }
}

// ---------------------------------------------------------------------------
// Swap one meal (↻)
// ---------------------------------------------------------------------------

export interface SwapOptions {
  plan: WeekPlan
  date: IsoDate
  slot: MealSlot
  previousWeek?: WeekPlan
  /** The next week's plan, so Monday's leftovers follow a swapped Sunday dinner. */
  nextWeek?: WeekPlan
  now?: Timestamp
}

/**
 * Swaps one meal for another suitable recipe. A swapped dinner updates the
 * next day's lunch if it is still leftovers; a swapped leftovers lunch becomes
 * a quick lunch (#105). Meals that are "none" or "eating out" are unchanged.
 */
export function swapMeal(ctx: PlannerContext, options: SwapOptions): { plan: WeekPlan; nextWeek?: WeekPlan } {
  const planner = new Planner(ctx)
  const now = options.now ?? new Date().toISOString()
  const days = options.plan.days.map((d) => ({ ...d, meals: { ...d.meals } }))
  const i = days.findIndex((d) => d.date === options.date)
  if (i < 0) return { plan: options.plan, nextWeek: options.nextWeek }
  const day = days[i]
  const meal = day.meals[options.slot]
  if (meal.status === 'none' || meal.status === 'eatingOut') return { plan: options.plan, nextWeek: options.nextWeek }

  const prevDay = i === 0 ? options.previousWeek?.days[6] : days[i - 1]
  const nextDay = i === 6 ? options.nextWeek?.days[0] : days[i + 1]
  const neighbours = (slot: MealSlot) => [prevDay?.meals[slot].recipeId, nextDay?.meals[slot].recipeId]
  let nextWeek = options.nextWeek

  let recipe: Recipe | undefined
  if (options.slot === 'dinner') {
    const others = new Set(days.filter((_, j) => j !== i).map((d) => d.meals.dinner.recipeId))
    recipe = pick(
      planner.dinners().filter((r) => r.id !== meal.recipeId),
      [planner.noDislikes('dinner', i), (r) => !others.has(r.id), planner.differentSource(...neighbours('dinner'))],
      planner.random,
    )
  } else {
    const candidates =
      options.slot === 'breakfast'
        ? planner.breakfasts()
        : options.slot === 'snack'
          ? planner.snacks(i)
          : planner.quickLunches()
    recipe = pick(
      candidates.filter((r) => meal.status === 'leftovers' || r.id !== meal.recipeId),
      [planner.noDislikes(options.slot, i), planner.notSameAs(...neighbours(options.slot))],
      planner.random,
    )
  }
  if (!recipe) return { plan: options.plan, nextWeek: options.nextWeek }

  day.meals[options.slot] = { status: 'planned', recipeId: recipe.id, portions: {}, guests: meal.guests }
  days[i] = planner.withPortions(day, i)

  // The next day's leftovers follow the new dinner.
  if (options.slot === 'dinner' && nextDay?.meals.lunch.status === 'leftovers' && nextDay.meals.lunch.leftoversFrom === day.date) {
    const updated = { ...nextDay, meals: { ...nextDay.meals, lunch: { ...nextDay.meals.lunch, recipeId: recipe.id } } }
    if (i === 6 && nextWeek) {
      nextWeek = { ...nextWeek, days: [planner.withPortions(updated, 0), ...nextWeek.days.slice(1)], updatedAt: now }
    } else if (i < 6) {
      days[i + 1] = planner.withPortions(updated, i + 1)
    }
  }

  return { plan: { ...options.plan, days, updatedAt: now }, nextWeek }
}

// ---------------------------------------------------------------------------
// Recalculation, amounts to cook and notes
// ---------------------------------------------------------------------------

/**
 * Re-applies the current targets and household from `fromDate` onwards, e.g.
 * after a protein target changed. Earlier days keep their numbers (#33).
 */
export function refreshPortions(ctx: PlannerContext, plan: WeekPlan, fromDate: IsoDate, now = new Date().toISOString()): WeekPlan {
  const planner = new Planner(ctx)
  const targets = currentTargets(ctx.household)
  const days = plan.days.map((day, i) => (day.date < fromDate ? day : planner.withPortions({ ...day, targetsG: { ...targets } }, i)))
  return { ...plan, days, updatedAt: now }
}

/**
 * Standard portions to cook for a dinner: everyone eating it plus guests, plus
 * the next day's leftovers lunch (FASE1 brief, #31). For Sunday without a
 * next-week plan, Monday's leftovers are estimated with the current household.
 */
export function dinnerPortionsToCook(ctx: PlannerContext, plan: WeekPlan, date: IsoDate, nextWeek?: WeekPlan): number {
  const i = plan.days.findIndex((d) => d.date === date)
  const dinner = plan.days[i]?.meals.dinner
  if (!dinner || dinner.status !== 'planned' || !dinner.recipeId) return 0
  let total = totalPortions(dinner.portions, dinner.guests)

  const next = i === 6 ? nextWeek?.days[0] : plan.days[i + 1]
  if (next) {
    const lunch = next.meals.lunch
    if (lunch.status === 'leftovers' && lunch.leftoversFrom === date) total += totalPortions(lunch.portions, lunch.guests)
  } else if (i === 6) {
    const planner = new Planner(ctx)
    const protein = planner.nutritionOf(dinner.recipeId)?.proteinG ?? 0
    total += totalPortions(mealPortions(ctx.household, 'lunch', 0, protein, currentTargets(ctx.household)), 0)
  }
  return total
}

export type PlanNote =
  | { date: IsoDate; slot: MealSlot; kind: 'repeatedDinner' | 'sameProteinSource' }
  | { date: IsoDate; slot: MealSlot; kind: 'dislike'; personId: Id; ingredientIds: Id[] }

/**
 * Notes to show on the plan: relaxed rules (#100) and children's dislikes
 * that could not be avoided (#28).
 */
export function planNotes(ctx: PlannerContext, plan: WeekPlan, previousWeek?: WeekPlan): PlanNote[] {
  const planner = new Planner(ctx)
  const notes: PlanNote[] = []
  plan.days.forEach((day, i) => {
    const dinnerId = day.meals.dinner.status === 'planned' ? day.meals.dinner.recipeId : undefined
    if (dinnerId) {
      if (plan.days.some((d, j) => j !== i && d.meals.dinner.status === 'planned' && d.meals.dinner.recipeId === dinnerId)) {
        notes.push({ date: day.date, slot: 'dinner', kind: 'repeatedDinner' })
      }
      const prev = i === 0 ? previousWeek?.days[6] : plan.days[i - 1]
      const prevId = prev?.meals.dinner.status === 'planned' ? prev.meals.dinner.recipeId : undefined
      const source = planner.sourceOf(dinnerId)
      if (source && source === planner.sourceOf(prevId)) notes.push({ date: day.date, slot: 'dinner', kind: 'sameProteinSource' })
    }
    for (const slot of Object.keys(day.meals) as MealSlot[]) {
      const meal = day.meals[slot]
      const recipe = planner.recipe(meal.recipeId)
      if (!recipe || (meal.status !== 'planned' && meal.status !== 'leftovers')) continue
      const ids = new Set(recipe.ingredients.map((l) => l.ingredientId))
      for (const person of ctx.household.people) {
        if (person.kind !== 'child' || meal.portions[person.id] === undefined) continue
        const disliked = person.dislikedIngredientIds.filter((id) => ids.has(id))
        if (disliked.length > 0) notes.push({ date: day.date, slot, kind: 'dislike', personId: person.id, ingredientIds: disliked })
      }
    }
  })
  return notes
}
