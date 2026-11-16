import type { Ingredient, StoreSection, Unit } from '../types'

/**
 * Seed ingredient catalogue (#62, #65). Nutrition values are per 100 g,
 * approximate and rounded, based on common food composition tables
 * (e.g. the Norwegian Matvaretabellen). Not medical advice.
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
]
