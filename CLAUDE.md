# CLAUDE.md

## 📍 Status (updated 2026-11-26 – resume here)
**Phase 3 in progress (decisions #184–#198). 3A–3C done. 3D approved with changes in #195 (2026-11-26): "Have" again removes the item "Empty" put on the shopping list (`ShoppingItem.fromEmpty`); Home group "Dry goods" mirrors where items are kept; English is the fallback language and the language row sits at the top of the wizard; default names ("Me", "Adult 2") are placeholders stored empty (`person-name.ts`, schema v6 cleans old ones); example family excludes nothing; "Show only what is relevant" (`src/data/relevance.ts`); deleting recipes and people asks first (`askConfirm`), deleted recipes leave the plan from today (`removeRecipeFromPlans`). Interpretations (a)–(d) in #195 approved 2026-11-27; the portion hint is shown only with children (#196). 3E built (#197): swapping or picking a dish in an approved week opens `SwapListSheet` (new / off the list with "Keep" / already bought); `src/data/swap-list.ts`; ↶ also puts the list back (`ListUndo` in undo-store). Interpretations (a)–(f) in #197 need approval. Fixed shopping day decided as a reminder only, calendar week stays (#198, not built). Tests: 258. NEXT: product owner tests 3E; then build the shopping-day reminder (#198). Published: https://maltidsplanlegger.vercel.app.**

Meals the household eats (#183): 0 % in `proteinSplit` = meal off (`src/data/meals.ts`); off meals not planned, not shown, not counted; lunch off → no leftovers portions; settings page "Meals and protein" with switches; wizard step 5 starts with "Which meals do you eat?" (`MealsOnFields`). Tests: 143.

Own ingredients (#182): the new-ingredient form asks what the household doesn't tolerate (`Ingredient.containsCheckedFor`); unstated → yellow "Not stated whether X contains chili", dish not suggested; "Fill in" button in the recipe view (`IngredientFacts.tsx`). Tests: 135.

"Doesn't tolerate" delivered (#181): three food levels per person (`FoodRows`: allergies → doesn't tolerate → doesn't like; dislikes now for adults too), `Person.notToleratedIngredientIds`, `Ingredient.contains` (spice blends/sauces), `RecipeIngredient.omittable` (left out of that person's portion: "Without black pepper for Yalda"), mild taco seasoning + mild salsa as alternatives, 4 single spices, 3 more allergy alternatives; `recipeSafety` returns `intolerances` + `omissions`, `blockedAt` replaces `blockedAllergens`; seed version 3; "Can be left out" switch in the recipe form. Tests: 130.

Allergies delivered (#180): `src/data/allergens.ts` (EU-14 + lactose, `blockedAllergens`, `recipeSafety` with safe alternatives, `withSubstitutions`), `Person.allergies`, `Ingredient.allergens` / `alternativeFor`, `PlannedMeal.substitutions` (set in `Planner.withPortions`; leftovers use the dinner's eaters), hard filter `Planner.safe` at every pick site, `adaptToSettings` replaces newly unsafe dishes, seed version 2 (labels + 12 alternatives). UI: `AllergiesSheet`/`AllergyRow` on every person card, wizard note, recipe "Contains" + disclaimer, `AllergyNotes` labels on day cards and in the pick list, "Pick anyway" dialog, allergen choice in the new-ingredient form. Tests: `src/data/allergens.test.ts` (116 tests in total).

Milestone H delivered: README for employers (screenshots in `docs/screenshots/`, English UI, "Live demo: coming soon", roadmap, product-owner section, all rights reserved), `docs/PRD.md` (draft – success metrics to be confirmed by the product owner), `docs/FEEDBACK_LOG.md` (template + F/G acceptance-test findings), `docs/README.md` (docs index; Norwegian brief files kept as originals), route-level code splitting in `src/app/router.tsx` (main bundle 755 → 381 kB, warning gone, #94), `npm run dev:phone` (`vite --host`).

Changes from the G acceptance test (all pushed): undo of settings changes tested and the dev "Fill in example family" button kept (#142, #167); "Remove meal" – meal status `skipped`, planner `skipMeal` / `refillMeal`, "Fill in again" / "Pick a dish" in `MealSheet` (#168, #171); leftovers come back when a removed dinner returns, via `PlannedMeal.replacedLeftoversFrom` (#170). Ideas logged: per-person skip (BACKLOG #9, phase 5), phase-2 check-in and summary (#169, `docs/PROMPT.md`). Tests: 97 pass (`npx vitest run`).

Milestone G delivered: `src/features/onboarding/OnboardingScreen.tsx` (6-step wizard at `/welcome`, shown while `onboardingDone` is false; `?again=1` from Settings), shared editors in `src/features/household/` (people cards, protein target + calculator, dislikes sheet, excluded food, weekday pickers, `save-settings.ts`), settings list + sub-pages in `src/features/settings/` (`/settings/profile`, `household`, `food-week`, `auto-plan`, `split`, `language`, `appearance`, `install`). Planner: `adaptToSettings` (settings changes update weeks from today, only replacing dishes that no longer fit) and `autoPlanWeek`; repository `listWeekPlans`, `deviceLanguage`; schema v5 (`HouseholdSettings.autoWeekPlan`). Milestone F approved 2026-11-17 (#114–#155).

Milestone F delivered: `src/features/week/` – `WeekScreen` (week navigation, fill / favourites week / start over with confirmation, undo history + undo toasts, protein-alert toast with "Add"), `DayCard` (progress per adult, meals, notes, extras), `PickSheet` (search, filters, protein impact per adult), `MealSheet` (recipe with household amounts, eating out, guests), `MoreSheet`. Planner additions in `planner.ts`: `fillEmptyOnly`/`favoritesOnly`, `setMeal`, `setEatingOut`, `setGuests`, `addExtras`, `emptyWeekPlan`, `dayProtein`, `pickImpacts`, `boostSuggestions`, `filledNonFavorites`. Schema v4 (`PlannedMeal.extras`). Device preference `proteinAlerts`. New colour tokens `success`/`warning`. Status `none` = empty meal (or dinner on a fixed day out).

Milestone E delivered: `src/data/planner.ts` (generateWeekPlan, swapMeal, refreshPortions, dinnerPortionsToCook, planNotes, exclusion + protein-source helpers) and `src/data/protein.ts` (personal portions, children/lunch rule, day nutrition, protein boost). Tests in `src/data/planner.test.ts` (rules checked over 200 seeded weeks). Decisions #95–#105, #107–#111. `Person.eatsWeekdayLunchAtHome` added (optional). Household `noDinnerAtHomeDays` (schema v3) replaces the hard-coded Friday. `PlannedMeal.outcome` reserved for phase 2 (#106).


Milestone D delivered: seed catalogue (`src/data/seed/ingredients.ts`, ~60 ingredients, nutrition per 100 g) and 14 recipes + 13 snacks (`src/data/seed/recipes.ts`, nb/de/en), loaded once via `SEED_VERSION` in the repository. `nutrition.ts` (protein/kcal per portion from ingredients, tags), `amounts.ts` (household portions, rounding #84, formatting). Recipes screen: search, filter chips, cards with heart and badges, detail sheet with portion stepper, form page `/recipes/new` + `/recipes/:id/edit` with ingredient picker and "new ingredient", delete with undo toast. Decisions #74–#89. Review follow-ups (#90–#94): unsaved-changes dialog (`components/ui/confirm-dialog.tsx` + `useBlocker`), search also matches ingredient names, smaller nav labels below 360 px, bundle size deferred to H. Language is now a device preference (schema v2). Tests: `src/data/recipes.test.ts` (every seed recipe within ±3 g of the prototype protein value).

Milestone C delivered: `src/data/types.ts` (all types), `defaults.ts` (built-in categories, default household), `localize.ts`, `week.ts` (ISO week helpers), async `repository.ts` with schema version 1 + migration of the old language key, tests in `src/data/data.test.ts` (`npx vitest run`). Decisions #62–#73.
Repo: https://github.com/yalda-akhgar/maltidsplanlegger (public). Git identity (repo-local): `Yalda Akhgar` / `357414314+yalda-akhgar@users.noreply.github.com`. ⚠️ Never use the NTNU address – it is the *global* git e-mail on this PC. `gh` lives at `C:\Program Files\GitHub CLI\gh.exe` if not on PATH.

Milestone B delivered: brand + dark tokens (`src/index.css`), base components (button, card, chip, bottom sheet, toast, switch, input, badge), app shell with bottom nav / sidebar, routing, i18n (nb/de/en), "Coming soon" screens, Settings (language, theme, install guide), PWA (manifest, icons, auto-updating service worker), Android back button closes sheets, safe areas. Dev-only component overview at `/design`.

Choices made during B without asking were approved afterwards (#56–#61). ⚠️ The product owner reminded: ask BEFORE every choice, including small design choices. `robots.txt` blocks indexing (#55). Lighthouse results in `docs/LIGHTHOUSE.md`.

Accessibility pass done (2026-11-16): WCAG 2.2 AA is a requirement (decision #53); dark purple is now `#8453F6` (#54); `npm run check:contrast` passes.

<details><summary>Milestone A log</summary>


Done:
- Vite + React + TypeScript project created; approved packages installed (react-router, i18next/react-i18next, date-fns, lucide-react, tailwindcss + @tailwindcss/vite, vitest, vite-plugin-pwa). `npm run build` passes.
- `.gitignore` (secrets excluded), `.env.example`, this `CLAUDE.md`, placeholder `README.md`.
- Planning files moved to `docs/` (PROMPT, FASE1_PROMPT, SVAR_PLAN, FIGMA_MAKE_*, BACKLOG). `docs/DECISIONS.md` has decisions #1–37.
- `git init -b main` done (no commits).

- GitHub account created: username `yalda-akhgar`. Repo-local `user.email` set to `357414314+yalda-akhgar@users.noreply.github.com`.
- GitHub CLI 2.104.0 installed (`C:\Program Files\GitHub CLI\gh.exe`; a new terminal is needed for `gh` to be on PATH).

- Repo-local `user.name` set to `Yalda Akhgar`; product owner logged in with `gh` as `yalda-akhgar`.
- First commit created and pushed to the public repo `maltidsplanlegger`.
</details>

---

## ⚠️ MOST IMPORTANT RULE – applies in every session

**Never make choices on your own.** This covers features, design, text, technology, packages, folder structure, data model and how rules should work.

When a choice comes up:
1. Stop.
2. Explain the choice briefly.
3. Give 2–3 alternatives with their consequences.
4. Say which one you recommend and why.
5. Wait for the product owner to choose.

Batch several small choices into one list. If anything is unclear, ask – don't guess. Only purely technical details with no impact on the product owner or users (e.g. variable names) may be decided without asking, and they must be mentioned briefly in the summary. (See decision #34 in `docs/DECISIONS.md`.)

**Automation never overrides the user's own choices.** Anything the user has set, changed or chosen manually (dishes, lunches, quantities, Have/Buy) is kept when the app recalculates – unless it no longer fits a hard rule (allergy, can't tolerate, meal turned off). Then only that item changes, with Undo. (Decision #192.)

**Show only what is relevant to this household.** Options, filters and labels that don't apply (no children, a meal turned off, no allergies, etc.) are hidden, and reappear automatically when they become relevant. Data is never deleted. (Decision #195.)

**Deleting something big (recipes, people, own ingredients) always asks for confirmation; small items use Undo.** The confirmation names the item and says what happens, with a red button. (Decision #195.)

---

## Working agreement
- The product owner is a beginner. Explanations in chat are in **Norwegian**, short and simple. After each step: 2–4 sentences on what was done, why, and how to see the result.
- When the product owner must act (create an account, click, approve), give numbered steps with exactly what to click.
- Work in milestones and **stop after each one**, waiting for "fortsett".
- **All documentation is in English**: README, `CLAUDE.md`, everything in `docs/`, code comments and commit messages. The app UI follows the phone's language (Norwegian, German or English; English otherwise, #195); Norwegian is the fallback for missing texts.
- **New ideas go to `docs/BACKLOG.md`** (in English) instead of being built right away.
- **Every decision is logged in `docs/DECISIONS.md`** (date, decision, alternatives, rationale, consequences).
- Commit after each finished step with short, clear English messages, and push to GitHub.
- The product owner uses Windows + PowerShell.
- All accounts (GitHub, Supabase, Vercel, Anthropic) must be the product owner's **private** accounts, never the bootcamp/student ones. Commits must use the private e-mail.

## Project summary
**Måltidsplanlegger** is a mobile-first PWA meal planner for families with children. Its core value is **protein-balanced planning**: each adult has a personal daily protein target, and the planner picks dishes and adjusts portions so breakfast + lunch (leftovers from the previous dinner) + dinner + evening snack meet it, while keeping each day nutritionally balanced.

Full vision: `docs/PROMPT.md`. Phase 1 brief: `docs/FASE1_PROMPT.md` plus the product owner's answers in `docs/SVAR_PLAN.md` and `docs/SVAR_DELMAL_E.md`. Original UI prototype prompts: `docs/FIGMA_MAKE_*.md`.

## Tech stack (decided)
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui. Primary purple `#7C3AED` (dark `#6D28D9`, light `#F5F3FF` / `#EDE9FE`), background `#FAF9FC`, text `#1F1B2E`, muted `#6B6880`, Inter font, radii 14–18 px, touch targets ≥ 44 px. Dark mode keeps the purple accent.
- shadcn/ui on Radix (preset "Maia"), `vaul` drawers, `sonner` toasts, `next-themes`, self-hosted Inter (`@fontsource-variable/inter`)
- react-router, react-i18next (nb default, de + en prepared; no hard-coded UI text), date-fns, lucide-react
- vite-plugin-pwa (installable on Android and iPhone)
- Vitest for core business rules (week plan, protein calculation, nutritional balance)
- Storage: localStorage for now. **All data access goes through `src/data/repository.ts`** so it can be swapped for Supabase in phase 5.
- Never commit secrets. See `.gitignore` and `.env.example`.

## Key product rules (phase 1)
See `docs/DECISIONS.md` for details and rationale. Highlights:
- Family-specific rules are settings, not hard-coded (#107): fixed "no dinner at home" days (default none; the product owner's household picks Friday). Lunch = leftovers from the previous day's dinner (Monday = previous week's Sunday); after any dinner not cooked at home → quick lunch (#108). Meals outside the app are not counted in the day's protein target (#109).
- Excluded food (nothing by default – no defaults based on the founder's own family, #188; pork is one tap away) is never suggested. Dislikes (adults and children, #181) are avoided where possible (soft rule).
- Dinners ≤ 30 min. No repeated dinner within a week, no same protein source two days in a row. Favourites twice as likely. Rather repeat a dinner than serve a child's disliked dish (#110).
- Personal protein targets, split 25/30/30/15 % (breakfast/lunch/dinner/snack), portions scaled 0.75×–2× per person, then a "protein boost" suggestion. A child = 0.5 portion, no target. Guests = standard adult portion.
- The household chooses which meals it eats (#183): a meal at 0 % is off – not planned, not shown, not counted; at least one main meal stays on. Per person in phase 5.
- Evening snack every day (unless turned off, #183); healthy except on chosen cheat days.
- **Three food levels per person (#181):** allergies (strict) → doesn't tolerate (strict, any ingredient incl. what blends contain; a recipe line marked "can be left out" is left out of that person's portion, otherwise a milder alternative is used for everyone) → doesn't like (soft, adults and children). The user's own ingredients must state whether they contain what someone doesn't tolerate; if not, the dish is "not stated" and not suggested (#182).
- **Allergies are a hard rule (#180):** per person, EU-14 + lactose, never suggested for anyone eating the meal, never relaxed. Safe alternatives are used for everyone at the meal (one pot). Picking an unsafe dish by hand needs "Pick anyway".
- A meal can be removed on purpose (status `skipped`, #168): not counted in the day target, no boost. Removing a dinner gives the next day a quick lunch; when the dinner comes back, so do the leftovers unless the user changed the lunch (#170).
- Recipe categories are data and extensible (e.g. "Baking" later).

## Folder structure
Feature-based (decision #40):
```
docs/                    Product docs: PRD, DECISIONS, FEEDBACK_LOG, BACKLOG, LIGHTHOUSE (English); PROMPT, FASE1_PROMPT, SVAR_*, Figma prompts (original Norwegian brief); screenshots/ for the README
public/                  Favicon + PWA icons (PNG icons generated by scripts/generate-icons.ps1)
scripts/                 Dev scripts (icon generation)
src/
  app/                   App shell (layout + navigation), router, nav items
  components/            Shared components (PageHeader, ComingSoon)
  components/ui/         Base UI components (shadcn/ui + chip, bottom-sheet)
  data/repository.ts     The ONLY place that reads/writes stored data (async API)
  data/types.ts          The data model (Recipe, Ingredient, Category, Person, HouseholdSettings, WeekPlan, PantryItem)
  features/<feature>/    One folder per feature: week, shopping, pantry, recipes, settings, install, design-preview
  hooks/                 Shared hooks (useBackToClose)
  i18n/                  i18next setup + locales/nb.json, de.json, en.json
  lib/utils.ts           cn() class helper
CLAUDE.md                This file
.env.example             Template for environment variables (no secrets)
```

Conventions:
- All UI text comes from `src/i18n/locales/*.json` (nb is the fallback). Never hard-code UI text.
- Bottom sheets use `components/ui/bottom-sheet.tsx` (swipe, close button, Android back button).
- Toasts: import `toast` from `@/lib/toast` (never directly from `sonner`) – only one message at a time (#148).
- Colours only via design tokens (`bg-primary`, `text-muted-foreground`, …), never raw hex in components. Purple **text** uses `text-primary-text` (not `text-primary`). After changing colours, run `npm run check:contrast`.
- Touch targets ≥ 44 px (`h-11` / `min-h-11`). Respect safe areas with `env(safe-area-inset-*)`.
- **Accessibility – WCAG 2.2 AA is a requirement** (decision #53): contrast in both themes; colour never the only signal; `aria-label` on icon-only buttons; full keyboard use with visible focus (`focus-visible:ring-2 ring-ring`); text sizes in rem; reduced motion respected (global rule in `index.css`). Each screen sets its title via `PageHeader`.
- **Editing files on Windows:** never use PowerShell 5.1 `Get-Content`/`Set-Content` to edit source files – it corrupts UTF-8 (æøå, –, ↻) and adds a BOM. Use the Edit/Write tools or Node.
- Theme (system/light/dark) is stored by `next-themes` under `mp:theme`; everything else via the repository.

## Current phase
**Phase 1 – Foundation – done and published.** Milestones **A–H** done, plus pre-phase-3 work #180–#183. **Next: phase 3** (Home + shopping list), then phase 2 (#144, #174).

**Phase order (decisions #144, #174):** phase 1 → publish (live demo) → phase 3 (Home + shopping list) → phase 2 → 4 → 5 → 6 → 7. Phase numbers are unchanged.

Milestones: A setup/GitHub · B design system + app shell · C data model · D recipes + snacks · E planner logic + tests · F week-plan screen · G onboarding + settings · H documentation.
