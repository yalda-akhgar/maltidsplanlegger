/**
 * Reading what the user types on the shopping list (milestone 3C, #190).
 * Pure functions, no storage access.
 *
 * Principle: you write freely, as on a paper list – never pick a section
 * first. "melk, couscous, vann, cola" becomes four items (comma or line
 * break); each item is sorted into its store section automatically:
 *   1. a section the household chose for it before (`SectionMemory`),
 *   2. the catalogue: whole-name match in nb/de/en, ignoring case and simple
 *      inflections ("løken", "tomater" → Løk, Tomat) – no partial matches,
 *   3. a small built-in word list of common items that are not in the
 *      catalogue (milk, bread, drinks, household goods …),
 *   4. otherwise "Other".
 * An amount in front of or behind the name is read too: "2 l melk",
 * "melk 2 l", "6 egg". When it is unclear, the whole text is the name.
 */
import type { Id, Ingredient, StoreSection, Unit } from './types'

/** One typed item, before it is matched. */
export interface ParsedEntry {
  name: string
  amount?: number
  unit?: Unit
}

/**
 * Sections the household chose by moving an item (#190): keyed by
 * `i:<ingredientId>` for catalogue items and `n:<normalised name>` otherwise.
 */
export type SectionMemory = Record<string, StoreSection>

/** Splits the input on commas and line breaks – but not the comma in "1,5 l". */
export function splitEntries(text: string): string[] {
  return text
    .split(/\n|;|(?<!\d),|,(?!\d)/)
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => /\p{L}/u.test(s))
}

/** Unit words in nb, de and en (lower case). A number without a unit means pieces. */
const UNIT_WORDS: Record<string, Unit> = {
  g: 'g', gr: 'g', gram: 'g', gramm: 'g', grams: 'g',
  kg: 'kg', kilo: 'kg',
  ml: 'ml', dl: 'dl',
  l: 'l', liter: 'l', litre: 'l', litres: 'l', liters: 'l', ltr: 'l',
  stk: 'pcs', stykk: 'pcs', st: 'pcs', 'stück': 'pcs', pcs: 'pcs', pc: 'pcs', piece: 'pcs', pieces: 'pcs',
  pk: 'pack', pkt: 'pack', pakke: 'pack', pakker: 'pack', pack: 'pack', packs: 'pack', packung: 'pack', packungen: 'pack', pckg: 'pack',
  boks: 'can', bokser: 'can', can: 'can', cans: 'can', dose: 'can', dosen: 'can',
}

const NUMBER = String.raw`(\d+(?:[.,]\d+)?|\d*½)`
const UNIT = `(${Object.keys(UNIT_WORDS)
  .sort((a, b) => b.length - a.length)
  .join('|')})`
const AMOUNT_FIRST = new RegExp(String.raw`^${NUMBER}\s*${UNIT}?\.?\s+(.+)$`, 'iu')
const AMOUNT_LAST = new RegExp(String.raw`^(.+?)\s+${NUMBER}\s*${UNIT}?\.?$`, 'iu')

function toNumber(text: string): number | undefined {
  const half = text.endsWith('½')
  const whole = half ? text.slice(0, -1) : text
  const value = (whole === '' ? 0 : Number(whole.replace(',', '.'))) + (half ? 0.5 : 0)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/** Reads one item: "2 l melk" → { name: "melk", amount: 2, unit: "l" }. */
export function parseEntry(text: string): ParsedEntry {
  const entry = text.trim().replace(/\s+/g, ' ')
  const first = AMOUNT_FIRST.exec(entry)
  const last = first ? null : AMOUNT_LAST.exec(entry)
  const [number, unitWord, name] = first ? [first[1], first[2], first[3]] : last ? [last[2], last[3], last[1]] : []
  const amount = number ? toNumber(number) : undefined
  if (!name || amount === undefined || !/\p{L}/u.test(name)) return { name: entry }
  return { name: name.trim(), amount, unit: unitWord ? UNIT_WORDS[unitWord.toLowerCase()] : 'pcs' }
}

/** Lower case, single spaces, no text in brackets: "Kikerter (hermetisk)" → "kikerter". */
export function normalizeName(name: string): string {
  return name
    .normalize('NFC')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Endings removed to compare simple inflections (nb, de, en). Longest first. */
const ENDINGS = ['ene', 'ane', 'er', 'en', 'et', 'es', 'a', 'e', 'n', 's']

/** The name and its forms without a common ending ("tomater" → tomat). Only the last word is changed. */
function forms(name: string): string[] {
  const result = [name]
  const words = name.split(' ')
  const last = words.pop() ?? ''
  for (const ending of ENDINGS) {
    if (last.endsWith(ending) && last.length - ending.length >= 3) result.push([...words, last.slice(0, -ending.length)].join(' '))
  }
  return result
}

const sameItem = (a: string, b: string) => {
  const formsOfB = new Set(forms(b))
  return forms(a).some((f) => formsOfB.has(f))
}

/**
 * The catalogue ingredient the user means, or undefined. Whole names only
 * (#190 point 3a): an exact name wins over a match through an inflection.
 */
export function matchIngredient(name: string, ingredients: Iterable<Ingredient>): Ingredient | undefined {
  const typed = normalizeName(name)
  if (!typed) return undefined
  let inflected: Ingredient | undefined
  for (const ingredient of ingredients) {
    for (const text of Object.values(ingredient.name)) {
      if (!text) continue
      const candidate = normalizeName(text)
      if (candidate === typed) return ingredient
      if (!inflected && sameItem(typed, candidate)) inflected = ingredient
    }
  }
  return inflected
}

/**
 * Common items that are not in the catalogue (#190 point 3z): drinks,
 * household goods, and everyday food with a plainer name than the
 * catalogue's ("melk" – the catalogue has "Lettmelk"). nb, de and en.
 */
const WORDS: Record<Exclude<StoreSection, 'other'>, string[]> = {
  produce: [
    'potet', 'poteter', 'gulrøtter', 'appelsin', 'druer', 'pære', 'avokado', 'sopp', 'squash', 'purre', 'salat', 'kål', 'hvitkål', 'blomkål',
    'rødløk', 'vårløk', 'persille', 'koriander', 'basilikum', 'lime', 'kiwi', 'jordbær', 'frukt', 'grønnsaker', 'urter',
    'kartoffel', 'kartoffeln', 'birne', 'trauben', 'orange', 'avocado', 'pilze', 'champignons', 'zucchini', 'kohl', 'obst', 'gemüse',
    'potato', 'potatoes', 'pear', 'grapes', 'mushrooms', 'courgette', 'cabbage', 'cauliflower', 'fruit', 'vegetables', 'herbs', 'strawberries',
  ],
  meatFish: [
    'kylling', 'laks', 'torsk', 'reker', 'bacon', 'pølser', 'skinke', 'kjøttdeig', 'karbonadedeig', 'fiskekaker', 'fisk', 'kjøtt',
    'hähnchen', 'lachs', 'kabeljau', 'garnelen', 'würstchen', 'schinken', 'hackfleisch', 'fisch', 'fleisch',
    'chicken', 'salmon', 'cod', 'prawns', 'shrimp', 'sausages', 'ham', 'mince', 'fish', 'meat',
  ],
  dairy: [
    'melk', 'helmelk', 'skummetmelk', 'smør', 'ost', 'yoghurt', 'rømme', 'fløte', 'kremfløte', 'matfløte', 'brunost', 'kefir', 'margarin', 'pålegg',
    'milch', 'butter', 'käse', 'joghurt', 'sahne', 'schmand', 'quark', 'aufschnitt',
    'milk', 'cheese', 'yogurt', 'cream', 'sour cream',
  ],
  bread: [
    'brød', 'rundstykker', 'knekkebrød', 'lomper', 'baguette', 'boller', 'polarbrød',
    'brot', 'brötchen', 'knäckebrot', 'toast',
    'bread', 'rolls', 'crispbread', 'bagels', 'buns',
  ],
  dryGoods: [
    'couscous', 'ris', 'pasta', 'spagetti', 'spaghetti', 'makaroni', 'mel', 'hvetemel', 'sukker', 'bulgur', 'quinoa', 'nudler', 'müsli', 'musli',
    'frokostblanding', 'cornflakes', 'syltetøy', 'peanøttsmør', 'nøtter', 'rosiner', 'sjokolade', 'kjeks', 'chips', 'ketchup', 'majones',
    'sennep', 'buljong', 'olje', 'eddik', 'krydder', 'hermetikk', 'godteri', 'snacks',
    'reis', 'nudeln', 'mehl', 'zucker', 'schokolade', 'kekse', 'senf', 'essig', 'öl', 'marmelade', 'gewürze', 'süßigkeiten',
    'rice', 'flour', 'sugar', 'cereal', 'chocolate', 'biscuits', 'cookies', 'crisps', 'mayonnaise', 'mustard', 'vinegar', 'oil', 'jam',
    'spices', 'sweets', 'candy', 'nuts',
  ],
  frozen: ['pizza', 'fiskepinner', 'is', 'fischstäbchen', 'eis', 'fish fingers', 'ice cream'],
  drinks: [
    'vann', 'mineralvann', 'cola', 'brus', 'juice', 'appelsinjuice', 'eplejuice', 'saft', 'kaffe', 'te', 'øl', 'vin', 'iste', 'smoothie', 'kakao',
    'wasser', 'mineralwasser', 'limonade', 'apfelsaft', 'orangensaft', 'kaffee', 'tee', 'bier', 'wein', 'eistee',
    'water', 'sparkling water', 'soda', 'lemonade', 'orange juice', 'apple juice', 'coffee', 'tea', 'beer', 'wine', 'iced tea', 'cocoa',
  ],
  household: [
    'dopapir', 'toalettpapir', 'tørkerull', 'kjøkkenrull', 'tannkrem', 'tannbørste', 'såpe', 'håndsåpe', 'sjampo', 'shampoo', 'balsam',
    'oppvaskmiddel', 'oppvasktabletter', 'vaskemiddel', 'tøymykner', 'bleier', 'våtservietter', 'søppelposer', 'matpapir', 'plastfolie',
    'aluminiumsfolie', 'batterier', 'deodorant', 'servietter', 'stearinlys', 'lyspærer',
    'toilettenpapier', 'klopapier', 'küchenrolle', 'zahnpasta', 'zahnbürste', 'seife', 'spülmittel', 'waschmittel', 'windeln', 'feuchttücher',
    'müllbeutel', 'batterien', 'deo', 'servietten',
    'toilet paper', 'toilet roll', 'kitchen roll', 'paper towels', 'toothpaste', 'toothbrush', 'soap', 'conditioner', 'washing-up liquid',
    'dish soap', 'detergent', 'nappies', 'diapers', 'wet wipes', 'bin bags', 'batteries', 'napkins',
  ],
}

const WORD_SECTIONS = new Map<string, StoreSection>(
  (Object.entries(WORDS) as [StoreSection, string[]][]).flatMap(([section, words]) => words.map((w) => [w, section] as const)),
)

/** The built-in word list's section for a name, or undefined (whole names only, like the catalogue). */
export function wordSection(name: string): StoreSection | undefined {
  const typed = normalizeName(name)
  const exact = WORD_SECTIONS.get(typed)
  if (exact) return exact
  for (const form of forms(typed)) {
    for (const [word, section] of WORD_SECTIONS) if (sameItem(form, word)) return section
  }
  return undefined
}

export const memoryKey = (item: { ingredientId?: Id; name?: string }) =>
  item.ingredientId ? `i:${item.ingredientId}` : `n:${normalizeName(item.name ?? '')}`

/** A typed item, matched and sorted (#190). */
export interface ResolvedEntry extends ParsedEntry {
  ingredient?: Ingredient
  storeSection: StoreSection
}

/** Matches a typed item and finds its section: memory → catalogue → word list → "Other". */
export function resolveEntry(text: string, ingredients: Iterable<Ingredient>, memory: SectionMemory = {}): ResolvedEntry {
  const parsed = parseEntry(text)
  const ingredient = matchIngredient(parsed.name, ingredients)
  const remembered = memory[memoryKey({ ingredientId: ingredient?.id, name: parsed.name })]
  const storeSection = remembered ?? ingredient?.storeSection ?? wordSection(parsed.name) ?? 'other'
  return { ...parsed, ...(ingredient ? { ingredient } : {}), storeSection }
}
