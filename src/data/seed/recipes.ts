import type { Recipe, Unit } from '../types'
import { SEED_TIMESTAMP } from './ingredients'

/**
 * Seed recipes: the 14 dishes from the prototype (#11) and the evening
 * snacks (#76), in Norwegian, German and English (#65). Amounts are tuned so
 * the calculated protein per portion lands close to the prototype values (#29).
 * Kid-friendly marking: #77.
 */

type Line = [ingredientKey: string, amount: number, unit: Unit]
type Text3 = [nb: string, de: string, en: string]

type RecipeInput = {
  key: string
  name: Text3
  categoryIds: string[]
  timeMinutes: number
  servings: number
  kidFriendly: boolean
  ingredients: Line[]
  steps: Text3[]
  snackKind?: 'healthy' | 'cheat'
  /** Ingredient keys that can be left out of the portion of someone who doesn't tolerate them (#181). */
  omittable?: string[]
}

const text = ([nb, de, en]: Text3) => ({ nb, de, en })

function recipe(input: RecipeInput): Recipe {
  return {
    id: `seed-recipe-${input.key}`,
    name: text(input.name),
    categoryIds: input.categoryIds,
    timeMinutes: input.timeMinutes,
    servings: input.servings,
    ingredients: input.ingredients.map(([key, amount, unit]) => ({
      ingredientId: `seed-ingredient-${key}`,
      amount,
      unit,
      ...(input.omittable?.includes(key) ? { omittable: true } : {}),
    })),
    steps: input.steps.map(text),
    tags: [],
    kidFriendly: input.kidFriendly,
    favorite: false,
    ...(input.snackKind ? { snackKind: input.snackKind } : {}),
    source: 'seed',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  }
}

const snack = (input: Omit<RecipeInput, 'categoryIds' | 'servings' | 'kidFriendly'> & { kidFriendly?: boolean }) =>
  recipe({ categoryIds: ['snack'], servings: 1, kidFriendly: input.kidFriendly ?? true, ...input })

export const SEED_RECIPES: Recipe[] = [
  // --- Breakfast -------------------------------------------------------------
  recipe({
    key: 'greek-yoghurt-berries-nuts',
    omittable: ['honey'],
    name: ['Gresk yoghurt med bær og nøtter', 'Griechischer Joghurt mit Beeren und Nüssen', 'Greek yoghurt with berries and nuts'],
    categoryIds: ['breakfast'],
    timeMinutes: 5,
    servings: 1,
    kidFriendly: true,
    ingredients: [['greek-yoghurt', 220, 'g'], ['mixed-berries', 1, 'dl'], ['mixed-nuts', 25, 'g'], ['honey', 1, 'tsp']],
    steps: [
      ['Ha yoghurten i en skål.', 'Den Joghurt in eine Schüssel geben.', 'Put the yoghurt in a bowl.'],
      ['Topp med bær og grovhakkede nøtter.', 'Mit Beeren und grob gehackten Nüssen toppen.', 'Top with berries and roughly chopped nuts.'],
      ['Drypp over litt honning.', 'Mit etwas Honig beträufeln.', 'Drizzle with a little honey.'],
    ],
  }),
  recipe({
    key: 'scrambled-eggs-cottage-cheese',
    omittable: ['pepper'],
    name: ['Eggerøre med cottage cheese', 'Rührei mit Hüttenkäse', 'Scrambled eggs with cottage cheese'],
    categoryIds: ['breakfast'],
    timeMinutes: 10,
    servings: 1,
    kidFriendly: true,
    ingredients: [['egg', 3, 'pcs'], ['cottage-cheese', 40, 'g'], ['tomato', 1, 'pcs'], ['olive-oil', 1, 'tsp'], ['salt', 1, 'pinch'], ['pepper', 1, 'pinch']],
    steps: [
      ['Visp eggene med salt og pepper.', 'Die Eier mit Salz und Pfeffer verquirlen.', 'Whisk the eggs with salt and pepper.'],
      ['Varm olje i en panne på middels varme og ha i eggene.', 'Öl in einer Pfanne bei mittlerer Hitze erwärmen und die Eier hineingeben.', 'Heat the oil in a pan over medium heat and add the eggs.'],
      ['Rør forsiktig til eggene nesten har stivnet, og vend inn cottage cheese.', 'Vorsichtig rühren, bis die Eier fast gestockt sind, dann den Hüttenkäse unterheben.', 'Stir gently until the eggs are almost set, then fold in the cottage cheese.'],
      ['Server med tomat i skiver.', 'Mit Tomatenscheiben servieren.', 'Serve with sliced tomato.'],
    ],
  }),
  recipe({
    key: 'protein-pancakes-banana',
    omittable: ['cinnamon'],
    name: ['Proteinpannekaker med banan', 'Proteinpfannkuchen mit Banane', 'Protein pancakes with banana'],
    categoryIds: ['breakfast'],
    timeMinutes: 15,
    servings: 1,
    kidFriendly: true,
    ingredients: [['oats', 1, 'dl'], ['egg', 2, 'pcs'], ['banana', 1, 'pcs'], ['cottage-cheese', 25, 'g'], ['cinnamon', 1, 'pinch'], ['olive-oil', 1, 'tsp']],
    steps: [
      ['Mos bananen og bland med egg, havregryn, cottage cheese og kanel.', 'Die Banane zerdrücken und mit Eiern, Haferflocken, Hüttenkäse und Zimt verrühren.', 'Mash the banana and mix with the eggs, oats, cottage cheese and cinnamon.'],
      ['La røren hvile i 5 minutter.', 'Den Teig 5 Minuten ruhen lassen.', 'Let the batter rest for 5 minutes.'],
      ['Stek små pannekaker i litt olje, ca. 2 minutter på hver side.', 'Kleine Pfannkuchen in etwas Öl ca. 2 Minuten pro Seite braten.', 'Fry small pancakes in a little oil, about 2 minutes per side.'],
    ],
  }),
  recipe({
    key: 'overnight-oats-skyr',
    name: ['Overnight oats med skyr', 'Overnight Oats mit Skyr', 'Overnight oats with skyr'],
    categoryIds: ['breakfast'],
    timeMinutes: 5,
    servings: 1,
    kidFriendly: true,
    ingredients: [['oats', 1, 'dl'], ['skyr', 160, 'g'], ['milk', 1, 'dl'], ['mixed-berries', 1, 'dl']],
    steps: [
      ['Bland havregryn, skyr og melk i et glass med lokk.', 'Haferflocken, Skyr und Milch in einem Glas mit Deckel verrühren.', 'Mix the oats, skyr and milk in a jar with a lid.'],
      ['Sett i kjøleskapet over natten.', 'Über Nacht in den Kühlschrank stellen.', 'Leave in the fridge overnight.'],
      ['Topp med bær om morgenen.', 'Morgens mit Beeren toppen.', 'Top with berries in the morning.'],
    ],
  }),
  recipe({
    key: 'omelette-spinach-feta',
    omittable: ['pepper'],
    name: ['Omelett med spinat og feta', 'Omelett mit Spinat und Feta', 'Spinach and feta omelette'],
    categoryIds: ['breakfast'],
    timeMinutes: 10,
    servings: 1,
    kidFriendly: true,
    ingredients: [['egg', 3, 'pcs'], ['spinach', 40, 'g'], ['feta', 30, 'g'], ['olive-oil', 1, 'tsp'], ['pepper', 1, 'pinch']],
    steps: [
      ['Visp eggene med pepper.', 'Die Eier mit Pfeffer verquirlen.', 'Whisk the eggs with pepper.'],
      ['Fres spinaten raskt i olje til den faller sammen.', 'Den Spinat kurz in Öl anbraten, bis er zusammenfällt.', 'Sauté the spinach in oil until wilted.'],
      ['Hell over eggene og smuldre over feta.', 'Die Eier darübergießen und den Feta darüberbröseln.', 'Pour in the eggs and crumble the feta on top.'],
      ['Stek på lav varme til omeletten har stivnet, og brett den sammen.', 'Bei niedriger Hitze stocken lassen und das Omelett zusammenklappen.', 'Cook on low heat until set, then fold the omelette.'],
    ],
  }),

  // --- Dinner ----------------------------------------------------------------
  recipe({
    key: 'chicken-tikka-rice',
    name: ['Kylling-tikka med ris', 'Hähnchen-Tikka mit Reis', 'Chicken tikka with rice'],
    categoryIds: ['dinner'],
    timeMinutes: 30,
    servings: 4,
    kidFriendly: false,
    ingredients: [
      ['chicken-breast', 550, 'g'], ['tikka-paste', 4, 'tbsp'], ['chopped-tomatoes', 1, 'can'], ['greek-yoghurt', 2, 'dl'],
      ['onion', 1, 'pcs'], ['garlic', 2, 'pcs'], ['brown-rice', 3, 'dl'], ['olive-oil', 1, 'tbsp'],
    ],
    steps: [
      ['Kok risen etter anvisningen på pakken.', 'Den Reis nach Packungsanweisung kochen.', 'Cook the rice according to the packet.'],
      ['Skjær kyllingen i biter og hakk løk og hvitløk.', 'Das Hähnchen in Stücke schneiden, Zwiebel und Knoblauch hacken.', 'Cut the chicken into pieces and chop the onion and garlic.'],
      ['Stek kyllingen i olje til den er gyllen. Ha i løk, hvitløk og tikka-paste.', 'Das Hähnchen in Öl goldbraun braten. Zwiebel, Knoblauch und Tikka-Paste dazugeben.', 'Brown the chicken in oil. Add the onion, garlic and tikka paste.'],
      ['Ha i tomatene og la det småkoke i 10 minutter.', 'Die Tomaten dazugeben und 10 Minuten köcheln lassen.', 'Add the tomatoes and simmer for 10 minutes.'],
      ['Rør inn yoghurten rett før servering. Server med ris.', 'Den Joghurt kurz vor dem Servieren unterrühren. Mit Reis servieren.', 'Stir in the yoghurt just before serving. Serve with rice.'],
    ],
  }),
  recipe({
    key: 'salmon-sweet-potato-broccoli',
    omittable: ['lemon', 'pepper'],
    name: ['Laks med søtpotet og brokkoli', 'Lachs mit Süßkartoffel und Brokkoli', 'Salmon with sweet potato and broccoli'],
    categoryIds: ['dinner'],
    timeMinutes: 30,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['salmon', 600, 'g'], ['sweet-potato', 2, 'pcs'], ['broccoli', 1, 'pcs'], ['greek-yoghurt', 150, 'g'],
      ['lemon', 1, 'pcs'], ['olive-oil', 2, 'tbsp'], ['salt', 2, 'pinch'], ['pepper', 2, 'pinch'],
    ],
    steps: [
      ['Sett ovnen på 220 °C. Skjær søtpoteten i båter og vend dem i halvparten av oljen.', 'Den Ofen auf 220 °C vorheizen. Die Süßkartoffel in Spalten schneiden und mit der Hälfte des Öls mischen.', 'Heat the oven to 220 °C. Cut the sweet potato into wedges and toss with half the oil.'],
      ['Stek søtpoteten i 10 minutter.', 'Die Süßkartoffel 10 Minuten backen.', 'Roast the sweet potato for 10 minutes.'],
      ['Legg laks og brokkolibuketter på brettet, krydre og drypp over resten av oljen. Stek i 12–15 minutter.', 'Lachs und Brokkoliröschen aufs Blech legen, würzen und mit dem restlichen Öl beträufeln. 12–15 Minuten backen.', 'Add the salmon and broccoli florets, season and drizzle with the rest of the oil. Roast for 12–15 minutes.'],
      ['Rør yoghurten med sitronsaft, salt og pepper, og server som saus.', 'Den Joghurt mit Zitronensaft, Salz und Pfeffer verrühren und als Soße servieren.', 'Mix the yoghurt with lemon juice, salt and pepper and serve as a sauce.'],
    ],
  }),
  recipe({
    key: 'beef-tacos',
    name: ['Taco med storfekjøttdeig', 'Tacos mit Rinderhackfleisch', 'Beef tacos'],
    categoryIds: ['dinner'],
    timeMinutes: 25,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['beef-mince', 400, 'g'], ['taco-seasoning', 1, 'pack'], ['tortilla', 8, 'pcs'], ['lettuce', 0.5, 'pcs'], ['tomato', 2, 'pcs'],
      ['cucumber', 0.5, 'pcs'], ['sweetcorn', 0.5, 'can'], ['grated-cheese', 1, 'dl'], ['salsa', 1, 'pcs'],
    ],
    steps: [
      ['Brun kjøttdeigen i en panne.', 'Das Hackfleisch in einer Pfanne anbraten.', 'Brown the mince in a pan.'],
      ['Rør inn tacokrydder og litt vann, og la det småkoke i 5 minutter.', 'Taco-Gewürz und etwas Wasser einrühren und 5 Minuten köcheln lassen.', 'Stir in the taco seasoning and a little water and simmer for 5 minutes.'],
      ['Kutt salat, tomat og agurk, og sett frem mais, ost og saus.', 'Salat, Tomaten und Gurke schneiden; Mais, Käse und Salsa bereitstellen.', 'Chop the lettuce, tomatoes and cucumber; set out the corn, cheese and salsa.'],
      ['Varm tortillaene og la alle fylle sine egne.', 'Die Tortillas erwärmen und jeden selbst füllen lassen.', 'Warm the tortillas and let everyone fill their own.'],
    ],
  }),
  recipe({
    key: 'chicken-stir-fry-noodles',
    omittable: ['garlic'],
    name: ['Kylling-wok med nudler', 'Hähnchen-Wok mit Nudeln', 'Chicken stir-fry with noodles'],
    categoryIds: ['dinner'],
    timeMinutes: 20,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['chicken-breast', 500, 'g'], ['egg-noodles', 250, 'g'], ['stir-fry-vegetables', 1, 'pack'], ['soy-sauce', 3, 'tbsp'],
      ['garlic', 2, 'pcs'], ['olive-oil', 2, 'tbsp'],
    ],
    steps: [
      ['Kok nudlene etter anvisningen på pakken.', 'Die Nudeln nach Packungsanweisung kochen.', 'Cook the noodles according to the packet.'],
      ['Skjær kyllingen i strimler og stek den i olje på høy varme.', 'Das Hähnchen in Streifen schneiden und in Öl bei hoher Hitze anbraten.', 'Cut the chicken into strips and stir-fry in oil over high heat.'],
      ['Ha i hvitløk og grønnsaker og wok i 4–5 minutter.', 'Knoblauch und Gemüse dazugeben und 4–5 Minuten braten.', 'Add the garlic and vegetables and stir-fry for 4–5 minutes.'],
      ['Vend inn nudler og soyasaus.', 'Nudeln und Sojasoße unterheben.', 'Toss in the noodles and soy sauce.'],
    ],
  }),
  recipe({
    key: 'lentil-chickpea-stew',
    name: ['Linse- og kikertgryte', 'Linsen-Kichererbsen-Eintopf', 'Lentil and chickpea stew'],
    categoryIds: ['dinner'],
    timeMinutes: 30,
    servings: 4,
    kidFriendly: false,
    ingredients: [
      ['red-lentils', 2, 'dl'], ['chickpeas', 1, 'can'], ['chopped-tomatoes', 2, 'can'], ['onion', 1, 'pcs'], ['garlic', 2, 'pcs'],
      ['curry-powder', 1, 'tbsp'], ['vegetable-stock', 1, 'pcs'], ['spinach', 100, 'g'], ['brown-rice', 3, 'dl'],
      ['greek-yoghurt', 1, 'dl'], ['olive-oil', 1, 'tbsp'],
    ],
    steps: [
      ['Kok risen etter anvisningen på pakken.', 'Den Reis nach Packungsanweisung kochen.', 'Cook the rice according to the packet.'],
      ['Fres hakket løk og hvitløk i olje med karri.', 'Gehackte Zwiebel und Knoblauch mit Currypulver in Öl anschwitzen.', 'Soften the chopped onion and garlic in oil with the curry powder.'],
      ['Ha i linser, tomater, buljongterning og 4 dl vann. Kok i 15 minutter.', 'Linsen, Tomaten, Brühwürfel und 400 ml Wasser dazugeben. 15 Minuten kochen.', 'Add the lentils, tomatoes, stock cube and 400 ml water. Simmer for 15 minutes.'],
      ['Ha i skyllede kikerter og spinat, og varm gjennom.', 'Abgespülte Kichererbsen und Spinat dazugeben und erhitzen.', 'Add the rinsed chickpeas and spinach and heat through.'],
      ['Server med ris og en klatt yoghurt.', 'Mit Reis und einem Klecks Joghurt servieren.', 'Serve with rice and a spoonful of yoghurt.'],
    ],
  }),
  recipe({
    key: 'turkey-burger-salad',
    omittable: ['pepper'],
    name: ['Kalkunburger med salat', 'Putenburger mit Salat', 'Turkey burger with salad'],
    categoryIds: ['dinner'],
    timeMinutes: 25,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['turkey-mince', 500, 'g'], ['egg', 1, 'pcs'], ['onion', 1, 'pcs'], ['burger-bun', 4, 'pcs'], ['lettuce', 0.5, 'pcs'],
      ['tomato', 2, 'pcs'], ['cucumber', 0.5, 'pcs'], ['olive-oil', 1, 'tbsp'], ['salt', 2, 'pinch'], ['pepper', 2, 'pinch'],
    ],
    steps: [
      ['Bland kjøttdeigen med egg, finhakket løk, salt og pepper.', 'Das Hackfleisch mit Ei, fein gehackter Zwiebel, Salz und Pfeffer vermengen.', 'Mix the mince with the egg, finely chopped onion, salt and pepper.'],
      ['Form fire burgere og stek dem i olje, ca. 4 minutter på hver side.', 'Vier Burger formen und in Öl ca. 4 Minuten pro Seite braten.', 'Shape four burgers and fry in oil for about 4 minutes per side.'],
      ['Varm brødene og kutt salat, tomat og agurk.', 'Die Brötchen erwärmen; Salat, Tomaten und Gurke schneiden.', 'Warm the buns and slice the lettuce, tomatoes and cucumber.'],
      ['Bygg burgerne og server resten som salat ved siden av.', 'Die Burger belegen und den Rest als Salat dazu servieren.', 'Assemble the burgers and serve the rest as a side salad.'],
    ],
  }),
  recipe({
    key: 'tuna-pasta-peas',
    omittable: ['garlic'],
    name: ['Tunfiskpasta med erter', 'Thunfischpasta mit Erbsen', 'Tuna pasta with peas'],
    categoryIds: ['dinner'],
    timeMinutes: 20,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['wholewheat-pasta', 350, 'g'], ['tuna', 2, 'can'], ['peas', 200, 'g'], ['chopped-tomatoes', 1, 'can'], ['onion', 1, 'pcs'],
      ['garlic', 2, 'pcs'], ['grated-cheese', 1, 'dl'], ['olive-oil', 1, 'tbsp'],
    ],
    steps: [
      ['Kok pastaen etter anvisningen på pakken. Ha i ertene de siste 2 minuttene.', 'Die Nudeln nach Packungsanweisung kochen. Die Erbsen in den letzten 2 Minuten dazugeben.', 'Cook the pasta according to the packet. Add the peas for the last 2 minutes.'],
      ['Fres hakket løk og hvitløk i olje, ha i tomatene og kok i 5 minutter.', 'Gehackte Zwiebel und Knoblauch in Öl anschwitzen, Tomaten dazugeben und 5 Minuten köcheln.', 'Soften the chopped onion and garlic in oil, add the tomatoes and simmer for 5 minutes.'],
      ['Ha i avrent tunfisk og varm gjennom.', 'Den abgetropften Thunfisch dazugeben und erhitzen.', 'Add the drained tuna and heat through.'],
      ['Bland med pasta og erter, og dryss over revet ost.', 'Mit Nudeln und Erbsen mischen und mit Käse bestreuen.', 'Mix with the pasta and peas and sprinkle with grated cheese.'],
    ],
  }),

  // --- Lunch (Saturday / quick lunch) -----------------------------------------
  recipe({
    key: 'chicken-wrap-hummus',
    name: ['Kyllingwrap med hummus', 'Hähnchen-Wrap mit Hummus', 'Chicken wrap with hummus'],
    categoryIds: ['lunch'],
    timeMinutes: 15,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['chicken-breast', 400, 'g'], ['tortilla', 4, 'pcs'], ['hummus', 8, 'tbsp'], ['lettuce', 0.5, 'pcs'], ['tomato', 2, 'pcs'],
      ['cucumber', 0.5, 'pcs'], ['bell-pepper', 1, 'pcs'], ['olive-oil', 1, 'tbsp'], ['salt', 1, 'pinch'],
    ],
    steps: [
      ['Skjær kyllingen i strimler, krydre med salt og stek i olje.', 'Das Hähnchen in Streifen schneiden, salzen und in Öl braten.', 'Cut the chicken into strips, season with salt and fry in oil.'],
      ['Kutt salat, tomat, agurk og paprika.', 'Salat, Tomaten, Gurke und Paprika schneiden.', 'Chop the lettuce, tomatoes, cucumber and pepper.'],
      ['Smør hummus på tortillaene, fyll med kylling og grønnsaker, og rull sammen.', 'Hummus auf die Tortillas streichen, mit Hähnchen und Gemüse füllen und aufrollen.', 'Spread hummus on the tortillas, fill with chicken and vegetables, and roll up.'],
    ],
  }),
  recipe({
    key: 'tuna-bowl-egg',
    name: ['Tunfisk-bowl med egg', 'Thunfisch-Bowl mit Ei', 'Tuna bowl with egg'],
    categoryIds: ['lunch'],
    timeMinutes: 25,
    servings: 4,
    kidFriendly: true,
    ingredients: [
      ['brown-rice', 3, 'dl'], ['tuna', 2, 'can'], ['egg', 4, 'pcs'], ['edamame', 200, 'g'], ['cucumber', 0.5, 'pcs'],
      ['sweetcorn', 0.5, 'can'], ['soy-sauce', 2, 'tbsp'],
    ],
    steps: [
      ['Kok risen etter anvisningen på pakken.', 'Den Reis nach Packungsanweisung kochen.', 'Cook the rice according to the packet.'],
      ['Kok eggene i 8 minutter, avkjøl og del dem i to.', 'Die Eier 8 Minuten kochen, abschrecken und halbieren.', 'Boil the eggs for 8 minutes, cool and halve them.'],
      ['Kok edamamebønnene i 3 minutter og kutt agurken.', 'Die Edamame 3 Minuten kochen und die Gurke schneiden.', 'Boil the edamame for 3 minutes and slice the cucumber.'],
      ['Fordel ris i skåler, legg på tunfisk, egg, edamame, agurk og mais, og drypp over soyasaus.', 'Reis auf Schüsseln verteilen, mit Thunfisch, Ei, Edamame, Gurke und Mais belegen und mit Sojasoße beträufeln.', 'Divide the rice between bowls, top with tuna, egg, edamame, cucumber and corn, and drizzle with soy sauce.'],
    ],
  }),

  // --- Evening snacks: healthy (#76) ---------------------------------------
  snack({
    key: 'skyr-vanilla',
    name: ['Skyr med vanilje', 'Skyr mit Vanille', 'Skyr with vanilla'],
    snackKind: 'healthy',
    timeMinutes: 2,
    ingredients: [['skyr', 170, 'g'], ['vanilla-sugar', 1, 'tsp']],
    steps: [['Rør vaniljesukkeret inn i skyren.', 'Den Vanillezucker in den Skyr rühren.', 'Stir the vanilla sugar into the skyr.']],
  }),
  snack({
    key: 'skyr-blueberries',
    name: ['Skyr med blåbær', 'Skyr mit Heidelbeeren', 'Skyr with blueberries'],
    snackKind: 'healthy',
    timeMinutes: 2,
    ingredients: [['skyr', 170, 'g'], ['blueberries', 75, 'g']],
    steps: [['Topp skyren med blåbær.', 'Den Skyr mit Heidelbeeren toppen.', 'Top the skyr with blueberries.']],
  }),
  snack({
    key: 'skyr-mango',
    name: ['Skyr med mango', 'Skyr mit Mango', 'Skyr with mango'],
    snackKind: 'healthy',
    timeMinutes: 2,
    ingredients: [['skyr', 170, 'g'], ['mango', 75, 'g']],
    steps: [['Tin mangoen litt og ha den over skyren.', 'Die Mango kurz antauen lassen und über den Skyr geben.', 'Let the mango thaw a little and spoon it over the skyr.']],
  }),
  snack({
    key: 'greek-yoghurt-walnuts',
    omittable: ['honey'],
    name: ['Gresk yoghurt med valnøtter', 'Griechischer Joghurt mit Walnüssen', 'Greek yoghurt with walnuts'],
    snackKind: 'healthy',
    timeMinutes: 2,
    ingredients: [['greek-yoghurt', 150, 'g'], ['walnuts', 15, 'g'], ['honey', 1, 'tsp']],
    steps: [['Topp yoghurten med hakkede valnøtter og litt honning.', 'Den Joghurt mit gehackten Walnüssen und etwas Honig toppen.', 'Top the yoghurt with chopped walnuts and a little honey.']],
  }),
  snack({
    key: 'cottage-cheese-pineapple',
    name: ['Cottage cheese med ananas', 'Hüttenkäse mit Ananas', 'Cottage cheese with pineapple'],
    snackKind: 'healthy',
    timeMinutes: 3,
    ingredients: [['cottage-cheese', 150, 'g'], ['pineapple', 75, 'g']],
    steps: [['Ha ananasbiter over cottage cheesen.', 'Ananasstücke über den Hüttenkäse geben.', 'Top the cottage cheese with pineapple chunks.']],
  }),
  snack({
    key: 'boiled-eggs',
    name: ['2 kokte egg', '2 gekochte Eier', '2 boiled eggs'],
    snackKind: 'healthy',
    timeMinutes: 10,
    ingredients: [['egg', 2, 'pcs'], ['salt', 1, 'pinch']],
    steps: [['Kok eggene i 8–9 minutter, avkjøl og strø over litt salt.', 'Die Eier 8–9 Minuten kochen, abschrecken und leicht salzen.', 'Boil the eggs for 8–9 minutes, cool and sprinkle with a little salt.']],
  }),
  snack({
    key: 'mixed-nuts',
    name: ['Nøtteblanding', 'Nussmischung', 'Mixed nuts'],
    snackKind: 'healthy',
    timeMinutes: 1,
    ingredients: [['mixed-nuts', 30, 'g']],
    steps: [],
  }),
  snack({
    key: 'edamame',
    name: ['Edamame', 'Edamame', 'Edamame'],
    snackKind: 'healthy',
    timeMinutes: 5,
    ingredients: [['edamame', 100, 'g'], ['salt', 1, 'pinch']],
    steps: [['Kok edamamebønnene i 3–4 minutter og strø over litt salt.', 'Die Edamame 3–4 Minuten kochen und leicht salzen.', 'Boil the edamame for 3–4 minutes and sprinkle with a little salt.']],
  }),
  snack({
    key: 'quark-apple-cinnamon',
    omittable: ['cinnamon'],
    name: ['Kesam med eple og kanel', 'Quark mit Apfel und Zimt', 'Quark with apple and cinnamon'],
    snackKind: 'healthy',
    timeMinutes: 3,
    ingredients: [['quark', 150, 'g'], ['apple', 1, 'pcs'], ['cinnamon', 1, 'pinch']],
    steps: [['Riv eller skjær eplet i biter, bland med kesam og dryss over kanel.', 'Den Apfel reiben oder würfeln, mit dem Quark mischen und mit Zimt bestreuen.', 'Grate or dice the apple, mix with the quark and sprinkle with cinnamon.']],
  }),
  snack({
    key: 'veggies-hummus',
    name: ['Gulrot og agurk med hummus', 'Karotte und Gurke mit Hummus', 'Carrot and cucumber with hummus'],
    snackKind: 'healthy',
    timeMinutes: 5,
    ingredients: [['carrot', 2, 'pcs'], ['cucumber', 100, 'g'], ['hummus', 4, 'tbsp']],
    steps: [['Skjær gulrot og agurk i staver og server med hummus.', 'Karotten und Gurke in Sticks schneiden und mit Hummus servieren.', 'Cut the carrots and cucumber into sticks and serve with hummus.']],
  }),

  // --- Evening snacks: cheat (only on cheat days, #21) ----------------------
  snack({
    key: 'nachos',
    name: ['Nachos med ost og salsa', 'Nachos mit Käse und Salsa', 'Nachos with cheese and salsa'],
    snackKind: 'cheat',
    timeMinutes: 10,
    ingredients: [['tortilla-chips', 50, 'g'], ['grated-cheese', 30, 'g'], ['salsa', 50, 'g']],
    steps: [
      ['Legg chipsene i en ildfast form og dryss over osten.', 'Die Chips in eine Auflaufform legen und mit Käse bestreuen.', 'Spread the chips in an ovenproof dish and sprinkle with cheese.'],
      ['Stek ved 200 °C til osten har smeltet, ca. 5 minutter. Server med salsa.', 'Bei 200 °C ca. 5 Minuten backen, bis der Käse geschmolzen ist. Mit Salsa servieren.', 'Bake at 200 °C until the cheese has melted, about 5 minutes. Serve with salsa.'],
    ],
  }),
  snack({
    key: 'ice-cream-berries',
    name: ['Is med bær', 'Eis mit Beeren', 'Ice cream with berries'],
    snackKind: 'cheat',
    timeMinutes: 2,
    ingredients: [['ice-cream', 2, 'dl'], ['mixed-berries', 50, 'g']],
    steps: [['Server isen med bær på toppen.', 'Das Eis mit Beeren servieren.', 'Serve the ice cream topped with berries.']],
  }),
  snack({
    key: 'popcorn',
    name: ['Popcorn', 'Popcorn', 'Popcorn'],
    snackKind: 'cheat',
    timeMinutes: 5,
    ingredients: [['popcorn', 25, 'g'], ['olive-oil', 1, 'tsp'], ['salt', 1, 'pinch']],
    steps: [['Varm oljen i en kjele med lokk, ha i maisen og rist kjelen til det slutter å poppe. Strø over salt.', 'Das Öl in einem Topf mit Deckel erhitzen, den Mais hineingeben und schütteln, bis es nicht mehr ploppt. Salzen.', 'Heat the oil in a lidded pan, add the kernels and shake until the popping stops. Sprinkle with salt.']],
  }),
]
