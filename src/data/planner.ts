/**
 * The week-plan generator (milestone E). Pure functions: the caller loads the
 * data through the repository and saves the result.
 *
 * Rules (see docs/DECISIONS.md):
 * - No dinner on the household's fixed "no dinner at home" days (#107).
 *   Lunch = leftovers from the previous day's dinner; Monday uses the
 *   previous week's Sunday; after any dinner not cooked at home the next
 *   lunch is a quick lunch (#13, #30, #108).
 * - Excluded food is never suggested (#18, #68). Dinners take ≤ 30 min (#97).
 * - No repeated dinner within a week, no same protein source two days in a
 *   row, favourites twice as likely (#14, #96). Other meals never repeat on
 *   consecutive days (#95). Dislikes are avoided where possible (#28, #181).
 * - Evening snack every day; cheat snack only on cheat days (#21, #98).
 * - If rules cannot all be met they are relaxed in a fixed order (#100, #110).
 * - Portions are scaled per person to the protein target (#19, #27, #101).
 * - Allergies are a hard rule (#180): a dish with an allergen for anyone
 *   eating the meal is never suggested; safe alternatives (e.g. gluten-free
 *   pasta) are used for everyone at the meal. Never relaxed.
 * - Food someone doesn't tolerate is just as strict (#181), unless it can be
 *   left out of their portion or swapped for a milder alternative.
 */
import { addDays, getISODay, parseISO } from 'date-fns'
import { blockedAt, blocksAnything, ingredientParts, recipeSafety, substitutionKey, withSubstitutions, type Blocked, type RecipeSafety } from './allergens'
import { allTranslations } from './localize'
import { mealOn, onlyMealsOn } from './meals'
import { recipeNutrition, recipeTags, type RecipeNutrition } from './nutrition'
import {
  currentTargets,
  eatsMeal,
  mealPortions,
  personDayNutrition,
  plannedTargetG,
  proteinBoost,
  totalPortions,
  type BoostPlan,
} from './protein'
import type {
  DayPlan,
  HouseholdSettings,
  Id,
  Ingredient,
  IsoDate,
  MealExtra,
  MealSlot,
  PlannedMeal,
  Recipe,
  Timestamp,
  WeekId,
  Weekday,
  WeekPlan,
} from './types'
import { datesOfWeek, shiftWeek, toIsoDate, weekIdOf } from './week'

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

/** Every ingredient in a recipe, including what its blends and sauces contain (#181). */
export function recipeIngredientIds(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>): Set<Id> {
  return new Set(recipe.ingredients.flatMap((l) => {
    const ingredient = ingredients.get(l.ingredientId)
    return ingredient ? ingredientParts(ingredient) : [l.ingredientId]
  }))
}

/** Ids of the people – adults and children (#181) – who dislike something in the recipe (#28). */
function dislikedBy(recipe: Recipe, ingredients: ReadonlyMap<Id, Ingredient>, household: HouseholdSettings, eaters: (person: HouseholdSettings['people'][number]) => boolean): Id[] {
  const ids = recipeIngredientIds(recipe, ingredients)
  return household.people.filter((p) => eaters(p) && p.dislikedIngredientIds.some((id) => ids.has(id))).map((p) => p.id)
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
  /** "Favourites only" week (#123, #131): favourites first, then regular dishes. */
  readonly favoritesOnly: boolean

  constructor(ctx: PlannerContext, favoritesOnly = false) {
    this.ctx = ctx
    this.random = ctx.random ?? Math.random
    this.household = ctx.household
    this.favoritesOnly = favoritesOnly
    this.allowed = ctx.recipes.filter((r) => isRecipeAllowed(r, ctx.ingredients, ctx.household))
  }

  /** Picks with the soft rules; in a favourites week a favourite is preferred while all other rules hold. */
  choose(candidates: Recipe[], rules: Rule[]): Recipe | undefined {
    return pick(candidates, this.favoritesOnly ? [(r) => r.favorite, ...rules] : rules, this.random)
  }

  recipe(id: Id | undefined): Recipe | undefined {
    return id ? this.ctx.recipes.find((r) => r.id === id) : undefined
  }

  /** Nutrition of one standard portion, as cooked with the meal's alternatives (#180). */
  nutritionOf(id: Id, substitutions?: Record<Id, Id>): RecipeNutrition | undefined {
    const key = `${id}|${substitutionKey(substitutions)}`
    if (!this.nutrition.has(key)) {
      const recipe = this.recipe(id)
      if (recipe) this.nutrition.set(key, recipeNutrition(withSubstitutions(recipe, substitutions), this.ctx.ingredients))
    }
    return this.nutrition.get(key)
  }

  private readonly blocked = new Map<string, Blocked>()
  /** Whether the household eats this meal (#183). */
  on(slot: MealSlot): boolean {
    return mealOn(this.household.proteinSplit, slot)
  }

  /** Allergens and not-tolerated food to avoid at a meal (#180, #181). Dinner = everyone, so leftovers are covered. */
  blockedAt(slot: MealSlot, dayIndex: number): Blocked {
    const key = `${slot}|${dayIndex}`
    if (!this.blocked.has(key)) this.blocked.set(key, blockedAt(this.household, slot, dayIndex))
    return this.blocked.get(key)!
  }

  safetyOf(recipe: Recipe, slot: MealSlot, dayIndex: number): RecipeSafety {
    return recipeSafety(recipe, this.ctx.ingredients, this.blockedAt(slot, dayIndex))
  }

  /** Hard rule (#180, #181): only dishes that are safe for everyone eating the meal. */
  safe(candidates: Recipe[], slot: MealSlot, dayIndex: number): Recipe[] {
    return candidates.filter((r) => this.safetyOf(r, slot, dayIndex).status === 'safe')
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

  /** Rule: nobody eating this meal dislikes the recipe (#28, #181). */
  noDislikes(slot: MealSlot, dayIndex: number): Rule {
    return (r) => dislikedBy(r, this.ctx.ingredients, this.household, (p) => eatsMeal(p, slot, dayIndex)).length === 0
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

  /**
   * Fills in portions for every person eating a meal (#19, #27), and the safe
   * alternatives the meal needs (#180). Leftovers use the dinner's eaters, so
   * they get the same alternatives as the dinner they come from.
   */
  withPortions(day: DayPlan, dayIndex: number): DayPlan {
    const meals = { ...day.meals }
    for (const slot of Object.keys(meals) as MealSlot[]) {
      const meal: PlannedMeal = { ...meals[slot] }
      delete meal.substitutions
      const recipe = (meal.status === 'planned' || meal.status === 'leftovers') && meal.recipeId ? this.recipe(meal.recipeId) : undefined
      if (recipe) {
        const substitutions = this.safetyOf(recipe, meal.status === 'leftovers' ? 'dinner' : slot, dayIndex).substitutions
        if (Object.keys(substitutions).length > 0) meal.substitutions = substitutions
      }
      const protein = recipe ? (this.nutritionOf(recipe.id, meal.substitutions)?.proteinG ?? 0) : 0
      meals[slot] = { ...meal, portions: recipe ? mealPortions(this.household, slot, dayIndex, protein, day.targetsG) : {} }
    }
    return { ...day, meals }
  }
}

/** Lunch for a day: leftovers from yesterday's dinner, or a quick lunch (#13, #30, #108). */
function lunchFor(
  planner: Planner,
  dayIndex: number,
  yesterday: { dinner?: PlannedMeal; date: IsoDate; lunchId?: Id },
  guests: number,
): PlannedMeal {
  const dinner = yesterday.dinner
  if (dinner?.status === 'planned' && dinner.recipeId) {
    return { status: 'leftovers', recipeId: dinner.recipeId, leftoversFrom: yesterday.date, portions: {}, guests }
  }
  const recipe = planner.choose(planner.safe(planner.quickLunches(), 'lunch', dayIndex), [
    planner.notSameAs(yesterday.lunchId),
    planner.noDislikes('lunch', dayIndex),
  ])
  return recipe ? { status: 'planned', recipeId: recipe.id, portions: {}, guests } : emptyMeal('none', guests)
}

/** 0 = Monday … 6 = Sunday. */
export const weekdayOf = (date: IsoDate) => ((getISODay(parseISO(date)) - 1) as Weekday)

const previousDate = (date: IsoDate) => toIsoDate(addDays(parseISO(date), -1))

export interface GenerateOptions {
  weekId: WeekId
  /** Today's date: earlier days of an existing plan are kept (#104). */
  today: IsoDate
  /** The current plan for this week, if any. */
  existing?: WeekPlan
  /** The previous week's plan, for Monday's leftovers (#13). */
  previousWeek?: WeekPlan
  /** Only fill empty meals; everything already planned stays (#121). Default: re-create from today. */
  fillEmptyOnly?: boolean
  /** Favourites first, topped up with regular dishes (#123, #131). */
  favoritesOnly?: boolean
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
      // Drop order (#100, #110): repeats, then protein source; dislikes last.
      const rules: Rule[] = [
        (r) => !used.has(r.id),
        planner.differentSource(i === 0 ? previousWeekSunday : ids[i - 1]),
        planner.noDislikes('dinner', i),
      ]
      const candidates = planner.safe(planner.dinners(), 'dinner', i)
      const recipe = strict
        ? (() => {
            const ok = candidates.filter((r) => rules.every((rule) => rule(r)))
            const favorites = planner.favoritesOnly ? ok.filter((r) => r.favorite) : []
            const pool = favorites.length > 0 ? favorites : ok
            return pool.length > 0 ? weightedPick(pool, planner.random) : undefined
          })()
        : planner.choose(candidates, rules)
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
  const planner = new Planner(ctx, options.favoritesOnly)
  const now = options.now ?? new Date().toISOString()
  const dates = datesOfWeek(options.weekId)
  const targets = currentTargets(ctx.household)
  const days: DayPlan[] = []
  const existingDay = (date: IsoDate) => options.existing?.days.find((d) => d.date === date)
  const isKept = (date: IsoDate) => existingDay(date) !== undefined && date < options.today
  const noDinnerAtHome = (dayIndex: number) => ctx.household.noDinnerAtHomeDays.includes(dayIndex as Weekday)

  /**
   * A meal that stays as it is: "eating out" always; when only filling empty
   * meals, everything that is not empty (#121).
   */
  const fixedMeal = (date: IsoDate, slot: MealSlot): PlannedMeal | undefined => {
    const meal = existingDay(date)?.meals[slot]
    if (!meal) return undefined
    if (meal.status === 'eatingOut') return { ...emptyMeal('eatingOut', meal.guests), extras: meal.extras }
    return options.fillEmptyOnly && meal.status !== 'none' ? meal : undefined
  }
  /** Guests (and, when filling, extras) carry over to a newly picked meal. */
  const carried = (date: IsoDate, slot: MealSlot) => {
    const meal = existingDay(date)?.meals[slot]
    return { guests: meal?.guests ?? 0, extras: options.fillEmptyOnly ? meal?.extras : undefined }
  }
  const withCarried = (meal: PlannedMeal, date: IsoDate, slot: MealSlot): PlannedMeal => {
    const { guests, extras } = carried(date, slot)
    return extras ? { ...meal, guests, extras } : { ...meal, guests }
  }

  const dinnerIds = planDinners(
    planner,
    dates.map((date, i) => {
      const fixed = isKept(date) ? existingDay(date)!.meals.dinner : fixedMeal(date, 'dinner')
      if (fixed) return { kept: fixed.status === 'planned' ? fixed.recipeId : undefined }
      return { cook: planner.on('dinner') && !noDinnerAtHome(i) }
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

    // Meals the household doesn't eat stay empty (#183).
    const off = (slot: MealSlot) => !planner.on(slot)

    // Dinner
    let dinner = off('dinner') ? emptyMeal() : fixedMeal(date, 'dinner')
    if (!dinner) {
      const recipeId = noDinnerAtHome(i) ? undefined : dinnerIds[i]
      dinner = withCarried(recipeId ? { status: 'planned', recipeId, portions: {}, guests: 0 } : emptyMeal(), date, 'dinner')
    }

    // Lunch
    const lunch = off('lunch')
      ? emptyMeal()
      : fixedMeal(date, 'lunch') ??
      withCarried(
        lunchFor(
          planner,
          i,
          { dinner: yesterday?.meals.dinner, date: yesterday?.date ?? previousDate(date), lunchId: yesterday?.meals.lunch.recipeId },
          0,
        ),
        date,
        'lunch',
      )

    // Breakfast and snack
    const simple = (slot: 'breakfast' | 'snack', candidates: Recipe[]): PlannedMeal => {
      if (off(slot)) return emptyMeal()
      const fixed = fixedMeal(date, slot)
      if (fixed) return fixed
      const recipe = planner.choose(planner.safe(candidates, slot, i), [planner.notSameAs(yesterday?.meals[slot].recipeId), planner.noDislikes(slot, i)])
      return withCarried(recipe ? { status: 'planned', recipeId: recipe.id, portions: {}, guests: 0 } : emptyMeal(), date, slot)
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
 * a quick lunch (#105). Meals that are "none", "eating out" or skipped are unchanged.
 */
export function swapMeal(ctx: PlannerContext, options: SwapOptions): { plan: WeekPlan; nextWeek?: WeekPlan } {
  const planner = new Planner(ctx)
  const now = options.now ?? new Date().toISOString()
  const days = options.plan.days.map((d) => ({ ...d, meals: { ...d.meals } }))
  const i = days.findIndex((d) => d.date === options.date)
  if (i < 0) return { plan: options.plan, nextWeek: options.nextWeek }
  const day = days[i]
  const meal = day.meals[options.slot]
  if (meal.status === 'none' || meal.status === 'eatingOut' || meal.status === 'skipped' || !planner.on(options.slot)) {
    return { plan: options.plan, nextWeek: options.nextWeek }
  }

  const prevDay = i === 0 ? options.previousWeek?.days[6] : days[i - 1]
  const nextDay = i === 6 ? options.nextWeek?.days[0] : days[i + 1]
  const neighbours = (slot: MealSlot) => [prevDay?.meals[slot].recipeId, nextDay?.meals[slot].recipeId]
  let nextWeek = options.nextWeek

  let recipe: Recipe | undefined
  if (options.slot === 'dinner') {
    const others = new Set(days.filter((_, j) => j !== i).map((d) => d.meals.dinner.recipeId))
    recipe = pick(
      planner.safe(planner.dinners(), 'dinner', i).filter((r) => r.id !== meal.recipeId),
      [(r) => !others.has(r.id), planner.differentSource(...neighbours('dinner')), planner.noDislikes('dinner', i)],
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
      planner.safe(candidates, options.slot, i).filter((r) => meal.status === 'leftovers' || r.id !== meal.recipeId),
      [planner.notSameAs(...neighbours(options.slot)), planner.noDislikes(options.slot, i)],
      planner.random,
    )
  }
  if (!recipe) return { plan: options.plan, nextWeek: options.nextWeek }
  return applyMeal(planner, { ...options, nextWeek }, recipe.id, now)
}

/**
 * Puts a recipe on a meal, recalculates portions (#114) and lets the next
 * day's lunch follow a dinner: leftovers from this dinner are updated, and an
 * empty lunch becomes leftovers (#13).
 */
function applyMeal(
  planner: Planner,
  options: { plan: WeekPlan; date: IsoDate; slot: MealSlot; nextWeek?: WeekPlan },
  recipeId: Id,
  now: Timestamp,
): { plan: WeekPlan; nextWeek?: WeekPlan } {
  const days = options.plan.days.map((d) => ({ ...d, meals: { ...d.meals } }))
  const i = days.findIndex((d) => d.date === options.date)
  if (i < 0) return { plan: options.plan, nextWeek: options.nextWeek }
  const day = days[i]
  const old = day.meals[options.slot]
  const meal: PlannedMeal = { ...old, status: 'planned', recipeId, portions: {} }
  delete meal.leftoversFrom
  delete meal.replacedLeftoversFrom
  day.meals[options.slot] = meal
  days[i] = planner.withPortions(day, i)

  let nextWeek = options.nextWeek
  const nextDay = i === 6 ? nextWeek?.days[0] : days[i + 1]
  const lunch = nextDay?.meals.lunch
  // Leftovers from this dinner, an empty lunch, or the quick lunch that replaced them (#170).
  const follows =
    lunch &&
    ((lunch.status === 'leftovers' && lunch.leftoversFrom === day.date) || lunch.status === 'none' || lunch.replacedLeftoversFrom === day.date)
  if (options.slot === 'dinner' && nextDay && lunch && follows && planner.on('lunch')) {
    const updated = {
      ...nextDay,
      meals: { ...nextDay.meals, lunch: leftoversOf(lunch, recipeId, day.date) },
    }
    if (i === 6 && nextWeek) {
      nextWeek = { ...nextWeek, days: [planner.withPortions(updated, 0), ...nextWeek.days.slice(1)], updatedAt: now }
    } else if (i < 6) {
      days[i + 1] = planner.withPortions(updated, i + 1)
    }
  }
  return { plan: { ...options.plan, days, updatedAt: now }, nextWeek }
}

export interface SetMealOptions {
  plan: WeekPlan
  date: IsoDate
  slot: MealSlot
  recipeId: Id
  nextWeek?: WeekPlan
  now?: Timestamp
}

/** Puts a recipe the user picked on a meal (#112). Any recipe may be picked, also on a fixed day out. */
export function setMeal(ctx: PlannerContext, options: SetMealOptions): { plan: WeekPlan; nextWeek?: WeekPlan } {
  return applyMeal(new Planner(ctx), options, options.recipeId, options.now ?? new Date().toISOString())
}

/**
 * Marks a meal as "eating out" (#30) or back to empty. When a dinner is eaten
 * out, the next day's leftovers become a quick lunch (#108).
 */
export function setEatingOut(
  ctx: PlannerContext,
  options: { plan: WeekPlan; date: IsoDate; slot: MealSlot; eatingOut: boolean; previousWeek?: WeekPlan; nextWeek?: WeekPlan; now?: Timestamp },
): { plan: WeekPlan; nextWeek?: WeekPlan } {
  return clearMeal(ctx, options, options.eatingOut ? 'eatingOut' : 'none', true)
}

/**
 * "Remove meal" (#168): the household skips the meal on purpose. It no longer
 * counts in the day's protein target, and its extras go with it. A skipped
 * leftovers lunch means fewer dinner portions the day before; a skipped
 * dinner gives the next day a quick lunch (#108).
 */
export function skipMeal(ctx: PlannerContext, options: SwapOptions): { plan: WeekPlan; nextWeek?: WeekPlan } {
  return clearMeal(ctx, options, 'skipped', false)
}

/**
 * "Fill in again" on a skipped meal (#168): lunch gets leftovers from the
 * previous day's dinner if it is cooked at home, otherwise the planner picks
 * a dish as for ↻. Returns the plans unchanged if nothing fits.
 */
export function refillMeal(ctx: PlannerContext, options: SwapOptions): { plan: WeekPlan; nextWeek?: WeekPlan } {
  const unchanged = { plan: options.plan, nextWeek: options.nextWeek }
  const i = options.plan.days.findIndex((d) => d.date === options.date)
  const meal = options.plan.days[i]?.meals[options.slot]
  if (!meal || meal.status !== 'skipped') return unchanged
  const now = options.now ?? new Date().toISOString()
  const days = options.plan.days.map((d) => ({ ...d, meals: { ...d.meals } }))

  if (options.slot === 'lunch') {
    const prevDay = i === 0 ? options.previousWeek?.days[6] : days[i - 1]
    const dinner = prevDay?.meals.dinner
    if (prevDay && dinner?.status === 'planned' && dinner.recipeId) {
      days[i].meals.lunch = { ...meal, status: 'leftovers', recipeId: dinner.recipeId, leftoversFrom: prevDay.date, portions: {} }
      days[i] = new Planner(ctx).withPortions(days[i], i)
      return { plan: { ...options.plan, days, updatedAt: now }, nextWeek: options.nextWeek }
    }
  }
  // Let ↻ pick a dish for a placeholder meal without a recipe.
  days[i].meals[options.slot] = { ...meal, status: 'planned', portions: {} }
  const placeholder = { ...options.plan, days }
  const result = swapMeal(ctx, { ...options, plan: placeholder })
  return result.plan === placeholder ? unchanged : result
}

/** Empties a meal with a new status; a dinner's leftovers lunch the next day becomes a quick lunch (#108). */
function clearMeal(
  ctx: PlannerContext,
  options: { plan: WeekPlan; date: IsoDate; slot: MealSlot; previousWeek?: WeekPlan; nextWeek?: WeekPlan; now?: Timestamp },
  status: 'eatingOut' | 'skipped' | 'none',
  keepExtras: boolean,
): { plan: WeekPlan; nextWeek?: WeekPlan } {
  const now = options.now ?? new Date().toISOString()
  const i = options.plan.days.findIndex((d) => d.date === options.date)
  if (i < 0) return { plan: options.plan, nextWeek: options.nextWeek }
  const days = options.plan.days.map((d) => ({ ...d, meals: { ...d.meals } }))
  const old = days[i].meals[options.slot]
  days[i].meals[options.slot] = { ...emptyMeal(status, old.guests), ...(keepExtras && old.extras ? { extras: old.extras } : {}) }
  let result: { plan: WeekPlan; nextWeek?: WeekPlan } = { plan: { ...options.plan, days, updatedAt: now }, nextWeek: options.nextWeek }

  const nextDay = i === 6 ? options.nextWeek?.days[0] : days[i + 1]
  const lunch = nextDay?.meals.lunch
  if (options.slot === 'dinner' && nextDay && lunch?.status === 'leftovers' && lunch.leftoversFrom === options.date) {
    if (i < 6) {
      const swapped = swapMeal(ctx, { ...options, plan: result.plan, date: nextDay.date, slot: 'lunch', now })
      result = { ...swapped, plan: markReplacedLeftovers(swapped.plan, nextDay.date, options.date) }
    } else if (result.nextWeek) {
      const swapped = swapMeal(ctx, { plan: result.nextWeek, date: nextDay.date, slot: 'lunch', previousWeek: result.plan, now })
      result = { ...result, nextWeek: markReplacedLeftovers(swapped.plan, nextDay.date, options.date) }
    }
  }
  return result
}

/** Turns a lunch into leftovers from a dinner, forgetting any replaced-leftovers mark. */
function leftoversOf(lunch: PlannedMeal, recipeId: Id, dinnerDate: IsoDate): PlannedMeal {
  const meal: PlannedMeal = { ...lunch, status: 'leftovers', recipeId, leftoversFrom: dinnerDate }
  delete meal.replacedLeftoversFrom
  return meal
}

/** Marks a quick lunch as standing in for leftovers from `dinnerDate` (#170). No-op if it is not a quick lunch. */
function markReplacedLeftovers(plan: WeekPlan, lunchDate: IsoDate, dinnerDate: IsoDate): WeekPlan {
  return {
    ...plan,
    days: plan.days.map((d) =>
      d.date === lunchDate && d.meals.lunch.status === 'planned'
        ? { ...d, meals: { ...d.meals, lunch: { ...d.meals.lunch, replacedLeftoversFrom: dinnerDate } } }
        : d,
    ),
  }
}

/**
 * Lets next week's Monday lunch follow this week's Sunday dinner, however the
 * dinner was changed (#13, #143): leftovers from Sunday (or an empty lunch)
 * get the new dinner; if Sunday's dinner is no longer cooked at home,
 * leftovers become a quick lunch (#108). Returns `nextWeek` unchanged otherwise.
 */
export function followSundayDinner(
  ctx: PlannerContext,
  plan: WeekPlan,
  nextWeek: WeekPlan | undefined,
  now = new Date().toISOString(),
): WeekPlan | undefined {
  if (!nextWeek || !mealOn(ctx.household.proteinSplit, 'lunch')) return nextWeek
  const sunday = plan.days[6]
  const monday = nextWeek.days[0]
  const dinner = sunday.meals.dinner
  const lunch = monday.meals.lunch
  const fromSunday = lunch.status === 'leftovers' && lunch.leftoversFrom === sunday.date
  const replaced = lunch.replacedLeftoversFrom === sunday.date

  if (dinner.status === 'planned' && dinner.recipeId) {
    if (!fromSunday && !replaced && lunch.status !== 'none') return nextWeek
    if (fromSunday && lunch.recipeId === dinner.recipeId) return nextWeek
    const updated: DayPlan = { ...monday, meals: { ...monday.meals, lunch: leftoversOf(lunch, dinner.recipeId, sunday.date) } }
    return { ...nextWeek, days: [new Planner(ctx).withPortions(updated, 0), ...nextWeek.days.slice(1)], updatedAt: now }
  }
  if (fromSunday) {
    const swapped = swapMeal(ctx, { plan: nextWeek, date: monday.date, slot: 'lunch', previousWeek: plan, now }).plan
    return markReplacedLeftovers(swapped, monday.date, sunday.date)
  }
  return nextWeek
}

/** Sets the number of guests at a meal (#31). Portions per person do not change. */
export function setGuests(plan: WeekPlan, date: IsoDate, slot: MealSlot, guests: number, now = new Date().toISOString()): WeekPlan {
  return {
    ...plan,
    updatedAt: now,
    days: plan.days.map((d) =>
      d.date === date ? { ...d, meals: { ...d.meals, [slot]: { ...d.meals[slot], guests: Math.max(0, Math.round(guests)) } } } : d,
    ),
  }
}

/** Adds extra items (e.g. protein boosts) to a day's evening snack (#120). */
export function addExtras(plan: WeekPlan, date: IsoDate, extras: MealExtra[], now = new Date().toISOString()): WeekPlan {
  return {
    ...plan,
    updatedAt: now,
    days: plan.days.map((d) =>
      d.date === date ? { ...d, meals: { ...d.meals, snack: { ...d.meals.snack, extras: [...(d.meals.snack.extras ?? []), ...extras] } } } : d,
    ),
  }
}

/** Removes one extra item from a day's evening snack. */
export function removeExtra(plan: WeekPlan, date: IsoDate, index: number, now = new Date().toISOString()): WeekPlan {
  return {
    ...plan,
    updatedAt: now,
    days: plan.days.map((d) =>
      d.date === date
        ? { ...d, meals: { ...d.meals, snack: { ...d.meals.snack, extras: (d.meals.snack.extras ?? []).filter((_, j) => j !== index) } } }
        : d,
    ),
  }
}

/** A week with nothing planned yet (#112). Not saved until the user changes something. */
export function emptyWeekPlan(weekId: WeekId, household: HouseholdSettings, now = new Date().toISOString()): WeekPlan {
  const targets = currentTargets(household)
  return {
    weekId,
    days: datesOfWeek(weekId).map((date) => ({
      date,
      meals: { breakfast: emptyMeal(), lunch: emptyMeal(), dinner: emptyMeal(), snack: emptyMeal() },
      targetsG: { ...targets },
    })),
    createdAt: now,
    updatedAt: now,
  }
}

/** Meals still to be chosen: empty, except dinner on a fixed day out (#107, #133). */
export function emptyMeals(household: HouseholdSettings, day: DayPlan): MealSlot[] {
  const fixedDayOut = household.noDinnerAtHomeDays.includes(weekdayOf(day.date))
  return (Object.keys(day.meals) as MealSlot[]).filter(
    (slot) => day.meals[slot].status === 'none' && mealOn(household.proteinSplit, slot) && !(slot === 'dinner' && fixedDayOut),
  )
}

/** Whether anything is planned on a day (a dish, leftovers or eating out). */
export function dayStarted(day: DayPlan): boolean {
  return Object.values(day.meals).some((m) => m.status !== 'none')
}

// ---------------------------------------------------------------------------
// Protein per day, impact of a pick, boost suggestions
// ---------------------------------------------------------------------------

export interface PersonDayProtein {
  personId: Id
  proteinG: number
  /** The part of the target the planned meals should cover (#109). */
  targetG: number
}

function dayProteinWith(planner: Planner, day: DayPlan): PersonDayProtein[] {
  const fixedDayOut = planner.household.noDinnerAtHomeDays.includes(weekdayOf(day.date))
  return planner.household.people
    .filter((p) => p.kind === 'adult' && day.targetsG[p.id])
    .map((p) => ({
      personId: p.id,
      proteinG: personDayNutrition(onlyMealsOn(day, planner.household), p.id, (id, substitutions) => planner.nutritionOf(id, substitutions), planner.ctx.ingredients).proteinG,
      targetG: plannedTargetG(onlyMealsOn(day, planner.household), p.id, planner.household.proteinSplit, fixedDayOut),
    }))
}

/** Planned protein and target per adult for one day (#118). */
export function dayProtein(ctx: PlannerContext, day: DayPlan): PersonDayProtein[] {
  return dayProteinWith(new Planner(ctx), day)
}

/**
 * For each recipe: how far each adult would be from the day's target if the
 * recipe were picked for this meal (positive = over) (#115, #119).
 */
export function pickImpacts(
  ctx: PlannerContext,
  options: { plan: WeekPlan; date: IsoDate; slot: MealSlot; recipeIds: Id[] },
): Map<Id, { personId: Id; diffG: number }[]> {
  const planner = new Planner(ctx)
  const result = new Map<Id, { personId: Id; diffG: number }[]>()
  for (const recipeId of options.recipeIds) {
    const { plan } = applyMeal(planner, options, recipeId, options.plan.updatedAt)
    const day = plan.days.find((d) => d.date === options.date)
    if (!day) continue
    result.set(
      recipeId,
      dayProteinWith(planner, day).map((p) => ({ personId: p.personId, diffG: p.proteinG - p.targetG })),
    )
  }
  return result
}

/** Boost suggestions for the adults still under target on a day (#103, #115). */
export function boostSuggestions(ctx: PlannerContext, day: DayPlan): { personId: Id; gapG: number; boost: BoostPlan }[] {
  const planner = new Planner(ctx)
  const out: { personId: Id; gapG: number; boost: BoostPlan }[] = []
  for (const p of dayProteinWith(planner, day)) {
    const gapG = p.targetG - p.proteinG
    const boost = proteinBoost(gapG, ctx.ingredients, (i) => isIngredientExcluded(i, ctx.household))
    if (boost) out.push({ personId: p.personId, gapG, boost })
  }
  return out
}

/**
 * How many meals a favourites week had to fill with regular dishes (#132):
 * meals that changed from `before` to `after` and are not favourites.
 */
export function filledNonFavorites(ctx: PlannerContext, before: WeekPlan | undefined, after: WeekPlan): number {
  let count = 0
  after.days.forEach((day, i) => {
    for (const slot of Object.keys(day.meals) as MealSlot[]) {
      const meal = day.meals[slot]
      const old = before?.days[i]?.meals[slot]
      if (meal.status !== 'planned' || !meal.recipeId || (old?.status === meal.status && old.recipeId === meal.recipeId)) continue
      if (!ctx.recipes.find((r) => r.id === meal.recipeId)?.favorite) count++
    }
  })
  return count
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
 * Updates planned weeks after a settings change (#162). From today on:
 * - dishes that no longer fit are replaced – excluded food, a new allergy
 *   (#180), a cheat snack on a day that is no longer a cheat day – or emptied
 *   if nothing else fits;
 * - dinner on a day that just became a fixed day without dinner at home is
 *   removed (the next day's leftovers become a quick lunch, #108);
 * - meals the household no longer eats are emptied, and meals turned back on
 *   are filled – lunch with leftovers where possible (#183);
 * - everything else stays, including dishes the user picked;
 * - portions are recalculated for everyone.
 * `plans` are all stored weeks; the result has the same weeks.
 */
export function adaptToSettings(
  ctx: PlannerContext,
  oldHousehold: HouseholdSettings,
  plans: WeekPlan[],
  today: IsoDate,
  now = new Date().toISOString(),
): { plans: WeekPlan[]; replaced: number } {
  const household = ctx.household
  const byId = new Map(plans.map((p) => [p.weekId, p]))
  const recipes = new Map(ctx.recipes.map((r) => [r.id, r]))
  const active = (p: WeekPlan) => p.days[6].date >= today
  let replaced = 0

  const now_ = new Planner(ctx)
  const before = new Planner({ ...ctx, household: oldHousehold })
  const fits = (meal: PlannedMeal, slot: MealSlot, dayIndex: number) => {
    const recipe = meal.recipeId ? recipes.get(meal.recipeId) : undefined
    if (!recipe) return true
    if (!isRecipeAllowed(recipe, ctx.ingredients, household)) return false
    // A new allergy (#180) or food someone doesn't tolerate (#181): replace dishes that became unsafe. A dish the user
    // already picked despite the warning stays until the allergies change.
    const eaters = meal.status === 'leftovers' ? 'dinner' : slot
    if (now_.safetyOf(recipe, eaters, dayIndex).status === 'unsafe' && before.safetyOf(recipe, eaters, dayIndex).status !== 'unsafe') return false
    const day = dayIndex as Weekday
    const noLongerCheat = oldHousehold.cheatDays.includes(day) && !household.cheatDays.includes(day)
    return !(slot === 'snack' && recipe.snackKind === 'cheat' && noLongerCheat)
  }

  for (const weekId of [...byId.keys()].sort()) {
    let plan = byId.get(weekId)!
    if (!active(plan)) continue
    const previousWeek = byId.get(shiftWeek(weekId, -1))
    let nextWeek = byId.get(shiftWeek(weekId, 1))
    for (let i = 0; i < 7; i++) {
      const date = plan.days[i].date
      if (date < today) continue
      const newlyOut = household.noDinnerAtHomeDays.includes(i as Weekday) && !oldHousehold.noDinnerAtHomeDays.includes(i as Weekday)
      // Dinner first, so the next day's lunch can follow it.
      for (const slot of ['dinner', 'breakfast', 'lunch', 'snack'] as const) {
        const meal = plan.days[i].meals[slot]
        const options = { plan, date, slot, previousWeek, nextWeek, now }
        const isOn = mealOn(household.proteinSplit, slot)
        const wasOn = mealOn(oldHousehold.proteinSplit, slot)
        let result: { plan: WeekPlan; nextWeek?: WeekPlan }
        if (!isOn) {
          // Turned off (#183): empty it; a dinner's leftovers lunch becomes a quick lunch.
          if (meal.status === 'none') continue
          result = setEatingOut(ctx, { ...options, eatingOut: false })
        } else if (!wasOn) {
          // Turned back on (#183): fill it like "Fill in again".
          if (meal.status !== 'none' || (slot === 'dinner' && household.noDinnerAtHomeDays.includes(i as Weekday))) continue
          const placeholder = { ...plan, days: plan.days.map((d, j) => (j === i ? { ...d, meals: { ...d.meals, [slot]: { ...meal, status: 'skipped' as const } } } : d)) }
          result = refillMeal(ctx, { ...options, plan: placeholder })
          if (result.plan === placeholder) continue
        } else if (meal.status !== 'planned' && meal.status !== 'leftovers') {
          continue
        } else if (slot === 'dinner' && newlyOut && meal.status === 'planned') {
          result = setEatingOut(ctx, { ...options, eatingOut: false })
        } else if (!fits(meal, slot, i)) {
          result = swapMeal(ctx, options)
          if (result.plan === plan) result = setEatingOut(ctx, { ...options, eatingOut: false })
        } else continue
        plan = result.plan
        nextWeek = result.nextWeek
        replaced++
      }
    }
    byId.set(weekId, plan)
    if (nextWeek) byId.set(nextWeek.weekId, nextWeek)
  }

  const result = [...byId.values()].map((p) => (active(p) ? refreshPortions(ctx, p, today, now) : p))
  return { plans: result, replaced }
}

/**
 * The week the automatic week plan should make now, if any (#124, #164):
 * next week, from the chosen weekday on, once per week.
 */
export function autoPlanWeek(household: HouseholdSettings, today: IsoDate): WeekId | undefined {
  const auto = household.autoWeekPlan
  if (!auto?.enabled) return undefined
  const next = shiftWeek(weekIdOf(parseISO(today)), 1)
  if (auto.lastMadeFor && auto.lastMadeFor >= next) return undefined
  return weekdayOf(today) >= auto.weekday ? next : undefined
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
  // No leftovers when the household doesn't eat lunch (#183).
  if (!mealOn(ctx.household.proteinSplit, 'lunch')) return total
  if (next) {
    const lunch = next.meals.lunch
    if (lunch.status === 'leftovers' && lunch.leftoversFrom === date) total += totalPortions(lunch.portions, lunch.guests)
  } else if (i === 6) {
    const planner = new Planner(ctx)
    const protein = planner.nutritionOf(dinner.recipeId, dinner.substitutions)?.proteinG ?? 0
    total += totalPortions(mealPortions(ctx.household, 'lunch', 0, protein, currentTargets(ctx.household)), 0)
  }
  return total
}

export type PlanNote =
  | { date: IsoDate; slot: MealSlot; kind: 'repeatedDinner' | 'sameProteinSource' }
  | { date: IsoDate; slot: MealSlot; kind: 'dislike'; personId: Id; ingredientIds: Id[] }

/**
 * Notes to show on the plan: relaxed rules (#100) and dislikes that could
 * not be avoided (#28, #181).
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
      if (!planner.on(slot)) continue
      const meal = day.meals[slot]
      const recipe = planner.recipe(meal.recipeId)
      if (!recipe || (meal.status !== 'planned' && meal.status !== 'leftovers')) continue
      const ids = recipeIngredientIds(recipe, ctx.ingredients)
      for (const person of ctx.household.people) {
        if (meal.portions[person.id] === undefined) continue
        const disliked = person.dislikedIngredientIds.filter((id) => ids.has(id))
        if (disliked.length > 0) notes.push({ date: day.date, slot, kind: 'dislike', personId: person.id, ingredientIds: disliked })
      }
    }
  })
  return notes
}

// ---------------------------------------------------------------------------
// Allergies on the plan (#180)
// ---------------------------------------------------------------------------

/** Safety of the dish on a meal for the people eating it (leftovers: the dinner's eaters). */
export function mealSafety(ctx: PlannerContext, day: DayPlan, slot: MealSlot): RecipeSafety | undefined {
  const meal = day.meals[slot]
  const planner = new Planner(ctx)
  const recipe = (meal.status === 'planned' || meal.status === 'leftovers') && meal.recipeId ? planner.recipe(meal.recipeId) : undefined
  return recipe ? planner.safetyOf(recipe, meal.status === 'leftovers' ? 'dinner' : slot, weekdayOf(day.date)) : undefined
}

/** Safety of every recipe for a meal, for the pick list (#180). */
export function pickSafety(ctx: PlannerContext, date: IsoDate, slot: MealSlot): Map<Id, RecipeSafety> {
  const planner = new Planner(ctx)
  const dayIndex = weekdayOf(date)
  return new Map(ctx.recipes.map((r) => [r.id, planner.safetyOf(r, slot, dayIndex)]))
}

/** True if allergies or food someone doesn't tolerate leave no dish at all for this meal (#180, #181). */
export function noSafeDish(ctx: PlannerContext, date: IsoDate, slot: MealSlot): boolean {
  const planner = new Planner(ctx)
  const dayIndex = weekdayOf(date)
  if (!blocksAnything(planner.blockedAt(slot, dayIndex))) return false
  const pool =
    slot === 'dinner' ? planner.dinners() : slot === 'breakfast' ? planner.breakfasts() : slot === 'snack' ? planner.snacks(dayIndex) : planner.quickLunches()
  return planner.safe(pool, slot, dayIndex).length === 0
}
