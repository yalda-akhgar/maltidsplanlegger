import type { Allergen, Ingredient, StoreSection, Unit } from '../types'

/**
 * Seed ingredient catalogue (#62, #65). Nutrition values are per 100 g,
 * approximate and rounded, based on common food composition tables
 * (e.g. the Norwegian Matvaretabellen). Not medical advice.
 *
 * Allergens (#180) include hidden ones and follow the strictest common
 * labelling where brands vary (stock cubes, curry powder, taco seasoning).
 * Every seed ingredient states its allergens; an empty list means none.
 *
 * Seed ids are fixed ("seed-…") so recipes can reference them and later
 * seed updates can recognise them.
 */

export const SEED_TIMESTAMP = '2026-11-16T00:00:00.000Z'

type Options = {
  units?: Partial<Record<Unit, number>>
  tags?: string[]
  proteinSource?: string
  staple?: boolean
  wholeUnitsOnly?: boolean
  /** A safe alternative for another seed ingredient (key), e.g. gluten-free pasta (#180). */
  alternativeFor?: string
}

/**
 * What spice blends and sauces contain (#181), as seed ingredient keys.
 * Strictest reading where brands vary.
 */
const SEED_CONTAINS: Record<string, string[]> = {
  'taco-seasoning': ['chili', 'cumin', 'paprika-powder', 'garlic', 'onion', 'pepper'],
  'tikka-paste': ['chili', 'ginger', 'garlic', 'cumin', 'paprika-powder'],
  'curry-powder': ['chili', 'cumin', 'ginger', 'pepper'],
  salsa: ['chili', 'onion', 'garlic'],
  'vegetable-stock': ['onion'],
  // Alternatives
  'mild-taco-seasoning': ['cumin', 'paprika-powder', 'garlic', 'onion'],
  'gluten-free-taco-seasoning': ['chili', 'cumin', 'paprika-powder', 'garlic', 'onion', 'pepper'],
  'mild-salsa': ['onion', 'garlic'],
  'gluten-free-vegetable-stock': ['onion'],
}

/** Allergens per seed ingredient key (#180). Keys not listed have no allergens. */
const SEED_ALLERGENS: Record<string, Allergen[]> = {
  egg: ['egg'],
  'greek-yoghurt': ['milk', 'lactose'],
  skyr: ['milk', 'lactose'],
  'cottage-cheese': ['milk', 'lactose'],
  quark: ['milk', 'lactose'],
  feta: ['milk', 'lactose'],
  'grated-cheese': ['milk', 'lactose'],
  milk: ['milk', 'lactose'],
  'ice-cream': ['milk', 'lactose', 'egg'],
  salmon: ['fish'],
  tuna: ['fish'],
  hummus: ['sesame'],
  edamame: ['soy'],
  'mixed-nuts': ['nuts', 'peanuts'],
  walnuts: ['nuts'],
  oats: ['gluten'],
  'wholewheat-pasta': ['gluten'],
  'egg-noodles': ['gluten', 'egg'],
  tortilla: ['gluten'],
  'burger-bun': ['gluten', 'sesame'],
  'soy-sauce': ['soy', 'gluten'],
  'taco-seasoning': ['gluten', 'celery'],
  'vegetable-stock': ['gluten', 'celery'],
  'curry-powder': ['celery', 'mustard'],
  'tikka-paste': ['mustard'],
  // Alternatives
  'lactose-free-milk': ['milk'],
  'lactose-free-greek-yoghurt': ['milk'],
  'lactose-free-skyr': ['milk'],
  'lactose-free-cottage-cheese': ['milk'],
  'lactose-free-quark': ['milk'],
  'oat-drink': ['gluten'],
  'gluten-free-soy-sauce': ['soy'],
  'mild-taco-seasoning': ['gluten', 'celery'],
  'gluten-free-taco-seasoning': ['celery'],
  'gluten-free-vegetable-stock': ['celery'],
  'lactose-free-grated-cheese': ['milk'],
}

/** [protein g, kcal, fibre g, fruit/veg portions] per 100 g. */
type Per100 = [number, number, number, number]

function ingredient(
  key: string,
  [nb, de, en]: [string, string, string],
  [proteinG, kcal, fiberG, fruitVegPortions]: Per100,
  storeSection: StoreSection,
  options: Options = {},
): Ingredient {
  return {
    id: `seed-ingredient-${key}`,
    name: { nb, de, en },
    nutritionPer100g: { proteinG, kcal, fiberG, fruitVegPortions },
    gramsPerUnit: options.units ?? {},
    ...(options.wholeUnitsOnly ? { wholeUnitsOnly: true } : {}),
    ...(options.proteinSource ? { proteinSource: options.proteinSource } : {}),
    tags: options.tags ?? [],
    allergens: SEED_ALLERGENS[key] ?? [],
    ...(options.alternativeFor ? { alternativeFor: `seed-ingredient-${options.alternativeFor}` } : {}),
    ...(SEED_CONTAINS[key] ? { contains: SEED_CONTAINS[key].map((k) => `seed-ingredient-${k}`) } : {}),
    storeSection,
    isStaple: options.staple ?? false,
    source: 'seed',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  }
}

const poultry = (source: string): Options => ({ tags: ['poultry'], proteinSource: source })
const dairy: Options = { tags: ['dairy'], proteinSource: 'dairy' }
const staple = (units: Partial<Record<Unit, number>> = {}, tags: string[] = []): Options => ({ staple: true, units, tags })

export const SEED_INGREDIENTS: Ingredient[] = [
  // Meat, fish and eggs
  ingredient('chicken-breast', ['Kyllingfilet', 'Hähnchenbrustfilet', 'Chicken breast'], [23, 110, 0, 0], 'meatFish', poultry('chicken')),
  ingredient('turkey-mince', ['Kalkunkjøttdeig', 'Putenhackfleisch', 'Turkey mince'], [20, 140, 0, 0], 'meatFish', poultry('turkey')),
  ingredient('beef-mince', ['Storfekjøttdeig', 'Rinderhackfleisch', 'Beef mince'], [19, 200, 0, 0], 'meatFish', { tags: ['beef'], proteinSource: 'beef' }),
  ingredient('salmon', ['Laksefilet', 'Lachsfilet', 'Salmon fillet'], [20, 200, 0, 0], 'meatFish', { tags: ['fish'], proteinSource: 'fish', units: { pcs: 125 } }),
  ingredient('tuna', ['Tunfisk i vann', 'Thunfisch im eigenen Saft', 'Tuna in water'], [25, 110, 0, 0], 'dryGoods', { tags: ['fish'], proteinSource: 'fish', units: { can: 120 } }),
  ingredient('egg', ['Egg', 'Ei', 'Egg'], [12.5, 140, 0, 0], 'dairy', { tags: ['egg'], proteinSource: 'egg', units: { pcs: 60 }, wholeUnitsOnly: true }),

  // Dairy and chilled
  ingredient('greek-yoghurt', ['Gresk yoghurt', 'Griechischer Joghurt', 'Greek yoghurt'], [9, 95, 0, 0], 'dairy', { ...dairy, units: { dl: 100 } }),
  ingredient('skyr', ['Skyr naturell', 'Skyr natur', 'Plain skyr'], [11, 63, 0, 0], 'dairy', { ...dairy, units: { dl: 100 } }),
  ingredient('cottage-cheese', ['Cottage cheese', 'Hüttenkäse', 'Cottage cheese'], [13, 90, 0, 0], 'dairy', { ...dairy, units: { dl: 100 } }),
  ingredient('quark', ['Kesam', 'Magerquark', 'Quark'], [11, 70, 0, 0], 'dairy', { ...dairy, units: { dl: 100 } }),
  ingredient('feta', ['Fetaost', 'Feta', 'Feta cheese'], [14, 270, 0, 0], 'dairy', dairy),
  ingredient('grated-cheese', ['Revet ost', 'Geriebener Käse', 'Grated cheese'], [27, 350, 0, 0], 'dairy', { ...dairy, units: { dl: 40 } }),
  ingredient('milk', ['Lettmelk', 'Fettarme Milch', 'Semi-skimmed milk'], [3.4, 46, 0, 0], 'dairy', { ...dairy, units: { ml: 1.03, dl: 103, l: 1030 } }),
  ingredient('hummus', ['Hummus', 'Hummus', 'Hummus'], [7, 280, 6, 0], 'dairy', { proteinSource: 'legumes', units: { tbsp: 15 } }),

  // Legumes, nuts and grains
  ingredient('chickpeas', ['Kikerter (hermetisk)', 'Kichererbsen (Dose)', 'Chickpeas (canned)'], [7, 130, 5, 0], 'dryGoods', { proteinSource: 'legumes', units: { can: 240 } }),
  ingredient('red-lentils', ['Røde linser', 'Rote Linsen', 'Red lentils'], [24, 340, 11, 0], 'dryGoods', { proteinSource: 'legumes', units: { dl: 85 } }),
  ingredient('edamame', ['Edamamebønner', 'Edamame', 'Edamame beans'], [11, 120, 5, 1], 'frozen', { tags: ['soy'], proteinSource: 'legumes', units: { dl: 65 } }),
  ingredient('mixed-nuts', ['Nøtteblanding', 'Nussmischung', 'Mixed nuts'], [20, 600, 8, 0], 'dryGoods', { tags: ['nuts'] }),
  ingredient('walnuts', ['Valnøtter', 'Walnüsse', 'Walnuts'], [15, 680, 7, 0], 'dryGoods', { tags: ['nuts'] }),
  ingredient('oats', ['Havregryn', 'Haferflocken', 'Rolled oats'], [13, 370, 10, 0], 'dryGoods', { tags: ['gluten'], units: { dl: 35 } }),
  ingredient('brown-rice', ['Fullkornsris', 'Vollkornreis', 'Brown rice'], [7.5, 355, 3.5, 0], 'dryGoods', { units: { dl: 85 } }),
  ingredient('wholewheat-pasta', ['Fullkornspasta', 'Vollkornnudeln', 'Wholewheat pasta'], [13, 350, 8, 0], 'dryGoods', { tags: ['gluten'] }),
  ingredient('egg-noodles', ['Eggnudler', 'Eiernudeln', 'Egg noodles'], [12, 370, 3, 0], 'dryGoods', { tags: ['gluten', 'egg'] }),
  ingredient('tortilla', ['Fullkornstortilla', 'Vollkorn-Tortilla', 'Wholewheat tortilla'], [9, 300, 6, 0], 'bread', { tags: ['gluten'], units: { pcs: 60, pack: 480 } }),
  ingredient('burger-bun', ['Fullkorns hamburgerbrød', 'Vollkorn-Burgerbrötchen', 'Wholewheat burger bun'], [9, 260, 5, 0], 'bread', { tags: ['gluten'], units: { pcs: 75 } }),

  // Fruit and vegetables
  ingredient('banana', ['Banan', 'Banane', 'Banana'], [1.1, 90, 2, 1], 'produce', { units: { pcs: 120 } }),
  ingredient('mixed-berries', ['Bær (frosne)', 'Beeren (TK)', 'Mixed berries (frozen)'], [1, 45, 4, 1], 'frozen', { units: { dl: 60 } }),
  ingredient('blueberries', ['Blåbær', 'Heidelbeeren', 'Blueberries'], [0.7, 55, 2.5, 1], 'produce', { units: { dl: 60 } }),
  ingredient('mango', ['Mango (frossen)', 'Mango (TK)', 'Mango (frozen)'], [0.7, 65, 1.6, 1], 'frozen', { units: { dl: 65 } }),
  ingredient('pineapple', ['Ananas', 'Ananas', 'Pineapple'], [0.5, 50, 1.2, 1], 'produce'),
  ingredient('apple', ['Eple', 'Apfel', 'Apple'], [0.3, 55, 2, 1], 'produce', { units: { pcs: 150 } }),
  ingredient('lemon', ['Sitron', 'Zitrone', 'Lemon'], [1, 30, 2.8, 0], 'produce', { units: { pcs: 100 } }),
  ingredient('spinach', ['Babyspinat', 'Babyspinat', 'Baby spinach'], [2.9, 23, 2.2, 1], 'produce'),
  ingredient('broccoli', ['Brokkoli', 'Brokkoli', 'Broccoli'], [3, 35, 2.6, 1], 'produce', { units: { pcs: 400 } }),
  ingredient('sweet-potato', ['Søtpotet', 'Süßkartoffel', 'Sweet potato'], [1.6, 86, 3, 1], 'produce', { units: { pcs: 300 } }),
  ingredient('bell-pepper', ['Paprika', 'Paprika', 'Bell pepper'], [1, 30, 2, 1], 'produce', { units: { pcs: 150 } }),
  ingredient('onion', ['Løk', 'Zwiebel', 'Onion'], [1.2, 40, 1.7, 1], 'produce', { units: { pcs: 100 } }),
  ingredient('garlic', ['Hvitløksfedd', 'Knoblauchzehe', 'Garlic clove'], [6, 150, 2, 0], 'produce', { units: { pcs: 5 } }),
  ingredient('tomato', ['Tomat', 'Tomate', 'Tomato'], [0.9, 20, 1.2, 1], 'produce', { units: { pcs: 100 } }),
  ingredient('cucumber', ['Agurk', 'Gurke', 'Cucumber'], [0.7, 12, 0.6, 1], 'produce', { units: { pcs: 350 } }),
  ingredient('carrot', ['Gulrot', 'Karotte', 'Carrot'], [0.6, 40, 2.8, 1], 'produce', { units: { pcs: 80 } }),
  ingredient('lettuce', ['Isbergsalat', 'Eisbergsalat', 'Iceberg lettuce'], [0.9, 15, 1.2, 1], 'produce', { units: { pcs: 400 } }),
  ingredient('chopped-tomatoes', ['Hakkede tomater', 'Gehackte Tomaten', 'Chopped tomatoes'], [1.2, 25, 1, 1], 'dryGoods', { units: { can: 400 } }),
  ingredient('sweetcorn', ['Mais (hermetisk)', 'Mais (Dose)', 'Sweetcorn (canned)'], [3, 80, 3, 1], 'dryGoods', { units: { can: 285 } }),
  ingredient('peas', ['Erter (frosne)', 'Erbsen (TK)', 'Green peas (frozen)'], [5.5, 80, 5, 1], 'frozen', { units: { dl: 60 } }),
  ingredient('stir-fry-vegetables', ['Wokgrønnsaker (frosne)', 'Wokgemüse (TK)', 'Stir-fry vegetables (frozen)'], [2, 35, 2.5, 1], 'frozen', { units: { pack: 500 } }),

  // Sauces, snacks and others
  ingredient('tikka-paste', ['Tikka masala-paste', 'Tikka-Masala-Paste', 'Tikka masala paste'], [2, 200, 3, 0], 'dryGoods', { units: { tbsp: 15 } }),
  ingredient('taco-seasoning', ['Tacokrydder', 'Taco-Gewürzmischung', 'Taco seasoning'], [7, 300, 10, 0], 'dryGoods', { units: { pack: 28 } }),
  ingredient('salsa', ['Tacosaus', 'Salsa', 'Salsa'], [1.5, 35, 1.5, 0], 'dryGoods', { units: { pcs: 230 } }),
  ingredient('tortilla-chips', ['Tortillachips', 'Tortilla-Chips', 'Tortilla chips'], [7, 490, 4, 0], 'dryGoods'),
  ingredient('popcorn', ['Popcornmais', 'Popcornmais', 'Popcorn kernels'], [12, 380, 14, 0], 'dryGoods', { units: { dl: 75 } }),
  ingredient('ice-cream', ['Vaniljeis', 'Vanilleeis', 'Vanilla ice cream'], [3.5, 210, 0, 0], 'frozen', { tags: ['dairy'], units: { dl: 50 } }),

  // Staples (only on the shopping list when marked empty)
  ingredient('olive-oil', ['Olivenolje', 'Olivenöl', 'Olive oil'], [0, 880, 0, 0], 'dryGoods', staple({ tbsp: 14, tsp: 4.5 })),
  ingredient('soy-sauce', ['Soyasaus', 'Sojasoße', 'Soy sauce'], [8, 60, 0, 0], 'dryGoods', staple({ tbsp: 16 }, ['soy', 'gluten'])),
  ingredient('curry-powder', ['Karri', 'Currypulver', 'Curry powder'], [13, 325, 33, 0], 'dryGoods', staple({ tsp: 2, tbsp: 6 })),
  ingredient('vegetable-stock', ['Grønnsaksbuljong (terning)', 'Gemüsebrühe (Würfel)', 'Vegetable stock cube'], [10, 250, 0, 0], 'dryGoods', staple({ pcs: 10 })),
  ingredient('honey', ['Honning', 'Honig', 'Honey'], [0.3, 300, 0, 0], 'dryGoods', staple({ tsp: 7, tbsp: 21 })),
  ingredient('vanilla-sugar', ['Vaniljesukker', 'Vanillezucker', 'Vanilla sugar'], [0, 400, 0, 0], 'dryGoods', staple({ tsp: 4 })),
  ingredient('cinnamon', ['Kanel', 'Zimt', 'Cinnamon'], [4, 250, 53, 0], 'dryGoods', staple({ tsp: 2.5 })),
  ingredient('salt', ['Salt', 'Salz', 'Salt'], [0, 0, 0, 0], 'dryGoods', staple({ tsp: 6 })),
  ingredient('pepper', ['Pepper', 'Pfeffer', 'Black pepper'], [0, 0, 0, 0], 'dryGoods', staple({ pinch: 0.3 })),
  // Single spices, mainly so people can say what they don't tolerate (#181)
  ingredient('chili', ['Chili', 'Chili', 'Chili'], [12, 280, 35, 0], 'dryGoods', staple({ tsp: 2.5, pinch: 0.3 })),
  ingredient('cumin', ['Spisskummen', 'Kreuzkümmel', 'Cumin'], [18, 375, 10, 0], 'dryGoods', staple({ tsp: 2.5 })),
  ingredient('paprika-powder', ['Paprikapulver', 'Paprikapulver', 'Paprika powder'], [14, 280, 35, 0], 'dryGoods', staple({ tsp: 2.5 })),
  ingredient('ginger', ['Ingefær', 'Ingwer', 'Ginger'], [9, 335, 14, 0], 'dryGoods', staple({ tsp: 2.5 })),

  // Safe alternatives for allergies (#180), used for everyone at the meal
  ingredient('gluten-free-pasta', ['Glutenfri pasta', 'Glutenfreie Nudeln', 'Gluten-free pasta'], [6, 355, 3, 0], 'dryGoods', { alternativeFor: 'wholewheat-pasta' }),
  ingredient('gluten-free-tortilla', ['Glutenfri tortilla', 'Glutenfreie Tortilla', 'Gluten-free tortilla'], [5, 310, 3, 0], 'bread', { units: { pcs: 60, pack: 480 }, alternativeFor: 'tortilla' }),
  ingredient('gluten-free-burger-bun', ['Glutenfritt hamburgerbrød', 'Glutenfreies Burgerbrötchen', 'Gluten-free burger bun'], [5, 270, 5, 0], 'bread', { units: { pcs: 75 }, alternativeFor: 'burger-bun' }),
  ingredient('gluten-free-oats', ['Glutenfri havregryn', 'Glutenfreie Haferflocken', 'Gluten-free oats'], [13, 370, 10, 0], 'dryGoods', { units: { dl: 35 }, alternativeFor: 'oats' }),
  ingredient('rice-noodles', ['Risnudler', 'Reisnudeln', 'Rice noodles'], [6, 360, 1, 0], 'dryGoods', { alternativeFor: 'egg-noodles' }),
  ingredient('gluten-free-soy-sauce', ['Glutenfri soyasaus (tamari)', 'Glutenfreie Sojasoße (Tamari)', 'Gluten-free soy sauce (tamari)'], [10, 70, 0, 0], 'dryGoods', { ...staple({ tbsp: 16 }), alternativeFor: 'soy-sauce' }),
  ingredient('lactose-free-milk', ['Laktosefri lettmelk', 'Laktosefreie fettarme Milch', 'Lactose-free semi-skimmed milk'], [3.4, 46, 0, 0], 'dairy', { ...dairy, units: { ml: 1.03, dl: 103, l: 1030 }, alternativeFor: 'milk' }),
  ingredient('oat-drink', ['Havredrikk', 'Haferdrink', 'Oat drink'], [1, 45, 0.8, 0], 'dairy', { units: { ml: 1.03, dl: 103, l: 1030 }, alternativeFor: 'milk' }),
  ingredient('lactose-free-greek-yoghurt', ['Laktosefri gresk yoghurt', 'Laktosefreier griechischer Joghurt', 'Lactose-free Greek yoghurt'], [9, 95, 0, 0], 'dairy', { ...dairy, units: { dl: 100 }, alternativeFor: 'greek-yoghurt' }),
  ingredient('lactose-free-skyr', ['Laktosefri skyr', 'Laktosefreies Skyr', 'Lactose-free skyr'], [11, 63, 0, 0], 'dairy', { ...dairy, units: { dl: 100 }, alternativeFor: 'skyr' }),
  ingredient('lactose-free-cottage-cheese', ['Laktosefri cottage cheese', 'Laktosefreier Hüttenkäse', 'Lactose-free cottage cheese'], [13, 90, 0, 0], 'dairy', { ...dairy, units: { dl: 100 }, alternativeFor: 'cottage-cheese' }),
  ingredient('lactose-free-grated-cheese', ['Laktosefri revet ost', 'Laktosefreier geriebener Käse', 'Lactose-free grated cheese'], [27, 350, 0, 0], 'dairy', { ...dairy, units: { dl: 40 }, alternativeFor: 'grated-cheese' }),
  ingredient('gluten-free-vegetable-stock', ['Glutenfri grønnsaksbuljong (terning)', 'Glutenfreie Gemüsebrühe (Würfel)', 'Gluten-free vegetable stock cube'], [10, 250, 0, 0], 'dryGoods', { ...staple({ pcs: 10 }), alternativeFor: 'vegetable-stock' }),
  ingredient('gluten-free-taco-seasoning', ['Glutenfritt tacokrydder', 'Glutenfreie Taco-Gewürzmischung', 'Gluten-free taco seasoning'], [7, 300, 10, 0], 'dryGoods', { units: { pack: 28 }, alternativeFor: 'taco-seasoning' }),
  // Milder alternatives for people who don't tolerate chili (#181)
  ingredient('mild-taco-seasoning', ['Mildt tacokrydder', 'Milde Taco-Gewürzmischung', 'Mild taco seasoning'], [7, 300, 10, 0], 'dryGoods', { units: { pack: 28 }, alternativeFor: 'taco-seasoning' }),
  ingredient('mild-salsa', ['Mild tacosaus', 'Milde Salsa', 'Mild salsa'], [1.5, 35, 1.5, 0], 'dryGoods', { units: { pcs: 230 }, alternativeFor: 'salsa' }),
  ingredient('lactose-free-quark', ['Laktosefri kesam', 'Laktosefreier Magerquark', 'Lactose-free quark'], [11, 70, 0, 0], 'dairy', { ...dairy, units: { dl: 100 }, alternativeFor: 'quark' }),
]
