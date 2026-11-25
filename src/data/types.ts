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
/**
 * Allergens a person can have (#180): the EU's 14 allergens, with "milk"
 * (allergy to milk protein) and "lactose" (intolerance) kept apart, because
 * lactose-free food still contains milk protein. Order = order in the UI.
 */
export const ALLERGENS = [
  'gluten',
  'milk',
  'lactose',
  'egg',
  'fish',
  'crustaceans',
  'molluscs',
  'nuts',
  'peanuts',
  'soy',
  'sesame',
  'celery',
  'mustard',
  'lupin',
  'sulphites',
] as const
export type Allergen = (typeof ALLERGENS)[number]

/**
 * Store sections, in shop order. "drinks" and "household" hold common items
 * that are not in the catalogue (#190); "other" holds everything the app
 * doesn't recognise (#184 point 6).
 */
export const STORE_SECTIONS = ['produce', 'meatFish', 'dairy', 'bread', 'dryGoods', 'frozen', 'drinks', 'household', 'other'] as const
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
  /** Can only be used in whole pieces, e.g. eggs: scaled amounts round to whole units (#84). */
  wholeUnitsOnly?: boolean
  /** Main protein source, used for the variety rule (#23), e.g. "chicken". */
  proteinSource?: string
  /** Tags used for exclusions, e.g. ["pork"], ["fish"], ["nuts"] (#68). */
  tags: string[]
  /**
   * Allergens in the ingredient, including hidden ones (soy sauce → gluten,
   * soy) (#180). Missing = "allergens not stated" (the user's own ingredients);
   * an empty list = no allergens.
   */
  allergens?: Allergen[]
  /**
   * This ingredient is a safe alternative for another one, e.g. gluten-free
   * pasta for wholewheat pasta (#180). Used for everyone at the meal.
   */
  alternativeFor?: Id
  /**
   * Ingredients a spice blend or sauce contains, e.g. taco seasoning → chili,
   * cumin … (#181). Strictest labelling where brands vary. Someone who doesn't
   * tolerate chili doesn't tolerate taco seasoning either.
   */
  contains?: Id[]
  /**
   * The user's own ingredients (#182): the not-tolerated ingredients the user
   * was asked about when filling in `contains`. Anything someone doesn't
   * tolerate that is not listed here (or in `contains`) counts as "not stated".
   * Seed ingredients are always fully stated.
   */
  containsCheckedFor?: Id[]
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
  /**
   * Can be left out of the portion of someone who doesn't tolerate it, e.g.
   * black pepper on an omelette (#181). Set per recipe: chili in a chili stew
   * can't be left out.
   */
  omittable?: boolean
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
  /** Ingredients this person doesn't like: avoided where possible – a soft rule, for adults and children (#28, #70, #181). */
  dislikedIngredientIds: Id[]
  /**
   * Ingredients this person doesn't tolerate, chosen freely from the catalogue
   * (#181). Strict like allergies: never suggested, unless the ingredient can
   * be left out of their portion or swapped for a milder alternative.
   */
  notToleratedIngredientIds?: Id[]
  /** Allergies and intolerances (#180). Dishes with these are never suggested for meals this person eats. */
  allergies?: Allergen[]
  /** Children only: eats lunch at home Monday–Friday (default no). Always yes on weekends (#102). */
  eatsWeekdayLunchAtHome?: boolean
}

/** Share of the daily protein target per meal, in percent (#20). Sums to 100. */
export type ProteinSplit = Record<MealSlot, number>

/** Settings for the automatic week plan (#124, #164). */
export interface AutoWeekPlan {
  enabled: boolean
  /** From this weekday on, next week's plan is made when the app is opened. */
  weekday: Weekday
  favoritesOnly: boolean
  /** The last week made automatically, so it is made only once. */
  lastMadeFor?: WeekId
}

/** 0 = Monday … 6 = Sunday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface HouseholdSettings {
  /** People in the household; adults/children are counted from this (#69). */
  people: Person[]
  /** Excluded tags, e.g. ["pork"]. Nothing by default (#188). */
  excludedTags: string[]
  /** Custom exclusions typed by the user, matched against ingredient names (#18, #68). */
  excludedTerms: string[]
  proteinSplit: ProteinSplit
  /** Days on which the evening snack may be a cheat snack (#21). */
  cheatDays: Weekday[]
  /** Fixed weekdays the household doesn't eat dinner at home, e.g. [4] = Friday. Default none (#107). */
  noDinnerAtHomeDays: Weekday[]
  // The UI language is NOT here: it is chosen per person/device (#74).
  /** "Make new week plan automatically" (#124, #164). Off when missing. */
  autoWeekPlan?: AutoWeekPlan
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
 * - skipped:    the household skips the meal on purpose, e.g. low appetite (#168).
 *               Planned ahead; different from the phase-2 outcome "skipped" (#106).
 * - none:       nothing planned yet (an empty slot), or dinner on a fixed day out (#107)
 */
export type MealStatus = 'planned' | 'leftovers' | 'eatingOut' | 'skipped' | 'none'

export interface PlannedMeal {
  status: MealStatus
  /** The recipe for planned meals and leftovers. */
  recipeId?: Id
  /**
   * Safe alternatives used for everyone at this meal because of allergies,
   * as original ingredient id → alternative ingredient id (#180). Leftovers
   * use the same as the dinner they come from.
   */
  substitutions?: Record<Id, Id>
  /** For leftovers: the date of the dinner they come from. */
  leftoversFrom?: IsoDate
  /**
   * For a quick lunch the app put in because the previous day's dinner was
   * removed: the date of that dinner. When the dinner is cooked at home again,
   * the lunch becomes leftovers again – unless the user changed it (#170).
   */
  replacedLeftoversFrom?: IsoDate
  /** Portion size per person, as a multiple of a standard portion (0.75–2×, #27). */
  portions: Record<Id, number>
  /**
   * The user picked this dish from the list ("Pick a dish"). Recalculations
   * after a settings change keep it unless a hard rule (allergy, doesn't
   * tolerate, meal turned off, food the household doesn't want) rules it out
   * (#192). A dish from ↻ or the planner is the app's choice.
   */
  chosenByUser?: true
  /** Extra guests eating this meal; each gets a standard adult portion (#31). */
  guests: number
  /** Extra items for single people, e.g. a protein boost on the evening (#120). */
  extras?: MealExtra[]
  /** What actually happened. Missing = still just planned. Used from phase 2 (#106). */
  outcome?: MealOutcome
}

/** An extra item for one person on a meal, e.g. 170 g skyr as a protein boost (#120). */
export interface MealExtra {
  personId: Id
  ingredientId: Id
  amount: number
  unit: Unit
}

/**
 * The outcome of a meal (#106), recorded for the whole household:
 * - eaten:          eaten as planned
 * - ateSomethingElse: something else was eaten – `recipeId` says what
 * - skipped:        the meal was skipped
 */
export interface MealOutcome {
  status: 'eaten' | 'ateSomethingElse' | 'skipped'
  /** For "ateSomethingElse": the recipe that was eaten instead. */
  recipeId?: Id
  recordedAt: Timestamp
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
// Approving a week plan and the shopping list (phase 3, #173, #184, #186)
// ---------------------------------------------------------------------------

/** The user's choice for one item in the approve sheet (#184 point 4). */
export type ItemChoice = 'have' | 'buy'

/** One item of an approved week, as the user left it in the approve sheet. */
export interface ApprovedItem {
  ingredientId: Id
  amount: number
  unit: Unit
  choice: ItemChoice
}

/**
 * A week plan the user approved (#173). Stored apart from the week plan, so
 * re-making the plan never loses it silently.
 */
export interface WeekApproval {
  weekId: WeekId
  approvedAt: Timestamp
  /** The first day the approval covers: today when the week had started (#185 F). */
  fromDate: IsoDate
  items: ApprovedItem[]
}

/** One line on the shopping list. */
export interface ShoppingItem {
  id: Id
  /** Catalogue ingredient, or … */
  ingredientId?: Id
  /** … a free-text item (also non-food), added by the user (phase 3C). */
  customName?: string
  amount?: number
  unit?: Unit
  /** The week the item was added for ("Week 47" label, #184 point 8). */
  weekId?: WeekId
  /** Added by approving a week plan (and replaced when it is approved again), or by the user. */
  source: 'plan' | 'user'
  /**
   * Store section chosen for this item: sorted automatically when added, or
   * moved by the user (#190). Missing = the ingredient's own section.
   */
  storeSection?: StoreSection
  bought: boolean
  /** When it was ticked off; bought items are cleared once their week is over (#190). */
  boughtAt?: Timestamp
  /**
   * Home's status for the ingredient before ticking it off set it to "have"
   * (#178, #190), so un-ticking can put it back. "none" = not in Home.
   */
  pantryBefore?: 'have' | 'empty' | 'none'
  /**
   * Set when the user changed the amount of a plan item by hand: what the
   * plan needed then. The user's amount is never overwritten when the week
   * is approved again (#191); only more from the plan is added.
   */
  planAmount?: { amount: number; unit: Unit }
  /** What approving again added on top of the user's amount: "+200 g from the plan" (#191). */
  fromPlan?: { amount: number; unit: Unit }
  /** The plan no longer needs an item whose amount the user changed: "No longer needed in the plan" (#192). */
  notInPlan?: true
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
