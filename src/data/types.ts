/**
 * The app's data model. See docs/DECISIONS.md #62–#73 for the reasoning.
 *
 * Everything here is plain data (no functions), so it can be stored in
 * localStorage now and in Supabase (phase 5) later.
 */

// ---------------------------------------------------------------------------
// Basics
// ---------------------------------------------------------------------------

/** Supported UI languages. Add a code here + a locale file to add a language. */
export const LANGUAGES = ['nb', 'de', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

/**
 * Text that can exist in several languages (#65). Seed data has all three;
 * user-written text only has the language it was written in.
 */
export type LocalizedText = Partial<Record<Language, string>>

/** Unique random id (#73). */
export type Id = string

/** Calendar date without time, e.g. "2026-11-16". */
export type IsoDate = string

/** ISO week, e.g. "2026-W47" (weeks start on Monday) (#73). */
export type WeekId = string

/** Date and time, e.g. "2026-11-16T09:30:00.000Z". */
export type Timestamp = string

/** Who created a record: shipped with the app, or added by the user. */
export type RecordSource = 'seed' | 'user'

// ---------------------------------------------------------------------------
// Ingredients (#62–#64, #68, #72)
// ---------------------------------------------------------------------------

/** Fixed list of units (#64). Labels are translated in the locale files. */
export const UNITS = ['g', 'kg', 'ml', 'dl', 'l', 'tbsp', 'tsp', 'pcs', 'pinch', 'pack', 'can'] as const
export type Unit = (typeof UNITS)[number]

/** Store sections for grouping the shopping list (phase 3), as in the prototype. */
export const STORE_SECTIONS = ['produce', 'meatFish', 'dairy', 'bread', 'dryGoods', 'frozen'] as const
export type StoreSection = (typeof STORE_SECTIONS)[number]

/** Nutrition per 100 g of an ingredient. */
export interface Nutrition {
  proteinG: number
  kcal: number
  fiberG: number
  /** Portions of fruit/vegetables (1 portion ≈ 100 g). 0 for non-produce. */
  fruitVegPortions: number
}

export interface Money {
  amount: number
  /** ISO 4217 code, e.g. "NOK", "EUR". */
  currency: string
}

export interface Ingredient {
  id: Id
  name: LocalizedText
  /** Per 100 g. Missing = unknown; counts as 0 and the recipe is flagged (#63). */
  nutritionPer100g?: Nutrition
  /**
   * How many grams one unit weighs, e.g. { pcs: 60 } for an egg,
   * { dl: 35 } for oats, { ml: 1.03 } for milk. `g` and `kg` are implicit.
   */
  gramsPerUnit: Partial<Record<Unit, number>>
  /** Main protein source, used for the variety rule (#23), e.g. "chicken". */
  proteinSource?: string
  /** Tags used for exclusions, e.g. ["pork"], ["fish"], ["nuts"] (#68). */
  tags: string[]
  storeSection: StoreSection
  /** Basic item (oil, salt, spices …): only on the shopping list when marked empty. */
  isStaple: boolean
  /** Optional price for the weekly budget (phase 3). */
  price?: Money & { perUnit: Unit }
  source: RecordSource
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ---------------------------------------------------------------------------
// Categories and recipes (#36, #66, #67, #71)
// ---------------------------------------------------------------------------

/** The four built-in meal slots of a day. */
export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]

/**
 * Recipe category. Categories are data, so new ones (e.g. "Baking") can be
 * added later without code changes (#36). The four built-in categories use
 * the meal slot as their id.
 */
export interface Category {
  id: Id
  name: LocalizedText
  /** Set for the built-in categories the planner fills. */
  mealSlot?: MealSlot
  builtIn: boolean
  sortOrder: number
}

export interface RecipeIngredient {
  ingredientId: Id
  /** Amount for the recipe's base number of servings. */
  amount: number
  unit: Unit
  /** Optional note, e.g. "finely chopped". */
  note?: LocalizedText
}

export interface Recipe {
  id: Id
  name: LocalizedText
  /** One or more categories (#66). */
  categoryIds: Id[]
  timeMinutes: number
  /** Number of adult portions the ingredient amounts are written for. */
  servings: number
  ingredients: RecipeIngredient[]
  /** Steps in order. Optional for snacks (#67). */
  steps: LocalizedText[]
  /** Extra manual tags, on top of those inherited from ingredients (#68). */
  tags: string[]
  kidFriendly: boolean
  favorite: boolean
  /** Only for snacks: healthy every day, cheat only on cheat days (#21, #67). */
  snackKind?: 'healthy' | 'cheat'
  /** Household rating (#71), used from phase 2. */
  rating?: 'up' | 'down'
  /** Optional photo (added in later phases). */
  imageUrl?: string
  source: RecordSource
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ---------------------------------------------------------------------------
// Household (#12, #19, #20, #21, #24, #28, #69, #70)
// ---------------------------------------------------------------------------

export interface Person {
  id: Id
  name: string
  kind: 'adult' | 'child'
  /** Daily protein target in grams – adults only (#19). */
  proteinTargetG?: number
  /** Ingredients this person doesn't like – used for children (#28, #70). */
  dislikedIngredientIds: Id[]
}

/** Share of the daily protein target per meal, in percent (#20). Sums to 100. */
export type ProteinSplit = Record<MealSlot, number>

/** 0 = Monday … 6 = Sunday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface HouseholdSettings {
  /** People in the household; adults/children are counted from this (#69). */
  people: Person[]
  /** Excluded tags, e.g. ["pork"] – pork by default (#18). */
  excludedTags: string[]
  /** Custom exclusions typed by the user, matched against ingredient names (#18, #68). */
  excludedTerms: string[]
  proteinSplit: ProteinSplit
  /** Days on which the evening snack may be a cheat snack (#21). */
  cheatDays: Weekday[]
  language: Language
  /** False until the onboarding wizard has been completed or skipped (#24). */
  onboardingDone: boolean
  updatedAt: Timestamp
}

// ---------------------------------------------------------------------------
// Week plan (#13, #19, #30, #31, #33)
// ---------------------------------------------------------------------------

/**
 * What a meal slot contains:
 * - planned:    a recipe cooked for this meal
 * - leftovers:  leftovers from the previous day's dinner (lunch)
 * - eatingOut:  the household eats out – nothing to cook (#30)
 * - none:       no meal planned (e.g. Friday dinner)
 */
export type MealStatus = 'planned' | 'leftovers' | 'eatingOut' | 'none'

export interface PlannedMeal {
  status: MealStatus
  /** The recipe for planned meals and leftovers. */
  recipeId?: Id
  /** For leftovers: the date of the dinner they come from. */
  leftoversFrom?: IsoDate
  /** Portion size per person, as a multiple of a standard portion (0.75–2×, #27). */
  portions: Record<Id, number>
  /** Extra guests eating this meal; each gets a standard adult portion (#31). */
  guests: number
}

export interface DayPlan {
  date: IsoDate
  meals: Record<MealSlot, PlannedMeal>
  /** Protein targets (g per adult) this day was calculated with (#33). */
  targetsG: Record<Id, number>
}

export interface WeekPlan {
  weekId: WeekId
  /** Always 7 days, Monday to Sunday. */
  days: DayPlan[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ---------------------------------------------------------------------------
// Pantry (phase 3, model reserved now – #25)
// ---------------------------------------------------------------------------

export interface PantryItem {
  id: Id
  /** Catalogue ingredient, or … */
  ingredientId?: Id
  /** … a free-text item (also non-food) not in the catalogue. */
  customName?: string
  status: 'have' | 'empty'
  /** Optional expiry date ("use before") (phase 3). */
  expiresOn?: IsoDate
  updatedAt: Timestamp
}
