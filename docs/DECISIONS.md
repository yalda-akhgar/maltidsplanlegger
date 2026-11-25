# Decision Log

A running log of product and technical decisions for Måltidsplanlegger. Each entry records what was decided, which alternatives were considered, why, and what follows from it. New decisions are appended at the bottom.

---

## 1. Public GitHub repository
- **Date:** 2026-11-15
- **Decision:** Host the code in a public GitHub repository named `maltidsplanlegger`.
- **Alternatives:** Private repository; no hosted repository.
- **Rationale:** The project doubles as a portfolio piece. A public repo lets employers read the code, commit history and documentation.
- **Consequences:** Secrets must never be committed. `.gitignore` and `.env.example` are set up from day one, and all keys live in environment variables or server-side functions.

## 2. Claude Code builds fast with short explanations
- **Date:** 2026-11-15
- **Decision:** Claude Code writes the code; the product owner steers scope, priorities and feedback, and receives short explanations after each step.
- **Alternatives:** Writing all code by hand; long tutorial-style explanations for every step.
- **Rationale:** Keeps the focus on progress and on practising the product manager role: defining requirements, prioritising and acting on user feedback.
- **Consequences:** Work is split into small milestones with a stop after each one for review and approval.

## 3. TypeScript
- **Date:** 2026-11-15
- **Decision:** Use TypeScript for all application code.
- **Alternatives:** Plain JavaScript.
- **Rationale:** Catches errors early, documents the data model in code and is in high demand among employers.
- **Consequences:** Slightly more setup; all data structures are defined as explicit types.

## 4. Browser storage first, Supabase later
- **Date:** 2026-11-15
- **Decision:** Store data in the browser (localStorage) in early phases and move to Supabase in phase 5.
- **Alternatives:** Start with Supabase straight away; another backend (Firebase, custom server).
- **Rationale:** Free, quick to start, and postpones backend work until real user feedback confirms the product direction.
- **Consequences:** All reads and writes go through a single repository layer (`src/data/repository.ts`) so the storage can be swapped without rewriting screens. Data is per device until phase 5.

## 5. React + Vite
- **Date:** 2026-11-15
- **Decision:** Build the frontend with React and Vite.
- **Alternatives:** Next.js, Vue, Svelte.
- **Rationale:** The most widely used UI library, simple tooling, fast development server and free static hosting (Vercel).
- **Consequences:** The app is a single-page application; routing is handled client-side.

## 6. Tailwind CSS + shadcn/ui
- **Date:** 2026-11-15
- **Decision:** Style with Tailwind CSS and build on shadcn/ui components, themed with the purple brand palette (`#7C3AED`).
- **Alternatives:** Plain CSS, Material UI, Chakra UI.
- **Rationale:** Achieves a professional, consistent look quickly while keeping full control of the components' source code.
- **Consequences:** Design tokens (colours, radii, font) are defined once and reused everywhere, which also makes dark mode straightforward.

## 7. Tests on core business rules
- **Date:** 2026-11-15
- **Decision:** Write automated tests (Vitest) for the core rules: week-plan generation, protein calculation and nutritional balance.
- **Alternatives:** No tests; full UI test coverage.
- **Rationale:** The rules are the heart of the product. Tests ensure they don't silently break as features are added, without the cost of testing every screen.
- **Consequences:** Planning logic is kept in pure functions, separate from the UI, so it can be tested in isolation.

## 8. Login with Google + email/password, passkeys for Face ID / fingerprint
- **Date:** 2026-11-15
- **Decision:** Offer Google sign-in and email/password via Supabase Auth, plus passkeys (WebAuthn) for Face ID / fingerprint. No Sign in with Apple.
- **Alternatives:** Sign in with Apple; email magic links only.
- **Rationale:** All chosen methods are free. Sign in with Apple requires a paid Apple Developer account.
- **Consequences:** Implemented in phase 5. Passkey support is feature-detected, with a friendly fallback where it is unavailable.

## 9. Calendar sync optional and off by default
- **Date:** 2026-11-15
- **Decision:** Calendar sync (iCal subscription link for Google/Outlook) is an opt-in toggle in Settings, off by default.
- **Alternatives:** Always-on calendar export; per-meal "add to calendar" buttons.
- **Rationale:** Not every household wants meals in their calendar. Opt-in respects privacy and avoids clutter.
- **Consequences:** The iCal link only exists while the toggle is on and stops working when it is switched off. Implemented in phase 7.

## 10. PWA instead of native app-store apps
- **Date:** 2026-11-15
- **Decision:** Ship as a Progressive Web App that can be installed to the home screen.
- **Alternatives:** Native iOS/Android apps; React Native / Expo.
- **Rationale:** One codebase for iPhone, Android and desktop, free to distribute, no App Store / Google Play fees or review process.
- **Consequences:** Some features depend on browser support (e.g. push on iPhone requires the app to be added to the home screen). Such features are feature-detected and degrade gracefully.

---

## 11. 14 seed recipes in phase 1
- **Date:** 2026-11-15
- **Decision:** Ship the 14 recipes from the prototype as seed data; add more later.
- **Alternatives:** ~25 seed recipes as originally sketched.
- **Rationale:** 14 is enough to generate varied week plans and to test the product with friends and family, and it keeps the first phase small.
- **Consequences:** The seed list can be extended at any time without code changes beyond the data file.

## 12. A child counts as half a portion
- **Date:** 2026-11-15
- **Decision:** For quantity scaling, each child counts as 0.5 of an adult portion. Children have no protein target.
- **Alternatives:** Children count as a full portion; age-based portions.
- **Rationale:** Simple, understandable and close enough for family cooking.
- **Consequences:** Can be refined later (e.g. age-based) if feedback shows the amounts are off.

## 13. Monday lunch comes from the previous week's Sunday dinner
- **Date:** 2026-11-15
- **Decision:** Monday's leftovers lunch uses the previous week's Sunday dinner if that week has a plan; otherwise Monday gets a quick lunch.
- **Alternatives:** Use the same week's Sunday dinner.
- **Rationale:** Leftovers must come from a meal that was actually cooked earlier in time.
- **Consequences:** The planner reads the previous week's plan when generating a new week.

## 14. No repeated dinners within a week; favourites twice as likely
- **Date:** 2026-11-15
- **Decision:** A dinner recipe appears at most once per week. Favourite recipes get double weight when the planner picks dishes.
- **Alternatives:** Allow repeats; always pick favourites first.
- **Rationale:** Variety keeps the plan appealing and nutritionally balanced, while favourites still show up noticeably more often.
- **Consequences:** Covered by tests on the week-plan generator.

## 15. Microphone button hidden until phase 4
- **Date:** 2026-11-15
- **Decision:** The microphone button is not shown until voice input is built in phase 4.
- **Alternatives:** Show it with a "coming soon" message.
- **Rationale:** A visible button that does nothing feels broken to testers.
- **Consequences:** The layout reserves no space for it in phase 1.

## 16. Bottom navigation on mobile, sidebar on desktop
- **Date:** 2026-11-15
- **Decision:** Five-tab bottom navigation on mobile; a side navigation on large screens.
- **Alternatives:** Bottom navigation on all screen sizes.
- **Rationale:** Each pattern is the convention users expect on that device.
- **Consequences:** The app shell switches layout at a breakpoint.

## 17. Supporting libraries
- **Date:** 2026-11-15
- **Decision:** Use `react-router` (routing), `vite-plugin-pwa` (manifest + service worker), `date-fns` (dates and ISO week numbers) and `lucide-react` (icons).
- **Alternatives:** Hand-written routing, service worker and date handling.
- **Rationale:** Free, widely used, well maintained, and they remove error-prone boilerplate.
- **Consequences:** Small additional bundle size.

## 18. Only pork excluded by default, plus custom exclusions
> **Superseded by #188** (nothing is excluded by default; pork stays one tap away).

- **Date:** 2026-11-15
- **Decision:** Pork is the only food excluded by default. Users can add their own exclusions through a "Add food we don't want" field.
- **Alternatives:** Preset exclusion chips for fish/seafood and nuts.
- **Rationale:** The household eats fish and nuts; preset chips for them would add noise. A free-text field covers any other needs.
- **Consequences:** Exclusions are matched against recipe tags and ingredient names. Excluded food is never suggested anywhere in the app.

## 19. Personal daily protein targets as the core feature
- **Date:** 2026-11-15
- **Decision:** Each adult has their own daily protein target (e.g. 120 g and 140 g). The planner chooses dishes and adjusts each person's portion size so breakfast + lunch + dinner + evening snack meet the target. If a gap remains, it suggests a "protein boost" (e.g. +1 skyr = 12 g). Each day shows progress per person (e.g. "Yalda: 118 / 120 g").
- **Alternatives:** One shared household target; showing protein without targets.
- **Rationale:** Protein-balanced planning is the product's core value and the main differentiator from generic meal planners.
- **Consequences:** Ingredients need protein values per unit, and the calculation is covered by tests. Changing a target updates the current and future weeks, never past days.

## 20. Default protein split 25 / 30 / 30 / 15 %
- **Date:** 2026-11-15
- **Decision:** The daily target is split ~25 % breakfast, 30 % lunch, 30 % dinner, 15 % evening snack, adjustable in Settings.
- **Alternatives:** Equal split; no per-meal split.
- **Rationale:** A sensible default that matches typical eating patterns while staying configurable.
- **Consequences:** Portion sizes are calculated per meal from this split.

## 21. Evening snack and cheat days
- **Date:** 2026-11-15
- **Decision:** Every day has one evening snack (a 4th row) that can be swapped. On normal days it is always healthy and high-protein. Only on user-chosen cheat days can it be something else from the favourites, labelled "Cheat day". Snack favourites appear more often but with variety. The protein target still applies on cheat days.
- **Alternatives:** No snacks; free snack choice every day.
- **Rationale:** Makes the plan realistic and sustainable while keeping the protein goal intact.
- **Consequences:** A separate snack library with nutrition data and a "healthy" / "cheat" label.

## 22. No seasonal logic
- **Date:** 2026-11-15
- **Decision:** No seasonal logic in the planner or UI.
- **Alternatives:** Seasonal recipe suggestions.
- **Rationale:** The app should work the same in Norway, Germany and other countries.
- **Consequences:** May be revisited later as a subtle background factor.

## 23. Daily nutritional balance
- **Date:** 2026-11-15
- **Decision:** The planner aims for nutritious days, not only protein-rich ones: varied protein sources, fruit and vegetables every day, fibre-rich carbohydrates, and no same protein source for dinner several days in a row. Each day shows a simple "Today's nutrition" summary (protein vs target, fruit/veg portions vs ~5, fibre, approx. kcal), positive in tone and without medical advice.
- **Alternatives:** Protein only; full macro/micronutrient tracking.
- **Rationale:** Balanced nutrition is what families actually need; a light summary is useful without becoming a diet tracker.
- **Consequences:** Ingredients carry simple nutrition data (protein, kcal, fibre, fruit/veg portions). Balance rules are covered by tests.

## 24. Onboarding wizard
- **Date:** 2026-11-15
- **Decision:** On first launch, a short wizard asks for name, daily protein target (with an optional, clearly-labelled guideline calculator: body weight × 1.2–2.0 g by activity level), household size, foods to exclude (pork preselected) and cheat days. Every step can be skipped; afterwards the first week plan is generated automatically.
- **Alternatives:** Drop users straight into an empty app with defaults.
- **Rationale:** Personal targets are the core value, so collecting them up front makes the first plan immediately relevant.
- **Consequences:** Settings get a "My profile" section to change the target later. The wizard will be connected to login in phase 5.

## 25. Future-proof data model
- **Date:** 2026-11-15
- **Decision:** The data model includes fields for nutrition data, child-friendliness, rating (👍/👎), price and expiry date from the start, even though some features using them come in later phases.
- **Alternatives:** Add fields when each feature is built.
- **Rationale:** Avoids data migrations of locally stored data and keeps the later move to Supabase simpler.
- **Consequences:** Some fields are optional and unused in phase 1.

## 26. Phase prioritisation (MVP first)
- **Date:** 2026-11-15
- **Decision:** Phase 1 delivers the core value: protein-balanced family planning (recipes, week plan with personal targets, evening snacks, nutritional balance, onboarding, child-friendly tags and children's dislikes, "eating out / guests", dark mode), stored locally. Engagement and convenience features follow: cooking mode, ratings and weekly summary (phase 2); pantry, shopping list, expiry dates, packed-lunch mode, budget and sharing the list (phase 3); voice (4); login and sharing (5); AI (6); publishing, push reminders, feedback button and analytics (7).
- **Alternatives:** Build all features before the first user test; start with login and sharing.
- **Rationale:** Validate the core value with real users as early as possible. Engagement features are prioritised once there is real usage data and feedback.
- **Consequences:** The prototype tested with friends and family in phase 1 has no login, sharing or AI; feedback is captured in `docs/FEEDBACK_LOG.md` and shapes later phases.

## 27. Portion adjustment limited to 0.75×–2× per person
- **Date:** 2026-11-15
- **Decision:** To meet a protein target, a person's portion can be scaled between 0.75× and 2× a standard portion. Any remaining gap is covered by a "protein boost" suggestion.
- **Alternatives:** No limit; fixed portions with boosts only.
- **Rationale:** Prevents unrealistic amounts (e.g. four portions of salmon) while still personalising portions.
- **Consequences:** The limits are covered by tests on the protein calculation.

## 28. Children's dislikes are avoided where possible
- **Date:** 2026-11-15
- **Decision:** The planner avoids dishes a child dislikes when possible. If it cannot, the dish is shown with a small note (e.g. "Emma doesn't like salmon").
- **Alternatives:** Never suggest such dishes (hard exclusion).
- **Rationale:** A hard exclusion could leave too few dishes to plan a varied week.
- **Consequences:** Dislikes are a soft preference, unlike household exclusions (e.g. pork), which are hard rules.

## 29. Protein is calculated from ingredients
- **Date:** 2026-11-15
- **Decision:** A recipe's protein (and other nutrition values) is calculated from its ingredients' nutrition data. Seed recipe amounts are tuned so results land close to the prototype values (e.g. 42 g). Values are approximate, based on common food composition tables.
- **Alternatives:** Store a fixed protein number per recipe.
- **Rationale:** One source of truth: numbers stay correct when portions are scaled or ingredients are edited.
- **Consequences:** Every ingredient needs nutrition data per unit. Displayed numbers are approximations.

## 30. "Eating out" on a dinner means a quick lunch the next day
- **Date:** 2026-11-15
- **Decision:** If the household eats out for dinner, there are no leftovers, so the next day's lunch becomes a quick lunch (as on Saturday).
- **Alternatives:** Leave the next day's lunch empty.
- **Rationale:** Keeps the "lunch = leftovers" rule consistent and every day complete.
- **Consequences:** Covered by tests on the week-plan generator.

## 31. Guests get a standard adult portion
- **Date:** 2026-11-15
- **Decision:** "We have guests" asks for the number of guests; each guest gets a standard adult portion with no protein target.
- **Alternatives:** Guests scaled like household members with targets.
- **Rationale:** Simple, and guests' protein needs are unknown.
- **Consequences:** Quantities for that meal increase; personal portions are unaffected.

## 32. "My profile" belongs to the first adult until login exists
- **Date:** 2026-11-15
- **Decision:** Without login, "My profile" is the first adult in the household. Other adults' targets are edited under "Household". From phase 5, each person has their own profile.
- **Alternatives:** A profile switcher in phase 1.
- **Rationale:** Simplest solution until there is real user identity.
- **Consequences:** The data model stores people with ids, so profiles can be tied to accounts later.

## 33. Target changes apply from today onwards
- **Date:** 2026-11-15
- **Decision:** When a protein target changes mid-week, portions are recalculated from today onwards. Past days keep their numbers.
- **Alternatives:** Recalculate the whole current week.
- **Rationale:** History should reflect what was actually planned and eaten.
- **Consequences:** Each planned day stores the targets it was calculated with.

## 34. The product owner makes all choices
- **Date:** 2026-11-15
- **Decision:** Claude Code never makes choices on its own about features, design, text, technology, packages, folder structure, data model or rule behaviour. When a choice comes up, it stops, explains briefly, offers 2–3 alternatives with consequences and a recommendation, and waits for the product owner's decision. Only purely technical details with no impact on users (e.g. variable names) are decided by Claude Code, and they are mentioned in the summary.
- **Alternatives:** Claude Code decides smaller matters on its own.
- **Rationale:** The product owner keeps full control of the product and practises making and documenting decisions, which is the core of the PM role.
- **Consequences:** The rule is placed at the top of `CLAUDE.md` and applies in every session. Progress may pause more often while waiting for decisions; small choices are batched into one list.

## 35. Backlog for new ideas
- **Date:** 2026-11-15
- **Decision:** New ideas that come up during development are added to `docs/BACKLOG.md` (in English) instead of being built immediately. The backlog is reviewed before each phase.
- **Alternatives:** Build ideas as they come; keep ideas in chat only.
- **Rationale:** Protects the focus of each phase and gives a documented trail of prioritisation.
- **Consequences:** The backlog is referenced in `README.md` and `CLAUDE.md`.

## 36. Extensible recipe categories
- **Date:** 2026-11-15
- **Decision:** Recipe categories are data, not a fixed list in code, so new categories (e.g. "Baking") can be added later without restructuring. Default categories: breakfast, lunch, dinner, snack.
- **Alternatives:** A fixed set of meal types in the type system.
- **Rationale:** Baking is already in the backlog; avoiding a rebuild later is cheap now.
- **Consequences:** No baking functionality is built now. Planner logic refers to categories by id.

## 37. GitHub noreply address for commits
- **Date:** 2026-11-15
- **Decision:** The GitHub account is created with a new private e-mail address, and commits use GitHub's private noreply address (`…@users.noreply.github.com`). The student (NTNU) address is never used.
- **Alternatives:** Use the private e-mail address in commits (publicly visible in a public repo).
- **Rationale:** Commits stay linked to the GitHub profile without exposing a personal e-mail address to spam or scraping, and the project is independent of the bootcamp.
- **Consequences:** Git is configured per repository with the noreply address, overriding the global NTNU address on this PC. The commit author name is the full name "Yalda Akhgar" (chosen over the username for a professional portfolio).

## 38. Repository description
- **Date:** 2026-11-16
- **Decision:** The GitHub repository description is "Protein-balanced family meal planner (PWA)".
- **Alternatives:** A Norwegian description; a longer description listing features.
- **Rationale:** Short, in English for an international audience of employers, and states the core value.
- **Consequences:** Can be changed at any time with `gh repo edit --description`.

## 39. AI co-authorship shown in commits
- **Date:** 2026-11-16
- **Decision:** Commits keep the `Co-Authored-By: Claude` trailer.
- **Alternatives:** Remove the trailer.
- **Rationale:** Transparent about how the project is built; working with an AI coding assistant as a product owner is part of the portfolio story.
- **Consequences:** GitHub shows Claude as a co-author on commits.

## 40. Feature-based folder structure
- **Date:** 2026-11-16
- **Decision:** Organise code by feature: `src/features/<feature>/`, shared UI in `src/components/ui/`, data layer in `src/data/`, translations in `src/i18n/`.
- **Alternatives:** Organise by type (all screens in one folder, all logic in another).
- **Rationale:** Easy to navigate as the app grows and easy to explain.
- **Consequences:** Each new feature gets its own folder.

## 41. Swipeable bottom sheets
- **Date:** 2026-11-16
- **Decision:** Bottom sheets can be swiped down to close (shadcn Drawer, built on `vaul`).
- **Alternatives:** A simpler sheet closed only by a button or the back button.
- **Rationale:** Feels like a native app on mobile.
- **Consequences:** Adds the `vaul` package. Sheets also close with the Android back button.

## 42. Self-hosted Inter font
- **Date:** 2026-11-16
- **Decision:** Bundle Inter with the app via `@fontsource-variable/inter`.
- **Alternatives:** Load Inter from Google Fonts.
- **Rationale:** Works offline (PWA) and sends no data to Google (privacy, GDPR – relevant in Germany).
- **Consequences:** Slightly larger app download.

## 43. Dark mode follows the system, with a manual override
- **Date:** 2026-11-16
- **Decision:** The theme follows the device setting by default; Settings offers "System / Light / Dark".
- **Alternatives:** Manual setting only; system setting only.
- **Rationale:** Right by default, with control for those who want it.
- **Consequences:** The choice is stored per device.

## 44. Dark palette
- **Date:** 2026-11-16
- **Decision:** Dark mode uses background `#14121B`, cards `#1F1B2E`, text `#F4F2FA`, muted text `#A8A4BC`, and a lighter purple `#8B5CF6` as primary.
- **Alternatives:** Other dark colours.
- **Rationale:** Keeps the purple identity with good contrast on dark backgrounds.
- **Consequences:** All colours are design tokens, so they can be tuned in one place.

## 45. Home screen name "Måltider"
- **Date:** 2026-11-16
- **Decision:** The installed app's short name is "Måltider"; the full name "Måltidsplanlegger" is used in the app and browser tab.
- **Alternatives:** "Matplan", "Måltidsplan".
- **Rationale:** "Måltidsplanlegger" is truncated under home screen icons on iPhone.
- **Consequences:** May change when a brand name is chosen (backlog #3).

## 46. App icon: knife and fork
- **Date:** 2026-11-16
- **Decision:** A purple rounded square with a white knife-and-fork symbol.
- **Alternatives:** The letter "M"; a bowl.
- **Rationale:** Instantly recognisable as a food app.
- **Consequences:** Includes a maskable variant for Android and an apple-touch-icon for iPhone.

## 47. Navigation icons
- **Date:** 2026-11-16
- **Decision:** Week = calendar, Shopping list = cart, Home (pantry) = fridge, Recipes = book, Settings = gear.
- **Alternatives:** A house icon for the pantry tab.
- **Rationale:** A house could be mistaken for a "start page"; a fridge clearly means "food at home".
- **Consequences:** None.

## 48. Side navigation from 1024 px
- **Date:** 2026-11-16
- **Decision:** Bottom navigation below 1024 px, side navigation from 1024 px.
- **Alternatives:** Switch at 768 px.
- **Rationale:** Tablets in portrait keep the familiar mobile layout; desktops get a sidebar.
- **Consequences:** None.

## 49. Toasts at the top
- **Date:** 2026-11-16
- **Decision:** Confirmation toasts appear at the top of the screen.
- **Alternatives:** At the bottom, above the navigation.
- **Rationale:** Matches the prototype and never hides the navigation.
- **Consequences:** Positioned below the iPhone notch (safe area).

## 50. "Add to home screen" guide
- **Date:** 2026-11-16
- **Decision:** A dismissible card on the Week screen, and the guide is always available in Settings. It adapts to the device (Android: install button; iPhone: Share → "Add to Home Screen").
- **Alternatives:** Settings only; a pop-up on first visit.
- **Rationale:** Visible without being intrusive.
- **Consequences:** The card is hidden once dismissed or when the app is already installed.

## 51. Automatic app updates
- **Date:** 2026-11-16
- **Decision:** New versions are installed automatically the next time the app opens.
- **Alternatives:** Show a "New version – tap to update" prompt.
- **Rationale:** Users never have to think about updates.
- **Consequences:** The service worker updates silently in the background.

## 52. "Coming soon" screens
- **Date:** 2026-11-16
- **Decision:** Screens not built yet show a heading, "Coming soon" and one sentence about what the screen will do.
- **Alternatives:** Just "Coming soon".
- **Rationale:** Testers understand the product vision and can give feedback on it.
- **Consequences:** Texts live in the translation files.

## 53. Accessibility: WCAG 2.2 level AA for the whole app
- **Date:** 2026-11-16
- **Decision:** The whole app must meet WCAG 2.2 level AA. In practice:
  - **Contrast** in both light and dark mode: text ≥ 4.5:1, UI component boundaries and meaningful icons ≥ 3:1.
  - **Colour is never the only signal** (e.g. selected chips also show a check mark; the active menu item is also bold).
  - **Screen readers:** every icon-only button has an `aria-label`; decorative icons are hidden; correct landmarks, headings, page titles and `lang`.
  - **Full keyboard use** with a clearly visible focus indicator.
  - **Touch targets at least 44 × 44 px** (stricter than AA's 24 px).
  - **Larger text:** sizes in `rem`, no fixed text heights, works at 200 % text size and at 320 px width.
  - **Reduced motion:** animations are switched off when the device asks for reduced motion.
- **Alternatives:** WCAG 2.1 AA; best effort without a formal level.
- **Rationale:** The app is for whole families, including people with impaired vision or motor skills. Accessibility is also a legal requirement for many digital services in the EU (European Accessibility Act) and a strong signal of quality to employers.
- **Consequences:** `npm run check:contrast` verifies all colour pairs in both themes and must pass. Every new component is checked against this list. To meet the contrast rules, input/switch borders were darkened (`#8A8699` light, `#746E8A` dark), the error red was darkened to `#B91C1C`, and purple text uses its own token (`--primary-text`: `#7C3AED` light, `#C4B5FD` dark), so the purple fill can be darker than purple text in dark mode.

## 54. Darker dark-mode purple: `#8453F6`
- **Date:** 2026-11-16
- **Decision:** The dark-mode primary purple changes from `#8B5CF6` to `#8453F6` (amends #44).
- **Alternatives:** Keep `#8B5CF6` (white text only 4.2:1); use dark text on the purple.
- **Rationale:** White text on `#8453F6` reaches 4.6:1 (WCAG AA), while the colour looks almost identical.
- **Consequences:** Focus rings in dark mode keep the lighter `#8B5CF6`, which only needs 3:1.

## 55. Search engines blocked (`robots.txt`)
- **Date:** 2026-11-16
- **Decision:** `robots.txt` asks all search engines not to index the app.
- **Alternatives:** Allow indexing; postpone until publishing in phase 7.
- **Rationale:** A private family tool with no public content worth finding. Employers find the project via GitHub and the README.
- **Consequences:** Fixes the Lighthouse SEO finding. To be reconsidered in phase 7.

> Decisions #56–#61 were made by Claude Code during milestone B without asking first, and approved afterwards by the product owner on 2026-11-16. Going forward, such choices – including small design choices – are asked about **before** they are made (#34).

## 56. shadcn/ui "Maia" style on Radix
- **Date:** 2026-11-16
- **Decision:** Use the shadcn/ui "Maia" preset (soft, rounded, generous spacing) built on Radix primitives.
- **Alternatives:** Other presets (Vega, Nova, Lyra, Mira …), which are sharper or denser.
- **Rationale:** Closest match to the brief: rounded corners, lots of white space, calm look.
- **Consequences:** Component defaults were adjusted to the brand tokens and 44 px targets.

## 57. Dark toasts
- **Date:** 2026-11-16
- **Decision:** Toasts are dark with light text (inverted relative to the page), as in the Figma prototype.
- **Alternatives:** Toasts in the card colour.
- **Rationale:** Stands out clearly from the content without being alarming.
- **Consequences:** In dark mode the toast is light.

## 58. Pill-shaped chips
- **Date:** 2026-11-16
- **Decision:** Chips (filters, choices) are fully rounded pills; buttons and inputs use 14 px corners.
- **Alternatives:** Chips with 14 px corners like buttons.
- **Rationale:** Visually separates "choose" (chips) from "act" (buttons).
- **Consequences:** None.

## 59. Status bar colour matches the page background
- **Date:** 2026-11-16
- **Decision:** The phone status bar / installed-app title bar uses the page background colour (light or dark), not purple.
- **Alternatives:** Purple status bar.
- **Rationale:** Calm, seamless look; follows the active theme.
- **Consequences:** Updated automatically when the theme changes.

## 60. English URL paths
- **Date:** 2026-11-16
- **Decision:** Routes use English paths (`/week`, `/shopping`, `/pantry`, `/recipes`, `/settings`).
- **Alternatives:** Norwegian paths (`/uke`, …); paths per language.
- **Rationale:** Language-neutral for a multilingual app; users rarely see URLs.
- **Consequences:** None.

## 61. Dev server reachable on the local network
- **Date:** 2026-11-16
- **Decision:** The development server listens on the local network (`host: true`).
- **Alternatives:** Localhost only.
- **Rationale:** Allows testing on real phones on the same Wi-Fi.
- **Consequences:** Others on the same network can open the dev version while it runs; Windows may ask for firewall permission.

## 62. Shared ingredient catalogue
- **Date:** 2026-11-16
- **Decision:** Ingredients live in one shared catalogue; recipes reference them by id with an amount and unit.
- **Alternatives:** Free-text ingredient lines per recipe.
- **Rationale:** Required to calculate nutrition, merge quantities on the shopping list and track the pantry.
- **Consequences:** The recipe form picks ingredients from the catalogue or adds a new one.

## 63. Nutrition values are optional for new ingredients
- **Date:** 2026-11-16
- **Decision:** A new ingredient can be saved without nutrition values. Missing values count as 0 and the recipe is marked "nutrition data missing".
- **Alternatives:** Require protein and kcal.
- **Rationale:** Adding a recipe should be quick; the warning keeps numbers honest.
- **Consequences:** The planner and UI must handle ingredients without nutrition data.

## 64. Fixed list of units with weight conversion
- **Date:** 2026-11-16
- **Decision:** Units come from a fixed list: g, kg, ml, dl, l, tbsp, tsp, pcs, pinch, pack, can – translated per language (e.g. "ss"/"EL"/"tbsp"). Each ingredient stores how many grams one unit weighs (e.g. 1 egg = 60 g, 1 dl oats = 35 g). Nutrition is stored per 100 g.
- **Alternatives:** Free-text units.
- **Rationale:** Makes portion scaling, nutrition calculation and quantity merging possible.
- **Consequences:** Seed ingredients include unit weights.

## 65. Seed content in three languages
- **Date:** 2026-11-16
- **Decision:** Seed recipes and the ingredient catalogue are written in Norwegian, German and English. User-created recipes are stored in the language they are written in.
- **Alternatives:** Norwegian only for now.
- **Rationale:** German and English users get a usable app, including the shopping list.
- **Consequences:** Text fields in recipes and ingredients are "localized text" with one value per language and a fallback.

## 66. Recipes can have several categories
- **Date:** 2026-11-16
- **Decision:** A recipe can belong to more than one category (e.g. an omelette for breakfast and lunch).
- **Alternatives:** Exactly one category.
- **Rationale:** Gives the planner more dishes to choose from.
- **Consequences:** Filters and the planner match on "has category".

## 67. Snacks are recipes
- **Date:** 2026-11-16
- **Decision:** Snacks are ordinary recipes in the "snack" category, additionally marked "healthy" or "cheat". Steps are optional.
- **Alternatives:** A separate, simpler snack type.
- **Rationale:** Search, favourites and nutrition calculation work for snacks without extra code.
- **Consequences:** Only cheat-marked snacks can be planned on cheat days (#21).

## 68. Tags and protein sources come from ingredients
- **Date:** 2026-11-16
- **Decision:** Each ingredient carries tags (e.g. pork, fish, nuts) and a protein source; recipes inherit them automatically. Custom exclusions (free text) are matched against ingredient names in all three languages.
- **Alternatives:** Tag each recipe by hand.
- **Rationale:** Nothing is forgotten when a recipe changes; exclusions stay reliable.
- **Consequences:** Recipes may still have extra manual tags.

## 69. Household as a list of named people
- **Date:** 2026-11-16
- **Decision:** The household is a list of people with names. Adults have a protein target; children have dislikes. The number of adults and children is counted from the list.
- **Alternatives:** Just counts of adults and children.
- **Rationale:** Needed for per-person targets and progress ("Yalda: 118 / 120 g").
- **Consequences:** Onboarding creates people; people get ids that can be linked to accounts in phase 5.

## 70. Children's dislikes are chosen from the ingredient catalogue
- **Date:** 2026-11-16
- **Decision:** Dislikes reference catalogue ingredients.
- **Alternatives:** Free text.
- **Rationale:** Reliable matching in every language.
- **Consequences:** None.

## 71. One rating per household
- **Date:** 2026-11-16
- **Decision:** A recipe has a single 👍/👎 rating for the household (used in phase 2).
- **Alternatives:** A rating per person.
- **Rationale:** Simplest; fits "liked dishes are suggested more often". Per-person ratings need per-person login (phase 5).
- **Consequences:** Can be extended to per-person ratings later.

## 72. Optional price with currency
- **Date:** 2026-11-16
- **Decision:** Ingredients may have a price per unit with a currency code (e.g. NOK, EUR), used for the weekly budget in phase 3.
- **Alternatives:** Price without currency (always NOK).
- **Rationale:** The app is meant to work in Norway, Germany and elsewhere.
- **Consequences:** None in phase 1.

## 73. Technical data conventions
- **Date:** 2026-11-16
- **Decision:** Every record has a unique random id; stored data carries a schema version so it can be migrated; week plans are keyed by ISO week (e.g. `2026-W47`, weeks start on Monday).
- **Alternatives:** Sequential ids; unversioned data; weeks keyed by start date.
- **Rationale:** Safe to sync later (phase 5), safe to upgrade, unambiguous across countries.
- **Consequences:** None for users.

## 74. UI language per person/device
- **Date:** 2026-11-16
- **Decision:** The app language is chosen per person/device, not shared by the household. In phase 1 (no login) it is stored on the device; in phase 5 it moves to each person's account.
- **Alternatives:** One language for the whole household (as in the phase 1 brief).
- **Rationale:** Family members may prefer different languages (e.g. Norwegian and German) when the household is shared in phase 5.
- **Consequences:** `language` removed from `HouseholdSettings`; stored data upgraded to schema version 2 (the language is moved to the device automatically).

## 75. Guests and "eating out" per meal
- **Date:** 2026-11-16
- **Decision:** The week-plan screen lets the user set guests and "we're eating out" per meal (e.g. guests only for dinner).
- **Alternatives:** Per whole day.
- **Rationale:** Matches real life; the data model already stores it per meal.
- **Consequences:** Milestone F needs a per-meal action for this.

## 76. Seed snacks: 10 healthy + 3 cheat
- **Date:** 2026-11-16
- **Decision:** Healthy: skyr with vanilla, skyr with blueberries, skyr with mango, Greek yoghurt with walnuts, cottage cheese with pineapple, 2 boiled eggs, mixed nuts, edamame, quark with apple and cinnamon, carrot and cucumber with hummus. Cheat: nachos with cheese and salsa, ice cream with berries, popcorn.
- **Alternatives:** 5 + 2 snacks; a list written by the product owner.
- **Rationale:** Enough variety for a week of evening snacks (#21, #22).
- **Consequences:** More snacks can be added in the app.

## 77. Kid-friendly marking of seed recipes
- **Date:** 2026-11-16
- **Decision:** All seed recipes are marked kid-friendly except chicken tikka (spicy) and the lentil and chickpea stew. The user can change it in the app.
- **Alternatives:** Mark none and let the user do it.
- **Rationale:** Useful from day one; easy to correct.
- **Consequences:** None.

## 78. Seed recipes are editable and deletable
- **Date:** 2026-11-16
- **Decision:** Seed recipes behave like the user's own: they can be edited and deleted.
- **Alternatives:** Read-only seeds that can only be copied.
- **Rationale:** Simplest for the user.
- **Consequences:** A deleted seed recipe does not come back by itself ("restore seed recipes" could be added later).

## 79. Recipe filters
- **Date:** 2026-11-16
- **Decision:** Filter chips: All · Breakfast · Lunch · Dinner · Snacks · Favourites · Kid-friendly (meal order of the day).
- **Alternatives:** The prototype order without Snacks/Kid-friendly.
- **Rationale:** Matches the day; kid-friendly is useful for families.
- **Consequences:** None.

## 80. Recipe card initial tile in light purple
- **Date:** 2026-11-16
- **Decision:** Every recipe card shows a light purple tile with the purple first letter.
- **Alternatives:** One colour per category.
- **Rationale:** Safe contrast in both themes without new colours.
- **Consequences:** None.

## 81. Text badges on recipe cards
- **Date:** 2026-11-16
- **Decision:** Cards show text badges "Kid-friendly" and "Healthy"/"Cheat" (snacks).
- **Alternatives:** Badges only in the detail view.
- **Rationale:** Visible at a glance; text, not colour alone (WCAG).
- **Consequences:** None.

## 82. Recipes sorted alphabetically
- **Date:** 2026-11-16
- **Decision:** The recipe list is sorted alphabetically (in the current language).
- **Alternatives:** Favourites first; newest first.
- **Rationale:** Predictable and easy to scan.
- **Consequences:** None.

## 83. Portion stepper in the recipe detail
- **Date:** 2026-11-16
- **Decision:** The detail sheet has a −/+ portion stepper. It starts at the household size (adult = 1, child = ½), or at the recipe's servings if no household is set up yet.
- **Alternatives:** Only the recipe's own servings.
- **Rationale:** Works before onboarding (milestone G) and is useful afterwards.
- **Consequences:** None.

## 84. Rounding of scaled amounts
- **Date:** 2026-11-16
- **Decision:** Pieces are rounded to the nearest half, except eggs, which are always whole. Grams are rounded to 5 or 10, dl and l to one decimal.
- **Alternatives:** No rounding; eggs to the nearest half.
- **Rationale:** Amounts you can actually measure; nobody uses half an egg.
- **Consequences:** Ingredients get a "whole units only" flag (set for eggs).

## 85. Recipe form on its own page
- **Date:** 2026-11-16
- **Decision:** Adding and editing recipes happens on a separate page with a back button.
- **Alternatives:** A large bottom sheet.
- **Rationale:** Long forms are hard to use in a sheet on small screens.
- **Consequences:** Routes `/recipes/new` and `/recipes/:id/edit`.

## 86. "New recipe" goes straight to the form
- **Date:** 2026-11-16
- **Decision:** The button opens the form directly; import from link/photo comes in phase 6.
- **Alternatives:** A sheet with three options, two marked "Coming soon".
- **Rationale:** No dead ends.
- **Consequences:** The choice sheet is added in phase 6.

## 87. One field per recipe step
- **Date:** 2026-11-16
- **Decision:** Each step has its own field, with "+ Add step" and a delete button.
- **Alternatives:** One large text field, one step per line.
- **Rationale:** Clearer and easier with a screen reader.
- **Consequences:** None.

## 88. Delete with undo
- **Date:** 2026-11-16
- **Decision:** Deleting a recipe happens immediately and shows a toast "Recipe deleted · Undo".
- **Alternatives:** A confirmation dialog first.
- **Rationale:** Faster; mistakes are easy to undo.
- **Consequences:** None.

## 89. New ingredients: nutrition optional
- **Date:** 2026-11-16
- **Decision:** A new ingredient needs only a name and a store section. Protein and kcal can be filled in; if left empty the recipe is marked "nutrition missing".
- **Alternatives:** All nutrition fields required.
- **Rationale:** Quick to add; honest about missing data (#63).
- **Consequences:** None.

## 90. Page header: actions below the title on mobile
- **Date:** 2026-11-16
- **Decision:** Buttons in the page header (e.g. "New recipe") wrap below the title on narrow screens.
- **Alternatives:** A small round "+" button next to the title.
- **Rationale:** The title never breaks mid-word, and the button keeps a clear text label.
- **Consequences:** Applies to every screen that uses `PageHeader`.

## 91. Smaller bottom-nav labels on the narrowest screens
- **Date:** 2026-11-16
- **Decision:** Below 360 px width the bottom-nav labels use 0.625rem instead of 0.6875rem.
- **Alternatives:** Shorter nav labels.
- **Rationale:** Keeps the familiar names; Norwegian and English labels now fit on one line at 320 px.
- **Consequences:** The German labels "Einkaufsliste" and "Einstellungen" still wrap at 320 px (open question).

## 92. Recipe search also matches ingredients
- **Date:** 2026-11-16
- **Decision:** The search on the recipes screen matches the recipe name and its ingredient names, in the current UI language.
- **Alternatives:** Recipe name only.
- **Rationale:** "What can I make with salmon?" is a common question.
- **Consequences:** None.

## 93. Warning before leaving a form with unsaved changes
- **Date:** 2026-11-16
- **Decision:** Leaving the recipe form with unsaved changes (Back, Cancel, bottom nav, Android/browser back) shows a centered dialog: "Discard changes?" with "Keep editing" (focused) and "Discard changes" (red). Reloading or closing the tab shows the browser's own warning.
- **Alternatives:** Add it to the backlog; a bottom sheet; the browser's built-in confirm box.
- **Rationale:** Losing a half-written recipe is frustrating. A dialog is the clearest warning and is translated.
- **Consequences:** New shared component `components/ui/confirm-dialog.tsx` (Radix AlertDialog, already part of `radix-ui`). Can be reused by other forms.

## 94. Bundle size is handled in milestone H
- **Date:** 2026-11-16
- **Decision:** The build warning about the JavaScript bundle (> 500 kB) is addressed in milestone H (code splitting).
- **Alternatives:** Fix it now.
- **Rationale:** It does not affect features; better to optimise once the screens exist.
- **Consequences:** The warning remains until milestone H.

## 95. Breakfast, quick lunch and snacks: no repeat on consecutive days
- **Date:** 2026-11-16
- **Decision:** Breakfasts, quick lunches and snacks may repeat within a week, but never on two days in a row. Favourites get double weight.
- **Alternatives:** Each dish at most twice per week.
- **Rationale:** There are fewer of these recipes than days (5 breakfasts, 2 lunches, 10 healthy snacks).
- **Consequences:** Relaxed only if no other dish is available.

## 96. Dinner protein source: never the same two days in a row
- **Date:** 2026-11-16
- **Decision:** Two dinners on consecutive days never share the same main protein source. Chicken and turkey count as the same source ("poultry").
- **Alternatives:** At most two in a row; chicken and turkey as separate sources.
- **Rationale:** Variety (#23); chicken and turkey are nutritionally very similar.
- **Consequences:** A recipe's main protein source is the source of the ingredient that contributes the most protein.

## 97. All dinners take at most 30 minutes
- **Date:** 2026-11-16
- **Decision:** The planner only picks dinners that take 30 minutes or less, every day of the week.
- **Alternatives:** Longer dinners allowed on Saturday and Sunday.
- **Rationale:** Matches the brief; all seed dinners are ≤ 30 min.
- **Consequences:** Longer weekend dinners are in the backlog.

## 98. Cheat-day snacks
- **Date:** 2026-11-16
- **Decision:** On cheat days the snack is picked from all cheat snacks, with double weight for favourites. If there are no cheat snacks, a healthy snack is used.
- **Alternatives:** Only favourite cheat snacks.
- **Rationale:** Works from day one, even before the user has marked favourites.
- **Consequences:** The protein target still applies (#21); a protein boost may be suggested.

## 99. Fruit and vegetables shown, not optimised
- **Date:** 2026-11-16
- **Decision:** Fruit/vegetable portions are calculated and shown in "Today's nutrition", but the planner does not actively optimise for them yet.
- **Alternatives:** The planner prefers dishes with more fruit and vegetables.
- **Rationale:** Keeps the planner logic simple for the first version.
- **Consequences:** Active optimisation is in the backlog.

## 100. Relaxing rules when there are too few recipes
- **Date:** 2026-11-16
- **Decision:** If the rules cannot all be met, they are relaxed one by one – first a repeated dinner is allowed, then the same protein source on consecutive days – and the plan shows a small note. A slot stays empty only if there is no suitable recipe at all.
- **Alternatives:** Leave the slot empty with "Add more recipes".
- **Rationale:** A complete plan is more useful than a gap; the note keeps it honest.
- **Consequences:** Hard rules (excluded food, 30 min, fixed days without dinner at home) are never relaxed. Dislikes are relaxed last (#110).

## 101. Personal portions rounded to quarter portions
- **Date:** 2026-11-16
- **Decision:** Each adult's portion is rounded to the nearest ¼ portion (within 0.75×–2×, #27).
- **Alternatives:** Half portions.
- **Rationale:** Hits the protein target more closely while staying easy to understand.
- **Consequences:** None.

## 102. Children's weekday lunch is a per-child setting
- **Date:** 2026-11-16
- **Decision:** Each child has the setting "Eats lunch at home on weekdays" (yes/no, default no). On Saturday and Sunday children always eat lunch at home.
- **Alternatives:** Children never eat weekday lunch at home; children always do.
- **Rationale:** Families differ (school, kindergarten, home); the default fits most.
- **Consequences:** New optional field on `Person`; fewer leftovers are cooked when children eat elsewhere. The setting is shown in milestone G.

## 103. Protein boost
- **Date:** 2026-11-16
- **Decision:** A boost is suggested when a person is at least 5 g below their daily target. It is the single item from a fixed list (1 egg, a glass of milk, cottage cheese, skyr) that covers the gap with the least extra; if none covers it, the largest one. Excluded foods are skipped.
- **Alternatives:** A 10 g threshold.
- **Rationale:** Simple, concrete and realistic.
- **Consequences:** None.

## 104. "Make week plan" in the middle of a week
- **Date:** 2026-11-16
- **Decision:** Only today and the following days are generated again. Earlier days are kept, and so are guests and "eating out" on the regenerated days. An empty week is filled completely.
- **Alternatives:** Always regenerate the whole week.
- **Rationale:** The past should reflect what was actually eaten (#33).
- **Consequences:** Covered by tests.

## 105. Swapping a leftovers lunch
- **Date:** 2026-11-16
- **Decision:** Swapping (↻) a leftovers lunch turns it into a quick lunch, and the dinner the day before is then cooked with fewer portions.
- **Alternatives:** Leftovers cannot be swapped.
- **Rationale:** Gives the user control while keeping the amounts correct.
- **Consequences:** When a dinner is swapped, the next day's lunch follows it only if that lunch is still leftovers.

## 106. Meal outcome in the data model (eaten / ate something else / skipped)
- **Date:** 2026-11-16
- **Decision:** Each planned meal can record what actually happened: still planned (no outcome), eaten, "ate something else" (with a link to the recipe that was eaten instead) or skipped. Only the data model is added now; the feature comes in phase 2 together with the 👍/👎 rating: a "✓ Eaten" button, "I ate something else → choose recipe", and progress showing eaten protein next to planned protein.
- **Alternatives:** Add the field when the feature is built in phase 2.
- **Rationale:** Same reasoning as #25 – avoids migrating stored plans later.
- **Consequences:** New optional `outcome` field on `PlannedMeal` (no data migration needed). Together with manual protein logging it forms a future "food diary" (backlog #7). The outcome is recorded for the whole household per meal, like the rating (#71); per person can be considered in phase 5. What was eaten can be recorded afterwards without opening the recipe.

## 107. Fixed days without dinner at home are a setting
- **Date:** 2026-11-16
- **Decision:** "Friday has no dinner" is no longer hard-coded. A new setting, "Fixed days we don't eat dinner at home", lets each household choose weekdays (default: none). It is also a step in the onboarding wizard (milestone G). The product owner's household chooses Friday. The one-off "eating out" per meal is kept for households without fixed days.
- **Alternatives:** Keep Friday hard-coded (as in the phase 1 brief).
- **Rationale:** Family-specific rules became settings so the app works for any household – the app is meant for other families too.
- **Consequences:** New household field `noDinnerAtHomeDays`; stored data upgraded to schema version 3 (existing households get no fixed days). Replaces the brief's "Friday has no dinner" rule.

## 108. Quick lunch after any dinner not cooked at home
- **Date:** 2026-11-16
- **Decision:** The day after a dinner that is not cooked at home (a fixed day out or "eating out"), lunch is a quick lunch. Saturday no longer has a special rule: it gets leftovers if Friday's dinner was cooked at home.
- **Alternatives:** Keep Saturday's own quick lunch.
- **Rationale:** Same reason as #107; it generalises #30.
- **Consequences:** The product owner's household (Friday out) still gets a quick lunch on Saturday.

## 109. Meals outside the app are not counted in the day's protein target
- **Date:** 2026-11-16
- **Decision:** Meals eaten outside the app (fixed days out and "eating out") are left out of the day's protein target. The app only counts what is planned in it; e.g. with a 120 g target and no dinner, the day's target is 84 g.
- **Alternatives:** Scale up the other meals of that day; show the gap and suggest a protein boost.
- **Rationale:** The protein in those meals is unknown; counting it as missing would show a misleading gap every week.
- **Consequences:** Manual logging of such meals is part of the future food diary (backlog #7).

## 110. Children's dislikes outweigh variety
- **Date:** 2026-11-16
- **Decision:** When there are too few recipes, the planner would rather repeat a dish (or use the same protein source) than serve something a child dislikes. Dislikes are the last rule to be relaxed.
- **Alternatives:** Serve the disliked dish with a note before repeating a dinner.
- **Rationale:** A repeated dinner is a smaller problem for a family than a dish a child won't eat.
- **Consequences:** Amends the order in #100: repeats, then protein source, then dislikes.

## 111. Protein boost amounts
- **Date:** 2026-11-16
- **Decision:** The boost items are 1 egg, 2 dl milk, 100 g cottage cheese and 170 g skyr (one small tub).
- **Alternatives:** Other amounts.
- **Rationale:** Common, realistic portions.
- **Consequences:** None.

## 112. Plan it yourself (milestone F)
- **Date:** 2026-11-16
- **Decision:** On every meal the user can pick a dish themselves from the recipe list (with search and filters) or go to "New recipe". A week can be started empty and planned by hand, filled by the app, or mixed (the app fills in, the user swaps). While planning, progress shows how close each day is to the protein target.
- **Alternatives:** Only automatic planning with swapping.
- **Rationale:** Families already have dishes in mind; the app should support that, not replace it.
- **Consequences:** The week-plan screen design (milestone F) is presented to the product owner before it is built.

## 113. Fixed shopping day (phase 3)
- **Date:** 2026-11-16
- **Decision:** A setting "Fixed shopping day" (e.g. Sunday): the shopping list covers the period until the next shopping day. The period can also be chosen manually (e.g. Mon–Fri or Mon–Sun).
- **Alternatives:** Always one calendar week.
- **Rationale:** Families shop on different days and rhythms.
- **Consequences:** Planned for phase 3 (added to `docs/PROMPT.md`).

## 114. Protein is recalculated on every pick or swap
- **Date:** 2026-11-17
- **Decision:** Picking or swapping a dish recalculates portions and protein right away, both when planning the whole week ahead (e.g. Sunday evening) and when swapping a dish the same day (e.g. lasagne → fajitas tonight).
- **Alternatives:** Recalculate only when the whole week is regenerated.
- **Rationale:** Plans change on short notice; the numbers must always match what is actually on the plan.
- **Consequences:** Uses `swapMeal`/`refreshPortions` from milestone E for every change in the week-plan screen.

## 115. Show protein impact before and after picking a dish
- **Date:** 2026-11-17
- **Decision:** In the list the user picks a dish from, each dish shows how it affects the day's target (e.g. "+5 g over target", "20 g under target"), so the consequence is visible before choosing. After a pick or swap, portions are first adjusted automatically (planner rules); if protein is still missing, a discreet, non-blocking toast suggests a boost, e.g. "Fajitas tonight: 20 g under today's target. Add skyr as evening snack? [Add]".
- **Alternatives:** Show nothing until after the pick; a blocking dialog after the swap.
- **Rationale:** The user sees the consequence before choosing and is not interrupted afterwards.
- **Consequences:** Details (whose target the list shows, what "Add" changes in the plan) are part of the milestone F design questions.

## 116. Setting "Show protein alerts"
- **Date:** 2026-11-17
- **Decision:** A setting "Show protein alerts" (on/off), default on. When off, no toasts are shown, but the numbers in the pick list and the progress are still visible.
- **Alternatives:** No setting (always on).
- **Rationale:** Some users find repeated alerts annoying; the numbers remain available.
- **Consequences:** Stored in household settings or as a device preference – decided in milestone G.

## 117. Week-plan layout: all seven days in one list
- **Date:** 2026-11-17
- **Decision:** The week-plan screen shows all seven days as cards below each other (as in the prototype). Today is highlighted and the screen scrolls to it automatically.
- **Alternatives:** Day tabs showing one day at a time; compact day cards that expand on tap.
- **Rationale:** Best overview of the week with the least tapping.
- **Consequences:** None.

## 118. Protein progress per adult on each day
- **Date:** 2026-11-17
- **Decision:** Each day card shows one progress line per adult, e.g. "Anna 118 / 120 g ✓".
- **Alternatives:** One combined line for the household.
- **Rationale:** Targets are personal (#19); matches the product owner's original request.
- **Consequences:** The day target excludes meals outside the app (#109).

## 119. Pick list shows the impact per adult
- **Date:** 2026-11-17
- **Decision:** In the "pick a dish" list, every dish shows one label per adult with the effect on the day's target ("Anna: on target · Ola: +5 g over").
- **Alternatives:** Only the adult furthest from the target; only one chosen person.
- **Rationale:** Precise, and consistent with the per-adult progress (#118).
- **Consequences:** Implements #115.

## 120. "Add" in the protein alert adds an extra item to the evening
- **Date:** 2026-11-17
- **Decision:** "Add" in the protein alert adds the boost as an extra item on that evening ("+ extra: 170 g skyr"); the planned evening snack stays. The data model gets a field for extras on a meal (schema v4).
- **Alternatives:** Replace the evening snack with the boost; only a tip with no button.
- **Rationale:** The family keeps the snack they planned, and the gap is closed with one tap.
- **Consequences:** Schema migration to v4. Extras go on the shopping list in phase 3.

## 121. "Make week plan" fills only empty meals
- **Date:** 2026-11-17
- **Decision:** In an empty week the main button is "Make week plan"; once something is planned it becomes "Fill in empty" and keeps what the user picked. "Make new week plan" (replace everything) is under "More" and asks for confirmation first. Manual planning (empty week, pick yourself) and swapping along the way work as in the draft (#112).
- **Alternatives:** One button that always regenerates the whole week (with confirmation).
- **Rationale:** The user's own picks are never lost by accident.
- **Consequences:** The planner must be able to fill only empty slots and treat the user's picks as fixed.

## 122. Undo after every swap
- **Date:** 2026-11-17
- **Decision:** After every swap (↻ or "Pick another dish") a message "Swapped to [dish] · Undo" appears. Undo restores the previous dish together with its portions and the next day's lunch. Pressing ↻ several times and then Undo steps back one swap at a time. The "Pick a dish" sheet can be closed without choosing anything.
- **Alternatives:** No undo (swap back manually).
- **Rationale:** ↻ is quick to press by mistake, and the previous dish may have been the better one.
- **Consequences:** The week screen keeps a history of plan states. How long the history lasts is a milestone F question.

## 123. Favourites week
- **Date:** 2026-11-17
- **Decision:** Under "More", "Make week plan" can be run with all dishes or with favourites only. If there are too few favourites, the rest is filled with regular dishes and a short note says so.
- **Alternatives:** Favourites only weighted higher (as today, #97).
- **Rationale:** Some weeks the family just wants dishes they know they like.
- **Consequences:** The planner gets a "favourites only" option; all other rules (exclusions, 30 min, variety) still apply.

## 124. Automatic week plan (milestone G)
- **Date:** 2026-11-17
- **Decision:** A setting "Make new week plan automatically" (on/off, chosen day, all dishes or favourites only). Default off. Until phase 5 the plan is made when the app is opened on or after the chosen day.
- **Alternatives:** Only manual planning.
- **Rationale:** Saves a step for families with a fixed weekly rhythm.
- **Consequences:** Built in milestone G. Without a server (before phase 5) nothing happens until the app is opened.

## 125. Favourites week by voice and AI (phases 4 and 6)
- **Date:** 2026-11-17
- **Decision:** Asking for a favourites week by voice (phase 4) and in freer words via AI (phase 6) is added to `docs/PROMPT.md`.
- **Alternatives:** Not planned.
- **Rationale:** Natural extension of #123.
- **Consequences:** None for phase 1.

## 126. Tapping a meal
- **Date:** 2026-11-17
- **Decision:** ↻ swaps straight away to the app's next suggestion. Tapping the dish itself opens a sheet with the recipe and the actions "Pick another dish", "Eating out" and "Guests (+/−)".
- **Alternatives:** Tapping opens a menu with all actions, the recipe being one of them.
- **Rationale:** The two most common actions (swap, see the recipe) take one tap each.
- **Consequences:** None.

## 127. Plan notes as small labels under the dish
- **Date:** 2026-11-17
- **Decision:** Notes from the planner (a child dislikes the dish, a repeated dinner, the same protein source) are shown as a small yellow label with text under the dish.
- **Alternatives:** One combined banner at the top of the week.
- **Rationale:** The note is next to the dish it is about; it has text, so colour is not the only signal (WCAG).
- **Consequences:** None.

## 128. "Show protein alerts" is a device preference
- **Date:** 2026-11-17
- **Decision:** The setting from #116 is stored per device, like the language (#74).
- **Alternatives:** One setting for the whole household.
- **Rationale:** Each adult decides for themselves how many alerts they want.
- **Consequences:** Stored via the repository as a device preference; the switch is added to Settings in milestone G.

## 129. Undo lasts while the user stays on the week plan
- **Date:** 2026-11-17
- **Decision:** The undo history lasts while the user stays on the week-plan screen. Besides "Undo" in the message, an "↶ Undo" button is shown at the top as long as there is something to undo. The history is cleared when the week is changed or the user leaves the screen.
- **Alternatives:** Undo only in the message (~8 s); history kept until the app is closed.
- **Rationale:** Messages disappear on their own; the button gives everyone time to undo (WCAG 2.2.1 Timing adjustable).
- **Consequences:** Completes #122.

## 130. One combined message for swap and protein alert
- **Date:** 2026-11-17
- **Decision:** When a swap leaves the day under target, one message shows both: "Swapped to Fajitas. 20 g under today's target … [Undo] [Add skyr]".
- **Alternatives:** Two messages after each other.
- **Rationale:** Less noise.
- **Consequences:** With protein alerts off (#116), the message only offers Undo.

## 131. The favourites week covers all four meals
- **Date:** 2026-11-17
- **Decision:** "Favourites only" applies to breakfast, lunch, dinner and evening snack. Each meal is topped up with regular dishes if there are too few favourites.
- **Alternatives:** Only dinners.
- **Rationale:** Simple to understand: "only favourites" means every meal.
- **Consequences:** Completes #123.

## 132. Note when there are too few favourites
- **Date:** 2026-11-17
- **Decision:** After a favourites week is made, one message says how many meals got other dishes, e.g. "Only 4 favourite dinners – 3 days got other dishes."
- **Alternatives:** A "Not a favourite" label on every filled-in dish.
- **Rationale:** Informs once without cluttering the week.
- **Consequences:** None.

## 133. Empty meals count in the day's protein target
- **Date:** 2026-11-17
- **Decision:** An empty meal (nothing picked yet) still counts in the day's target, so progress grows while planning by hand. Only "eating out" and dinner on a fixed day out are left out (#109).
- **Alternatives:** Count only meals that have a dish.
- **Rationale:** Otherwise a day with only breakfast planned would already look "on target".
- **Consequences:** Status `none` now means "empty meal" (or dinner on a fixed day out). Approved after milestone F.

## 134. A dinner can be picked on a fixed day out
- **Date:** 2026-11-17
- **Decision:** On a fixed "no dinner at home" day the row shows "No dinner at home (fixed day)", but tapping it still lets the user pick a dinner (e.g. a Friday at home).
- **Alternatives:** Not tappable; change the setting instead.
- **Rationale:** Exceptions happen; the setting is for the normal week.
- **Consequences:** Approved after milestone F.

## 135. "We're eating out" in the pick list for empty meals
- **Date:** 2026-11-17
- **Decision:** When a meal is empty, the "Pick a dish" sheet also offers "We're eating out".
- **Alternatives:** Only via the meal sheet (which needs a dish first).
- **Rationale:** An empty meal has no meal sheet, so this is the only way to mark it.
- **Consequences:** Approved after milestone F.

## 136. Extras can be removed
- **Date:** 2026-11-17
- **Decision:** Each extra item on the evening ("+ extra for Anna: 2 dl milk") has an ✕ to remove it.
- **Alternatives:** Only undo.
- **Rationale:** The user may change their mind later, after undo history is gone.
- **Consequences:** Approved after milestone F.

## 137. Undo covers every change to the plan
- **Date:** 2026-11-17
- **Decision:** The undo history (#122, #129) includes every change: swaps, picks, fill, start over, eating out, guests and extras.
- **Alternatives:** Only swaps.
- **Rationale:** Consistent: "Undo" always means "the last change".
- **Consequences:** Approved after milestone F.

## 138. Thresholds for "on target"
- **Date:** 2026-11-17
- **Decision:** In the pick list, "on target" means within ±2 g. The day's progress shows ✓ when less than 5 g is missing (the boost threshold, #103).
- **Alternatives:** Other thresholds.
- **Rationale:** Small differences are not meaningful; 5 g matches when a boost is suggested.
- **Consequences:** Approved after milestone F.

## 139. Past days stay as they are when planning mid-week
- **Date:** 2026-11-17
- **Decision:** Making or filling a plan mid-week leaves earlier days as they are, also when they are empty (#104).
- **Alternatives:** Fill past days too.
- **Rationale:** Past meals have already happened; planning them is pointless.
- **Consequences:** Approved after milestone F.

## 140. Colours for status labels
- **Date:** 2026-11-17
- **Decision:** New design tokens `success` (green, "on target") and `warning` (yellow, "under target" and plan notes), in light and dark theme, checked by `npm run check:contrast`.
- **Alternatives:** Only purple and grey.
- **Rationale:** As in the approved draft; text always accompanies the colour (WCAG 1.4.1).
- **Consequences:** Approved after milestone F.

## 141. Stronger text in toast descriptions
- **Date:** 2026-11-17
- **Decision:** The second line of a toast uses the same full-strength colour as the title.
- **Alternatives:** Keep the default grey.
- **Rationale:** The default grey was too faint on the dark toast (WCAG 1.4.3).
- **Consequences:** Applies to all toasts. Approved after milestone F.

## 142. "Fill in example family" in development mode only
- **Date:** 2026-11-17
- **Decision:** The week-plan screen has a "Fill in example family" button (Anna 120 g, Ola 140 g, Noah who doesn't like salmon, Ella; no dinner at home on Fridays). It is only shown with `npm run dev` and is not included in the published app.
- **Alternatives:** Wait for the onboarding wizard (milestone G) before testing.
- **Rationale:** Makes the week plan testable with protein numbers before milestone G.
- **Consequences:** Kept after milestone G (2026-11-17): the product owner finds it useful for testing, even though the wizard now exists. **Updated 2026-11-17 (#176):** the published app now has "Try with an example family" on the first screen of the wizard (same family, finished week plan in one click). The week-plan button stays development-only.

## 143. Monday's lunch always follows Sunday's dinner
- **Date:** 2026-11-17
- **Decision:** "Lunch = leftovers from the previous day's dinner" applies however the dinner was changed – also when "Fill" or "Make new week plan" changes Sunday's dinner, next week's Monday lunch is updated. If Sunday's dinner is no longer cooked at home, Monday gets a quick lunch. A Monday lunch the user picked themselves is left alone.
- **Alternatives:** Only update on swap/pick (as built first).
- **Rationale:** The rule must hold in every case.
- **Consequences:** `followSundayDinner` in `planner.ts`, with tests.

## 144. Shopping list before phase 2
- **Date:** 2026-11-17
- **Decision:** Re-prioritized: shopping list moved ahead of phase 2 after acceptance testing showed it is core value. After phase 1 comes phase 3 (Home + shopping list), then phase 2. Phase numbers are kept so existing references stay valid.
- **Alternatives:** Keep the original order (phase 2 first); renumber the phases.
- **Rationale:** The acceptance test of milestone F showed that the shopping list is core value.
- **Consequences:** `docs/PROMPT.md` and `CLAUDE.md` state the new order. Keeping the phase numbers was confirmed by the product owner.

## 145. Ask about used items when making the shopping list
- **Date:** 2026-11-17
- **Decision:** In phase 3, when the shopping list is made, the app asks about items last week's plan used: "Last week you used chicken fillet and chickpeas. Do you still have some left? [Yes] [No, add to list]". No quantity tracking.
- **Alternatives:** Track quantities in the pantry; don't ask.
- **Rationale:** Keeps the pantry roughly correct without the effort of entering amounts.
- **Consequences:** Added to phase 3 in `docs/PROMPT.md`.

## 146. Undo per meal instead of undo messages
- **Date:** 2026-11-17
- **Decision:** No more undo toasts. A meal that was changed gets an ↶ undo button next to ↻ (new suggestion). It stays (does not disappear by itself) and goes back one step per tap. Every change to a meal counts: new suggestion, "Pick another dish", "Eating out", guests, and an added or removed protein boost. The ↶ button at the top is only for whole-week actions ("Make week plan", "Fill empty", favourites week, "New week plan") and names the action, e.g. "Undo «Fill»". Screen readers hear each change through a hidden live region.
- **Alternatives:** Only dish swaps get ↶ (guests and "eating out" are undone in the sheet); keep the undo toasts (#122, #130).
- **Rationale:** Acceptance test of milestone F: toasts disappear and pile up; undo belongs where the change is.
- **Consequences:** Replaces #122, #129 and the undo part of #130. Redo (↷) is in the backlog (#8).

## 147. Names of the meal buttons for screen readers
- **Date:** 2026-11-17
- **Decision:** ↻ is called "New suggestion: Dinner, Tuesday 17 Nov". ↶ after a swap is "Undo swap: Dinner, Tuesday 17 Nov – back to Fajitas"; after other changes "Undo change: Dinner, Tuesday 17 Nov". The two buttons have different icons.
- **Alternatives:** Always just "Undo swap".
- **Rationale:** Says exactly what will happen (WCAG 2.4.6).
- **Consequences:** Also shown as a tooltip on PC.

## 148. Never more than one message at a time
- **Date:** 2026-11-17
- **Decision:** A new toast replaces the old one, everywhere in the app. Outdated messages are removed: any change to the plan, and switching weeks, removes the current message.
- **Alternatives:** Stack messages (sonner's default).
- **Rationale:** Acceptance test: several messages at once were confusing.
- **Consequences:** All toasts go through `src/lib/toast.ts`.

## 149. Undo history lasts while the app is open
- **Date:** 2026-11-17
- **Decision:** The ↶ buttons survive switching tabs or weeks. Closing or reloading the app clears them.
- **Alternatives:** Save the history with the week plan; only while on the week-plan screen.
- **Rationale:** Simple, and no old undo buttons pile up over days.
- **Consequences:** History is kept in memory (`undo-store.ts`), not in storage.

## 150. Undoing a dinner also undoes the leftovers lunch
- **Date:** 2026-11-17
- **Decision:** When a dinner changes, the next day's leftovers lunch follows (#143). ↶ on the dinner also restores that lunch. The lunch shows "Follows the dinner on Tuesday" while the dinner can be undone, but has no ↶ of its own for that change.
- **Alternatives:** The lunch gets its own ↶ as well.
- **Rationale:** Lunch = leftovers is one rule; one button keeps it consistent.
- **Consequences:** If the lunch was changed by hand afterwards, undoing the dinner leaves the lunch alone.

## 151. Whole-week actions remove a meal's undo
- **Date:** 2026-11-17
- **Decision:** If a whole-week action changes a meal that has ↶, that ↶ disappears; the whole action is undone with the top button. The other way round, the top ↶ never undoes meals changed by hand after the week action.
- **Alternatives:** The meal's ↶ stays and goes back to before the week action.
- **Rationale:** Each button only undoes its own change, so nothing is lost by surprise.
- **Consequences:** Undo restores a meal only if it still looks as it did right after the change (`src/data/undo.ts`, with tests).

## 152. Summary when a day is fully planned
- **Date:** 2026-11-17
- **Decision:** No protein message while a day has empty meals. When the last empty meal of a day is chosen, and again after every later change to a meal on that day, one message sums up the day: "Tuesday 17 Nov is planned. Anna: 112 / 120 g (8 g missing) · Ola: 140 / 140 g ✓ [Add …]". After a whole-week action, one short week summary without a button: "Week 47 is planned. Everyone reaches their target on 5 of 7 days." Hidden when "Show protein alerts" is off.
- **Alternatives:** Only when the day becomes complete; no week summary.
- **Rationale:** Acceptance test: alerts about half-planned days were misleading.
- **Consequences:** Replaces the protein part of #115 and #130.

## 153. Honest protein boost with up to two items
- **Date:** 2026-11-17
- **Decision:** The boost combines up to two different items (egg, milk, cottage cheese, skyr) and picks the combination that covers the gap with the least extra. If even the largest combination is not enough, the message says how much it covers ("Anna: skyr + cottage cheese cover 31 of 48 g").
- **Alternatives:** One item with an honest text ("Skyr covers 18 of 48 g").
- **Rationale:** Acceptance test: "Add skyr" for a 48 g gap was misleading.
- **Consequences:** Replaces the single-item rule in #103. `proteinBoost` returns a list of items.

## 154. One boost button for everyone who is short
- **Date:** 2026-11-17
- **Decision:** If several adults are below target, the message has one button, "Add protein boost (Anna + Ola)", and the text above says what each gets.
- **Alternatives:** One button per person.
- **Rationale:** Keeps the message small; the boost can be removed per person with ✕.
- **Consequences:** With only one person short, the button names the items: "Add milk for Anna (+7 g)".

## 155. Day status on the day card
- **Date:** 2026-11-17
- **Decision:** The day card always shows each adult's status as a label: green "Anna 121 / 120 g ✓" when the target is reached (less than 5 g missing, also when over), yellow "Anna 112 / 120 g · 8 g under" when not. While the day has empty meals, the numbers are grey and "The day has empty meals" is shown below. Days with nothing planned show no status.
- **Alternatives:** Only the grey text without numbers; keep the progress bars (#118).
- **Rationale:** The status is always visible, so the message is not needed to see it. Text + colour (WCAG 1.4.1).
- **Consequences:** Replaces the progress bars of #118.

## 156. The button in a message sits below the text
- **Date:** 2026-11-17
- **Decision:** In toasts with a button (e.g. "Add milk for Anna"), the button is placed below the text, not next to it.
- **Alternatives:** Next to the text (sonner's default).
- **Rationale:** On phones the text became very narrow and hard to read.
- **Consequences:** Messages with a button are slightly taller.

## 157. Language on the welcome step, phone language first
- **Date:** 2026-11-17
- **Decision:** The welcome step of the wizard has small buttons Norsk / Deutsch / English. Until a language is chosen, the app uses the phone's language if it is one of the three, otherwise Norwegian.
- **Alternatives:** Language only under Settings.
- **Rationale:** German-speaking families should not have to start in Norwegian.
- **Consequences:** Replaces "Norwegian until changed" (#74 still applies: the language is stored per device).

## 158. Onboarding wizard with six steps
- **Date:** 2026-11-17
- **Decision:** The wizard (#24) is full-screen without the navigation bar and has six steps: 1) welcome + name, 2) daily protein target, 3) household, 4) food we don't want, 5) "your week" (fixed days without dinner at home + cheat days), 6) done. It shows "Step X of 6", with Back, Skip and Next; the welcome step has "Skip all". "Make my first week plan" on the last step makes the plan from today and opens the week plan.
- **Alternatives:** Seven steps (fixed days out and cheat days separately).
- **Rationale:** Short, and the two weekday questions belong together.
- **Consequences:** Shown when `onboardingDone` is false. Fixed days out are part of the wizard as decided in #107.

## 159. Guideline calculator for the protein target
- **Date:** 2026-11-17
- **Decision:** "Don't know? Work it out": body weight × 1.2 (not very active), 1.6 (moderately active) or 2.0 g (very active) per kg. "Use this" puts the result into the field. Labelled as a guideline, not medical advice.
- **Alternatives:** Five activity levels.
- **Rationale:** Three levels are easy to choose between and cover the range from #24.
- **Consequences:** The same calculator is used under "My profile".

## 160. Protein targets are optional
- **Date:** 2026-11-17
- **Decision:** Every adult has an optional protein target field (the user's own on step 2, other adults on the household step). An adult without a target gets standard portions and no progress; the week plan shows a short reminder ("Add a protein target for Ola under Settings").
- **Alternatives:** A default target of 100 g.
- **Rationale:** A made-up target would give misleading portions and alerts.
- **Consequences:** If the name is skipped but a target is entered, the first adult is called "Me".

## 161. Children in the wizard
- **Date:** 2026-11-17
- **Decision:** For each child: name, "Eats lunch at home on weekdays" (off by default, #102) and "Doesn't like" (chosen from the ingredient catalogue, #70). Everything is optional.
- **Alternatives:** Only the name in the wizard; the rest under Settings.
- **Rationale:** Children's preferences are part of phase 1 and affect the first plan.
- **Consequences:** The same person cards are used under Settings → Household.

## 162. Settings changes update planned weeks from today
- **Date:** 2026-11-17
- **Decision:** When settings that affect the plan are saved (people and targets, excluded food, fixed days out, cheat days, protein split), planned weeks are updated from today: portions are always recalculated, and only dishes that no longer fit are replaced – dishes containing food that is now excluded, cheat snacks on a day that is no longer a cheat day, and dinner on a day that became a fixed day without dinner at home. Everything else stays, including dishes the user picked. One message says what changed, and the top "Undo" on the week plan undoes it.
- **Alternatives:** Only recalculate portions and mark dishes that no longer fit with a yellow label.
- **Rationale:** Excluded food must never be suggested (#18), but the user's own choices are respected.
- **Consequences:** `adaptToSettings` in `planner.ts`, with tests. Past days never change (#33).

## 163. Settings as a list with sub-pages
- **Date:** 2026-11-17
- **Decision:** Settings is a list grouped as Family (My profile, Household, Food and week), Week plan (Show protein alerts, Make new week plan automatically, Protein split) and App (Language, Appearance, Add to home screen, Run the wizard again). Each row opens its own page; pages with several fields have a Save button and warn before leaving with unsaved changes (#93).
- **Alternatives:** One long page with sections.
- **Rationale:** Many settings; a list is easier on a phone.
- **Consequences:** New routes under `/settings/…`.

## 164. Automatic week plan: next week, on Sunday by default
- **Date:** 2026-11-17
- **Decision:** When "Make new week plan automatically" (#124) is turned on, the default day is Sunday. The first time the app is opened on or after the chosen weekday, it fills the empty meals of next week's plan (all dishes or favourites only) and shows "Week 48 was made automatically". It can be undone with the top "Undo" on the week plan.
- **Alternatives:** Saturday as default day.
- **Rationale:** Sunday is a natural planning day, and Monday's lunch can follow Sunday's dinner.
- **Consequences:** New optional household field `autoWeekPlan` (schema version 5). Without a server (before phase 5) nothing happens until the app is opened.

## 165. Editing the protein split
- **Date:** 2026-11-17
- **Decision:** Four +/− buttons in steps of 5 % (breakfast, lunch, dinner, evening). Save only works when the sum is 100 %; "Reset to 25/30/30/15" restores the default.
- **Alternatives:** A few presets.
- **Rationale:** Flexible and simple; the sum is always visible.
- **Consequences:** Implements "adjustable in Settings" from #20.

## 166. "Run the wizard again" in Settings
- **Date:** 2026-11-17
- **Decision:** A button at the bottom of Settings opens the wizard again, filled in with the current settings. Finishing it saves the settings like any other settings change (#162); it does not make a new week plan.
- **Alternatives:** No button – everything can be changed in Settings.
- **Rationale:** Product owner's choice: an easy way to go through everything again.
- **Consequences:** The last step's button says "Save" instead of "Make my first week plan".

## 167. Details of the wizard and settings, approved after milestone G
- **Date:** 2026-11-17
- **Decision:**
  1. When a weekday becomes a fixed day without dinner at home, a dinner already planned on that day is removed – also one the user picked – and the next day's leftovers become a quick lunch. The top "Undo «Settings»" on the week plan brings the dinner and the lunch back (tested); the setting itself stays changed.
  2. "Run the wizard again" only saves the settings and has ✕ to cancel (#166).
  3. "Skip all" on the welcome step jumps to the last step, so the first week plan is still made.
  4. A skipped name becomes "Me"; other people without a name become "Adult 2", "Child 1" and so on.
  5. The automatic week plan settings are saved immediately (no Save button); the plan is made the next time the app is opened.
  6. Removing an excluded food replaces nothing; only portions are recalculated.
- **Alternatives:** (1) Keep a planned dinner on a new fixed day out.
- **Rationale:** Made during the build and approved by the product owner afterwards.
- **Consequences:** None beyond the above.

## 168. "Remove meal" (skip a meal on purpose)
- **Date:** 2026-11-17
- **Decision:** Tapping a meal offers "Remove meal" (e.g. lunch on a day with low appetite). Found in the milestone G acceptance test. Rules:
  - The meal gets its own plan status `skipped` and is shown as "[Meal] – skipped" in grey text on the day card.
  - All four meals can be removed (breakfast, lunch, dinner, evening snack), for the whole household.
  - A removed meal is not counted in the day's protein target (like "eating out", #109) and never leads to a protein boost message. It does not make the day "grey" (only empty meals do).
  - Removing a leftovers lunch means fewer dinner portions the day before. Removing a dinner gives the next day a quick lunch (#108), also from Sunday to next Monday.
  - Extras on the meal (e.g. a protein boost) are removed with it.
  - A short message "Lunch removed" is shown; no day summary. ↶ undo brings back the meal, its extras and the lunch after a dinner.
  - Tapping a removed meal offers "Fill in again" (the app picks; lunch gets leftovers back if the previous dinner is cooked at home) and "Pick a dish".
  - "Fill the week" and settings changes leave removed meals alone; "Start the week over" clears them.
- **Alternatives:** (1) Use the phase-2 outcome "skipped" (#106) instead of a plan status – mixes "planned to skip" with "skipped after all". (2) A switch like "Eating out" instead of a button. (3) Not for the evening snack. (4) Per person now (see backlog #9). (6) Only "Pick a dish". (7) "Fill the week" also fills removed meals. (8) "Start over" keeps them. (9) Keep the extras.
- **Rationale:** Product owner's choice ("a" on all points). A plan status keeps phase-2 statistics clean; acting for the whole household matches the data model.
- **Consequences:** New `MealStatus` value `skipped` (no migration needed; schema version unchanged). Planner functions `skipMeal` and `refillMeal`. Removing for one person only is in the backlog (#9, high priority for phase 5).

## 169. Phase 2: daily or weekly check-in and summary
- **Date:** 2026-11-17
- **Decision:** Planned for phase 2 (not built now):
  - A setting for check-in and summary: daily, weekly or off, with an optional time (e.g. 20:00, or Sunday evening).
  - Check-in: "Did you eat what was planned today?" – tick everything with one tap, or change single meals (ate something else / skipped). Uses the meal outcome (#106).
  - Summary with a positive tone, e.g. "Average 116 / 120 g protein per day. You reached your target on 5 of 7 days – well done!"
  - When short: a constructive tip, e.g. "Wednesday and Thursday were 15–20 g short. Should the next week plan add a little extra? [Yes, adjust next week]".
  - The tone is always encouraging, never shaming, and gives no medical advice.
- **Alternatives:** Only the "✓ Eaten" buttons on each meal from the original phase-2 plan.
- **Rationale:** Product owner's idea: recording what was eaten should be quick, and feedback should motivate.
- **Consequences:** Added to phase 2 in `docs/PROMPT.md`. Without push notifications (phase 7) the check-in is shown the next time the app is opened after the chosen time. "Adjust next week" needs a planner option for slightly larger portions or boosts; to be designed in phase 2.

## 170. "Lunch = leftovers from the previous dinner" works both ways
- **Date:** 2026-11-17
- **Decision:** When a dinner is removed (skipped, eating out, or a new fixed day out), the app puts a quick lunch on the next day and remembers that it replaced the leftovers. When that dinner is cooked at home again – "Fill in again", "Pick a dish", or eating out turned off and a dish picked – the lunch becomes leftovers from the new dinner again. A lunch the user changed in the meantime stays: a picked dish, and also ↻ on the lunch (a deliberate change). Works from Sunday to next Monday too.
- **Alternatives:** The quick lunch stays until ↶ undo (the first build of #168).
- **Rationale:** Product owner's choice: the leftovers rule should apply in both directions.
- **Consequences:** New optional field `PlannedMeal.replacedLeftoversFrom` (no migration needed). Tested in `planner.test.ts`.

## 171. Details of "Remove meal", approved after the build
- **Date:** 2026-11-17
- **Decision:**
  1. "Remove meal" is in the menu of a meal that has a dish (or is "eating out"); it is not in the pick list of an empty meal.
  2. Guests on a removed meal are remembered and come back when it is filled in again.
- **Alternatives:** (1) Also offer "Remove meal" in the pick list of an empty meal. (2) Reset guests to 0.
- **Rationale:** Made during the build of #168 and approved by the product owner afterwards.
- **Consequences:** None beyond the above.

## 172. Phase 3 core: approve the week plan, then "What do you have at home?"
> **Superseded by #173** (nothing is added to the shopping list without confirmation).

- **Date:** 2026-11-17
- **Decision:** The core flow of phase 3 (not built now):
  1. A button "Approve week plan" with a clear confirmation ("Week 47 is ready ✓").
  2. Then "What do you have at home?": every item the week needs, grouped by store section. Items the app knows are at home (from Home) are ticked in advance. Items used last week get the question "Do you still have …?" (#145).
  3. Everything not at home goes to the shopping list automatically, where the user can add their own items.
  4. If the plan changes after approval, the app only asks about the new items.
- **Alternatives:** A shopping list made directly from the plan without the "at home" step; asking about every item every time.
- **Rationale:** Product owner's choice after the milestone G acceptance test: one clear moment where the plan becomes a shopping list, with as few questions as possible.
- **Consequences:** Added as the core of phase 3 in `docs/PROMPT.md`. Needs a store section per ingredient and an "approved" state on the week plan (phase 3 data model work). Builds on #113 (fixed shopping day) and #145.

## 173. Phase 3 core flow, refined: approve → check → confirm
- **Date:** 2026-11-17
- **Decision:** Replaces #172. The core of phase 3 (not built now):
  1. A button "Approve week plan".
  2. Approving opens a sheet with every item the week needs, grouped by store section. Items at home are ticked in advance. Items used last week get "Do you still have …?" (#145).
  3. The user adjusts and taps "Add 12 items to the shopping list" (or "Skip"). Nothing is added without confirmation.
  4. Confirmation: "Week 47 is ready ✓ · 12 items added" with [See shopping list]. The user stays on the week plan.
  5. The user can add their own items to the shopping list.
  6. Swapping a dish after approval (e.g. salmon → chicken) opens a dialog:
     - salmon not bought yet: [Swap] / [Keep salmon, add chicken];
     - salmon already bought: "Add chicken?" [Yes] / [No], plus the tip "Use the salmon another day?";
     - chicken already at home: only "You have chicken at home ✓";
     - if the salmon is also used in another dish that week, only the extra amount is removed.
- **Alternatives:** #172 (items not at home go to the list automatically).
- **Rationale:** Product owner's choice: the user stays in control, and the plan and the shopping list never silently drift apart.
- **Consequences:** Phase 3 needs a store section per ingredient, an "approved" state on the week plan, a record of which items were bought, and amounts per ingredient across the week. Added to `docs/PROMPT.md`.

## 174. Publish right after phase 1
- **Date:** 2026-11-17
- **Decision:** The app is published (GitHub + Vercel, a live link) right after phase 1 instead of in phase 7. The rest of phase 7 (view-only link, calendar sync, push reminders, feedback button, PostHog) stays in phase 7. Order now: 1 → publishing → 3 → 2 → 4 → 5 → 6 → 7.
- **Alternatives:** Publish in phase 7 as planned.
- **Rationale:** Product owner's choice: testers and employers can try the app early.
- **Consequences:** The README says "Live demo: coming soon". Vercel must use the product owner's private account. Data stays in each browser (localStorage) until phase 5, so every tester has their own data.

## 175. Milestone H: documentation and bundle size
- **Date:** 2026-11-17
- **Decision:**
  1. Real screenshots in the README (week plan, meal menu, wizard, settings), phone size, with the example family.
  2. Screenshots in English; the README says the app is Norwegian by default.
  3. "Live demo: coming soon" (#174).
  4. `docs/FEEDBACK_LOG.md`: the template plus the findings from the acceptance tests of milestones F and G.
  5. `docs/PRD.md`: a draft with proposed success metrics; the product owner corrects the metrics afterwards.
  6. The Norwegian planning files stay in Norwegian as the original brief, with a short English note; the PRD is the English version of the requirements.
  7. Bundle size (#94): every screen is loaded when it is first opened (route-level code splitting).
  8. No licence: all rights reserved.
  9. A short README section on the product owner's role and how the app was built with Claude Code, linking to the decision log, feedback log and backlog.
  10. A script `npm run dev:phone` to open the app on a phone on the same network.
- **Alternatives:** (1) Placeholders only. (2) Norwegian screenshots. (4) An empty template. (6) Translate the planning files. (7) Fixed vendor chunks, or hiding the warning. (8) MIT licence. (10) Only explain `npm run dev -- --host`.
- **Rationale:** Product owner's choice ("a" on all, live demo wording changed).
- **Consequences:** See the README and the new docs.

## 176. How the app is published
- **Date:** 2026-11-17
- **Decision:**
  1. Vercel is connected to the GitHub repository: every push to `main` publishes the app automatically.
  2. Address `maltidsplanlegger.vercel.app` (free), if the name is available.
  3. Search engines stay blocked (#55) until the brand name is decided (backlog #3).
  4. "Try with an example family" on the first screen of the wizard, also in the published app: the example family from #142 gets a finished week plan in one click.
  5. No Vercel analytics; analytics with a privacy notice come in phase 7.
  6. Units have plural forms (e.g. "1 can", "1½ cans"; "1 boks", "1½ bokser"; "1 Dose", "2 Dosen").
- **Alternatives:** (1) Deploying by hand. (2) An own domain. (3) Allowing search engines. (4) Visitors start with an empty app. (5) Vercel analytics on. (6) Fix plurals later.
- **Rationale:** Product owner's choice ("a" on all except 4, which is "b"): employers and testers should see a finished week plan in one click.
- **Consequences:** `vercel.json` sends every path to the app, so links like `/week` work on reload. The example family is moved to `src/features/household/example-family.ts`. Everything visitors enter stays in their own browser.

## 177. Phase 3: "Use what we have at home first" as a small opt-in
- **Date:** 2026-11-17
- **Decision:** An optional switch in "Make week plan", **off by default**, with the explanation "Add your items under Home, and I'll use them in the plan". No pop-up, no extra wizard step, no weekly reminders.
- **Alternatives:** A pantry step in onboarding; weekly reminders to update Home.
- **Rationale:** Unvalidated idea – shipped as a small opt-in toggle to learn whether users want it.
- **Consequences:** Added to phase 3 in `docs/PROMPT.md`. Backlog #10: if testers use the toggle a lot, consider a pantry step in onboarding and a weekly reminder.

## 178. Phase 3: Home without effort
- **Date:** 2026-11-17
- **Decision:** Home is filled automatically by items ticked off as bought on the shopping list. Manual entry is one tap from a list grouped by category (protein, staples, vegetables and fruit, dairy), plus a text field. The focus is on main ingredients. The app works well with an empty Home list.
- **Alternatives:** Manual entry of every item with amounts.
- **Rationale:** Reduce onboarding friction.
- **Consequences:** Added to phase 3 in `docs/PROMPT.md`. Ingredients need a Home category (can share data with the store section from #173).

## 179. Phase 5: login is optional
- **Date:** 2026-11-17
- **Decision:** The app can be used fully without an account. An account is offered only when it adds something: "Share with the family", using several devices, or a backup. Local data is moved into the account.
- **Alternatives:** Login required from the start of phase 5.
- **Rationale:** Lazy registration – value first, account only when it adds value; less personal data stored (GDPR).
- **Consequences:** Added to phase 5 in `docs/PROMPT.md`. The repository must keep working without a server after phase 5, and needs a one-time move of local data to the account.

## 180. Safety before features: allergies per person, EU-14 list, never suggested
- **Date:** 2026-11-19
- **Decision:** Allergies and intolerances are set **per person** (adults and children) in the wizard, under "Household" and under "My profile", from a fixed list – not free text. A dish containing an allergen for anyone eating the meal is **never suggested**. Built before phase 3. Details:
  1. Ingredients get their own `allergens` field. On the user's own ingredients a missing field means "allergens not stated".
  2. The list is the EU's 14 allergens plus lactose: "Milk (allergy)" and "Lactose (intolerance)" are separate, because lactose-free food still contains milk protein. Lactose-free alternatives are only offered for lactose intolerance.
  3. Allergies and intolerances follow the same strict rule: never suggested.
  4. Where brands vary (stock cubes, curry powder, taco seasoning), the strictest labelling is used.
  5. Alternatives (e.g. gluten-free pasta) are used for **everyone** at the meal – one pot, no mix-ups, one shopping list. The dish keeps its name and gets a label like "With gluten-free pasta"; protein and amounts use the alternative.
  6. Alternatives added now: gluten-free pasta, tortilla, burger buns and oats; rice noodles (no gluten, no egg); gluten-free soy sauce; lactose-free semi-skimmed milk, Greek yoghurt, skyr, cottage cheese and quark; oat drink (for milk allergy).
  7. If no dish fits everyone's allergies, the meal stays empty with the note "No dish fits all the allergies". The rule is never relaxed.
  8. A dish with an ingredient whose allergens are not stated is not suggested automatically while anyone in the household has an allergy; it can still be picked by hand with a yellow warning. The new-ingredient form gets an allergen choice, including "No allergens".
  9. Picking a dish with an allergen by hand: it is listed last with a red warning ("Contains gluten – Noah has an allergy"), needs a confirmation ("Pick anyway"), and keeps a red label on the week plan.
  10. Disclaimer – "The app is an aid. Always check the label – contents can vary between brands." – in the allergy choice, at the bottom of every recipe and once in the wizard.
  11. Every recipe shows "Contains: gluten, milk" for everyone, also without allergies in the household.
  12. Guests have no allergies in the app for now (backlog #11, high priority).
- **Alternatives:** (1) Reusing exclusion tags. (2) One "milk/lactose" item. (3) Intolerances as a soft rule. (4) Typical rather than strictest labelling. (5) Alternatives only for the person with the allergy. (6) Only gluten and lactose alternatives. (7) Suggesting the "least bad" dish. (8) Suggesting such dishes with a warning. (9) Warning without confirmation, or hiding the dish. (10) Disclaimer only in the allergy choice. (11) Only when someone has an allergy. (12) Allergies per meal with guests.
- **Rationale:** Product owner's choice ("a" on all 12). Safety before features: an allergy can be dangerous, a dislike is not.
- **Consequences:** `Person.allergies`, `Ingredient.allergens`, `Ingredient.alternativeFor` and `PlannedMeal.substitutions` (optional fields, no schema migration). Seed version 2 adds the allergen labels to existing seed ingredients and adds the alternatives. Settings changes replace dishes that are no longer safe (#162). Tests check that no dish with an allergen ends up in the plan for anyone eating it.

## 181. Three food levels per person: allergies, "Doesn't tolerate", dislikes
- **Date:** 2026-11-19
- **Decision:** Every person (adults and children) has three levels, shown as three rows on the person card in this order, each with "Change": **Allergies and intolerances** (strict, fixed EU-14 + lactose list, #180) → **Doesn't tolerate** (strict, any ingredient from the catalogue, with search) → **Doesn't like** (soft). Details:
  1. "Can be left out" is set **per recipe line**, not per ingredient: pepper on an omelette can be left out, chili in a chili stew cannot.
  2. A line that can be left out is left out **only for that person's portion**: the dish is kept with the label "Without black pepper for Yalda" and the hint "Take out their portion before adding it, or serve it on the side". Amounts and shopping list are unchanged.
  3. Spice blends and sauces get a **"contains"** field (strictest reading). Four single spices are added so people can choose them: chili, cumin, paprika powder, ginger. Taco seasoning = chili, cumin, paprika powder, garlic, onion, black pepper · tikka masala paste = chili, ginger, garlic, cumin, paprika powder · curry powder = chili, cumin, ginger, black pepper · salsa = chili, onion, garlic · vegetable stock = onion.
  4. Milder alternatives now: **mild taco seasoning** (no chili or pepper) and **mild salsa** (no chili). They work like the allergy alternatives (#180): used for everyone at the meal (one pot), label "With mild taco seasoning".
  5. "Doesn't like" now applies to **adults too** – a soft rule for everyone (previously children only, #28).
  6. Picking a dish with something a person doesn't tolerate by hand works like allergies: red warning ("Contains chili – not for Yalda") and "Pick anyway".
  7. Person card layout: three rows (allergies → doesn't tolerate → doesn't like), each with "Change". Also in the wizard ("you" card) and under "My profile".
  8. The recipe form gets a **"Can be left out"** switch on every ingredient line.
  9. More allergy alternatives (the open question from #180): **gluten-free vegetable stock, gluten-free taco seasoning and lactose-free grated cheese**.
  - "Can be left out" defaults on the seed recipes: black pepper (omelette, scrambled eggs, turkey burger, salmon), cinnamon (pancakes, quark with apple), honey (both yoghurt dishes), lemon (salmon), garlic (tuna pasta, chicken stir-fry). Onion and spice blends cannot be left out.
- **Alternatives:** (1) "Can be left out" on the ingredient everywhere. (2) Leaving it out for everyone. (3) Only naming blends, so "doesn't tolerate chili" would not catch taco seasoning. (4) No milder alternatives yet. (5) Dislikes for children only. (6) Yellow warning without confirmation. (7) One "Food" button with three tabs. (8) Recipe form switch later. (9) Alternatives to the backlog.
- **Rationale:** Product owner's choice ("a" on all 9). "Doesn't tolerate" causes real discomfort, so it is as strict as an allergy; leaving out a spice for one portion keeps the plan varied.
- **Consequences:** `Person.notToleratedIngredientIds`, `Ingredient.contains` and `RecipeIngredient.omittable` (optional fields, no schema migration). `recipeSafety` also returns `intolerances` (strict conflicts, named by the chosen ingredient, e.g. chili) and `omissions`; `blockedAllergens` became `blockedAt` with allergens and ingredients. An alternative must fit both allergies and intolerances (e.g. gluten allergy + no chili leaves tacos out). Seed version 3 adds the new ingredients, the "contains" lists and the "can be left out" lines to stored seed data. Dislikes also match what blends contain. Tests check over 200 weeks that nobody gets food they don't tolerate, except lines left out of their portion.
- **Interpretations made while building (for review):** (a) "Can be left out" never applies to allergens – an allergen is only handled by an alternative. (b) If a line can be left out *and* has a milder alternative, leaving it out is preferred. (c) Black pepper on the salmon was also marked "can be left out" (it was missing from the draft list, same as the other pepper lines). (d) Leaving out a spice doesn't change protein or amounts. (e) Ingredients without a "contains" list (the user's own) are matched by the ingredient only – no "not stated" warning as for allergens. **(a–d approved; e replaced by #182, 2026-11-20.)**

## 182. Own ingredients must say whether they contain what someone doesn't tolerate
- **Date:** 2026-11-20
- **Decision:** Replaces interpretation (e) of #181 (a, b, c, d of #181 approved). The new-ingredient form asks "Does it contain anything the household doesn't tolerate?" with a chip for each ingredient someone in the household doesn't tolerate (e.g. chili, pepper) plus "None of these". Nothing chosen = **not stated**. When someone at a meal doesn't tolerate something an own ingredient doesn't state, the dish gets the same yellow "not stated" note as unlabelled allergens. Details:
  1. Stated **per item asked**: if someone later stops tolerating something new (e.g. ginger), older own ingredients are "not stated" for ginger.
  2. A dish with "not stated" works like unlabelled allergens: **never suggested automatically**; it can be picked by hand and shows the yellow note.
  3. The note says what is missing: "Not stated whether chili oil contains chili or pepper" (allergens keep "Allergens not stated").
  4. In the recipe view, the yellow note has a **"Fill in: <ingredient>"** button that opens a small sheet with allergens and "doesn't tolerate" for that ingredient.
  5. A ticked item works like a spice blend (#181): strict, unless the recipe line is marked "can be left out".
- **Alternatives:** (1) Stated once = stated forever (simpler, but gaps). (2) Suggested with the yellow note. (3) One shared text "Contents not stated". (4) A "My ingredients" page under Settings, or backlog. (5) Only a warning.
- **Rationale:** Product owner's choice ("a" on all 5). "Doesn't tolerate" is a strict rule – a gap here means someone may get ill.
- **Consequences:** `Ingredient.containsCheckedFor` (optional, no schema migration) lists what the user was asked about; `statesContent`, `unstatedContentsOf`, `householdNotTolerated`, `unstatedInRecipe` in `allergens.ts`; `RecipeSafety.unstatedContents` makes the status "unknown". Shared `IngredientFactsFields` / `IngredientFactsSheet` (`src/features/recipes/IngredientFacts.tsx`, helpers in `ingredient-facts.ts`) used by the new-ingredient form and "Fill in". Allergy labels can now show several yellow notes. Tests: 135.
- **Interpretations made while building (approved 2026-11-20):** (a) Seed ingredients always count as fully stated; only the user's own ingredients are checked. (b) Answering (ticking something or "None of these") counts for every item shown, also the ones not ticked. (c) The question only appears when someone in the household doesn't tolerate something, and never lists the ingredient itself. (d) A "not stated" line that is marked "can be left out" is still "not stated" (not simply left out) – the strictest reading. (e) "Fill in" also appears for own ingredients with only unlabelled allergens, in the Recipes screen and in the week plan's meal sheet. Technical: new UI keys `common.save` and `allergens.or` ("chili or pepper").

## 183. Not everyone eats four meals – first external tester feedback
- **Date:** 2026-11-20
- **Decision:** The household chooses which meals it eats: breakfast, lunch, dinner, evening snack (all on by default). A meal that is off is not planned, not on the shopping list (phase 3) and not counted in the protein split. **0 % on a meal = off.** Per household now; per person in phase 5 (BACKLOG #9). Built before phase 3. Details:
  1. In the wizard, "Which meals do you eat?" sits **at the top of the "Your week" step** – still 6 steps (shorter start; it belongs with the fixed days out).
  2. In Settings, "Protein split" becomes **"Meals and protein"**: a switch and a percentage per meal.
  3. Turning a meal off spreads its share over the other meals **in proportion** (25/30/30/15 without lunch → 36/0/43/21).
  4. Existing week plans change **from today**, like other settings: meals that are off are emptied, portions are recalculated.
  5. Meals that are off are **not shown** in the week plan.
  6. With dinner off, lunch gets **ordinary lunch dishes** (as after a dinner out).
  7. At least **one of breakfast, lunch and dinner** must stay on.
  - With lunch off, dinner is cooked without extra portions for leftovers.
- **Alternatives:** (1) A new seventh wizard step. (2) A separate "Meals" page. (3) The whole share to dinner, or spread evenly over the main meals. (4) Only new weeks. (5) Shown greyed out with a link to Settings. (6) Dinner can't be turned off. (7) Any one meal is enough.
- **Rationale:** First external tester (FEEDBACK_LOG, 2026-11-20): eats two meals plus a snack, but lunch was planned anyway, even at 0 % protein. Product owner's choice ("a" on all, except 1: b).
- **Consequences:** No new stored field: a meal is on when its share in `proteinSplit` is above 0 (no schema migration). `src/data/meals.ts`: `mealOn`, `mealsOn`, `canTurnOff`, `turnMealOff`, `turnMealOn`, `onlyMealsOn` (older plans may still hold meals that are now off – they are ignored in the day's protein). Planner: `generateWeekPlan` leaves off meals empty; `swapMeal` does nothing for them; a dinner no longer turns the next day's lunch into leftovers when lunch is off (`applyMeal`, `followSundayDinner`); `dinnerPortionsToCook` adds no leftovers; `emptyMeals` and `planNotes` skip off meals; `adaptToSettings` empties meals turned off and fills meals turned back on (lunch with leftovers where possible). UI: `MealsOnFields` (wizard), switches on the "Meals and protein" page, `DayCard` shows only meals that are on. Tests: `src/data/meals.test.ts` (143 in total).
- **Interpretations (approved with the draft):** a meal turned back on gets its default share (lunch 30 %) and the others shrink in proportion; cheat days are hidden while the evening snack is off; children's "eats lunch at home" is hidden while lunch is off; with fewer meals the day target can be harder to reach (portions are still at most 2×) – the app shows "X g under" as today.
- **Made while building (approved 2026-11-20):** (a) Lowering a meal to 0 % with − also turns it off, but the last main meal stops at 5 %. (b) The Settings row shows the meals that are on: "Breakfast 36 % · Dinner 43 % · Evening 21 %". (c) A meal that is off shows "Don't eat" instead of the percentage. (d) The wizard summary gets a "Meals" row. (e) "Reset to 25 / 30 / 30 / 15" turns all four meals back on. Follow-up (product owner, 2026-11-20): the hint "The next day gets a quick lunch" under fixed days out is hidden while lunch is off.

## 184. Phase 3 plan and the first choices
- **Date:** 2026-11-20
- **Decision:** Phase 3 is built in five milestones, with a stop after each: **3A** the calculation of what the week needs (tests, no screen), **3B** "Approve week plan" (the sheet, "Do you still have …?", confirmation), **3C** the shopping list screen, **3D** the Home screen and "Use what we have at home first", **3E** swapping a dish after approval (#173 point 6). Choices:
  1. The shopping list covers **one calendar week (Mon–Sun)**. "Fixed shopping day" (#113) is built at the end of phase 3.
  2. Amounts are **merged in the recipes' units and rounded** ("Chicken fillet 900 g", "Peppers 3 pcs"), not in store packs.
  3. Staples (oil, salt, spices …) sit in a **closed "Staples" section** at the bottom of the approve sheet. They count as "have", but each can be moved to the list with one tap.
  4. **Each item in the approve sheet has a "Have" / "Buy" button** (the same style as in Home) instead of a checkbox, so there is never any doubt what the choice means. The button at the bottom counts the "Buy" items. Items marked as at home in Home start as "Have"; the rest start as "Buy".
  5. Changes after approval that are not a swap (guests, eating out, a removed meal) show **a small banner on the week plan**: "The plan has changed – 2 more items / 1 fewer [Update the list]".
  6. A new store section **"Other"** for own items and things that aren't food.
  7. **In phase 3 now:** share the list (Web Share, e.g. WhatsApp/SMS) and fixed shopping day. **Later** (backlog): expiry dates, lunchbox mode and weekly budget.
  8. With two approved weeks there is **one shared shopping list**, where each item has a small "Week 47" label.
- **Alternatives:** (1) Fixed shopping day from the start. (2) Store packs, which need a pack size for every ingredient. (3) Staples not shown at all. (4) A checkbox meaning "have at home" (#173), or a checkbox meaning "buy". (5) The swap dialog for every change, or no update at all. (6) Also a "Spices and staples" section. (7) Everything in phase 3. (8) One list per week, with tabs.
- **Rationale:** Product owner's choice: 1a, 2a, 3a, 5a, 6a, 7a, 8a; for 4 the product owner chose its own option ("Have" / "Buy" buttons). The core flow reaches testers sooner, and every choice is clear on screen.
- **Consequences:** #173 point 2 ("items at home are ticked in advance") now means "items at home start as Have". Expiry dates, lunchbox mode and weekly budget go to `docs/BACKLOG.md`. Real-time sharing of the list still needs an account (phase 5); until then the list lives on each phone, and "Share" sends it as text.

## 185. How the shopping list counts amounts (milestone 3A)
- **Date:** 2026-11-20
- **Decision:**
  - **A.** The same item in different units becomes one amount: **pieces if the ingredient has a piece weight, otherwise grams** ("Cucumber 1 pcs + 100 g" → "1½ pcs" before rounding; "2 dl + 300 g yoghurt" → "500 g").
  - **B.** **Pieces, cans and packs are rounded up to whole ones** (you can't buy half a cucumber). Grams and dl are rounded as in recipes (#84).
  - **C.** An ingredient left out of one person's portion (#181) is **bought as for everyone**.
  - **D.** A protein boost added to a meal **is on the list**.
  - **E.** Sunday's dinner that becomes Monday's lunch in the next week is **bought in the week the dinner is cooked**.
  - **F.** Approving a week that has already started covers **only today and the rest of the week**.
- **Alternatives:** (A) Both amounts on one line ("1 pcs + 100 g"). (B) Halves as in recipes. (C) Subtract that person's share. (D) Leave boosts off the list. (E) Count the leftovers in the next week. (F) The whole week.
- **Rationale:** Product owner's choice ("a" on all): one clear amount per line, amounts you can actually buy, and nothing that has already been eaten.
- **Consequences:** `src/data/shopping.ts`: `weekNeeds(ctx, plan, { nextWeek, fromDate })` returns one line per ingredient (amount, unit, store section, staple flag, and every meal that uses it), sorted by store section; `roundForShopping`. Only `planned` meals that are on (#183) count; a dinner counts the next day's leftovers lunch through `dinnerPortionsToCook`; safe alternatives (#180) replace the original. If a unit's weight is unknown (only possible for the user's own ingredients), the item gets one line per unit. Tests: `src/data/shopping.test.ts` (160 in total).

## 186. "Approve week plan" (milestone 3B)
- **Date:** 2026-11-20
- **Decision:**
  1. While meals are empty, the week plan shows **"3 meals missing"** above **[Fill in empty]**. When everything is filled in, the main button becomes **"Approve week plan"**.
  2. **Every meal must be filled in** before the week can be approved. Meals that are off (#183), removed (#168), eating out, or dinner on a fixed day out count as done.
  3. An item used last week **starts as "Buy"**, with "Used last week – do you still have some?" under it.
  4. **Tapping an item name** shows which dishes use it: "Used in: Chicken tikka (Mon), Wok (Thu)".
  5. Amounts **can't be changed** in the sheet. That is done on the shopping list (3C).
  6. **"Skip"** approves the week without adding anything; ✕ closes the sheet without approving.
  7. Until 3C, the Shopping list tab shows **a simple list** (items by store section, no ticking off).
  8. After approval: **"✓ Approved"** under the week name. The button becomes **"See the week's items"**, which opens the sheet again with the saved choices and the button "Update the shopping list (N items)". Plan changes later get the banner from #184 point 5.
- **Alternatives:** (1) The button in the "More" menu. (2) Approving with empty meals. (3) Neither choice selected. (4) Dishes always shown; not shown. (5) +/− per item. (6) "Skip" = close. (7) The link only in 3C; 3B and 3C together. (8) Only the label.
- **Rationale:** Product owner's choice: 1a with its own wording, 2b, 3a, 4a, 5a, 6a, 7a, 8a.
- **Consequences:** New types `WeekApproval`, `ApprovedItem`, `ItemChoice`, `ShoppingItem` (`source: 'plan' | 'user'`, `bought`, `weekId`). Approvals are stored **apart from the week plan** (repository `getApproval` / `saveApproval`, key `approvals`), so re-making a plan never loses an approval silently; the list is stored under `shoppingList` (`listShoppingItems` / `saveShoppingItems`). No schema migration (new keys only). `src/data/shopping.ts`: `approvalRows`, `usedIngredients`, `toApproval`, `applyApproval`, `buyCount`. UI: `src/features/week/ApproveSheet.tsx` (with `ChoiceButtons`, to be reused in Home), buttons in `WeekScreen`, simple `ShoppingScreen`. Tests: 169 in total.
- **Interpretations made while building (approved 2026-11-22):** (a) "Every meal filled in" counts **from today**, like "Fill in empty" – empty meals on past days don't block approval. (b) A week that is over can't be approved (the button is hidden). (c) When everything is "Have", the main button reads "Approve without new items". (d) Approving again replaces the week's items that are not bought yet; what was already bought for that week is subtracted. (e) When the sheet is opened again, "Skip" is hidden (only "Update the shopping list" and ✕). (f) On the simple list, the week label is only shown when the list has items from more than one week. (g) A protein boost is listed as "Evening (Thu)" under "Used in".

## 187. Follow-ups to milestone 3B and the wizard's "Back"
- **Date:** 2026-11-22
- **Decision:**
  1. **Staples (oil, salt, spices …) go on the shopping list without an amount** – in the shop you buy a bottle, not 85 g. A staple already bought for the week isn't added again when the week is approved again.
  2. The approve sheet **stays as it is** (long with many items); testers' feedback decides.
  3. The interpretations (a)–(g) in #186 are approved.
  4. **"Back" in the onboarding wizard follows the path the user actually took**, not the order of the steps: step 1 → "Skip everything" → summary → "Back" returns to step 1.
  5. **Every row in the wizard summary can be tapped** (with a pencil icon): it opens the step where the value is changed. On that step the main button reads **"Back to the summary"**, and "Skip" is hidden; "Back" also returns to the summary.
- **Alternatives:** (1) Amounts for staples too; rounding to packs. (4) Keep "Back" in step order. (5) Edit in place in the summary.
- **Rationale:** Product owner's acceptance test (FEEDBACK_LOG, 2026-11-22).
- **Consequences:** `applyApproval` takes an `isStaple` check; the simple shopping list also hides amounts of staples (covers lists made before this change). The approve sheet still shows amounts for staples. Wizard navigation is a pure module, `src/features/onboarding/wizard-nav.ts` (`startNav`, `back`, `next`, `skipAll`, `edit`), with tests. Summary rows map to steps: adults and children → step 3, food we don't want → step 4, meals, dinner out and cheat days → step 5. New UI texts `onboarding.toSummary`, `onboarding.done.edit`.

## 188. No defaults based on the founder's own family – nothing pre-selected
- **Date:** 2026-11-22
- **Decision:** Replaces #18. **Nothing is pre-selected** under "Food we don't want" – not even pork. Each household adds what it doesn't want itself; pork stays one tap away in the list. The summary shows "Food we don't want: None" when nothing is chosen. **Existing data is not changed.** General rule: settings never default to the product owner's own family's habits; the product owner's household sets its own choices like any other user (as with fixed days out, #107).
- **Alternatives:** Keep pork as the default (#18); ask in the wizard with pork pre-selected.
- **Rationale:** Product owner's acceptance test: pork was pre-selected because the founder's family doesn't eat it, but the app must suit everyone.
- **Consequences:** `defaultHousehold` has `excludedTags: []`. Tests updated: the default excludes nothing, a pork dish is allowed until the household excludes it. The summary label is now "Food we don't want" (was "Excluded"). The example family ("Try with an example family") excludes nothing either. The original brief (`docs/PROMPT.md`) still says pork by default; this decision overrides it.

## 189. Own row for "You" in the wizard summary; no amounts for staples in the approve sheet
- **Date:** 2026-11-25
- **Decision:**
  1. The wizard summary gets its own **top row "You: [name] · [target] g protein"** with a pencil; it opens step 1. "Adults" and "Children" still open step 3. The "Adults" row now lists only the other adults ("None" when there are none), so the user isn't shown twice.
  2. **The approve sheet also shows staples without an amount** – the same rule as the shopping list (#187), to be consistent.
  3. The other interpretations from #187 are approved: "Skip" is hidden when a step is opened from the summary; "None" is capitalised like the other rows; the example family excludes nothing.
- **Alternatives:** (1) Let the "Adults" row open step 1. (2) Keep amounts in the sheet as information.
- **Rationale:** Product owner's review of #187 (2026-11-25).
- **Consequences:** The name is on step 1 and the target on step 2, so the "You" row edits **steps 1–2**: "Next" on step 1 goes to step 2, whose main button reads "Back to the summary"; "Back" walks the same way back to the summary. On step 1 in edit mode "Back" is shown and "Skip everything" is hidden. `wizard-nav.ts` now stores the edited range (`edit: {start, last}`, `isEditing`, `nextReturnsToSummary`), with tests. Without a target the row shows only the name ("Me" if no name). New UI texts `onboarding.done.you`, `onboarding.done.protein`.

## 190. The shopping list (milestone 3C)
- **Date:** 2026-11-25
- **Decision:**
  1. **Ticking off:** tap anywhere on the row (a big target – one hand holds the basket). The item gets ✓, turns grey and is struck through, like on paper. After about **1 second** it glides down to a **"Bought (3)"** section at the bottom – not at once, so the list doesn't jump. Undo in three ways: tap again within the second; the message "Milk bought · Undo" (one message at a time, #148); or tap the item in "Bought" and it goes back up. When everything is ticked off: **"All done ✓"**.
     - (a) Editing an item: a **"⋯" button** at the right of each row opens the item sheet (amount, section, delete).
     - (b) "Bought" is **closed by default**; the phone remembers whether it was opened.
     - (c) "All done ✓" is a short message **and** a card at the top of the list with [Remove bought].
     - (d) **No vibration** on tick (backlog #17).
  2. **Bought items are marked "have" in Home right away** (#178), although the Home screen comes in 3D. Un-ticking puts Home back as it was.
  3. **Own items are written freely, never by picking a section first.** "melk, couscous, vann, cola" becomes four items (comma or line break). The app sorts each item: (1) the section the household chose before, (2) the catalogue – **whole names only**, in nb/de/en, ignoring case and simple inflections ("tomater" → Tomat), (3) a small built-in word list, (4) otherwise **"Other"**. Moving an item to another section is optional (tap "⋯").
     - (x) **No suggestions** while typing.
     - (y) Moving an item is **remembered** for the household and used the next time.
     - (z) **New sections "Drinks" and "Household"** now, with a small built-in word list (water, cola, juice, toothpaste, toilet paper …).
  4. An **amount can be typed** in front of or behind the name ("2 l melk", "melk 2 l", "6 egg"); when unclear, the whole text is the name. It can also be set in the item sheet.
  5. **An item already on the list** is not added again: "Milk is already on the list", and the item sheet opens (when it was the only item typed).
  6. **Delete** in the item sheet, with an undo message (no swipe – works with keyboard and screen readers, WCAG).
  7. **"Remove bought"** (with undo), and bought items also **disappear by themselves when their week is over**.
  8. **"Share"** sends only what is not bought, by section, with amounts (Web Share); if the phone can't share, the text is copied ("Copied").
  9. **"Update the list"** in the banner opens the approve sheet again with the saved choices; what changed is shown first, marked **"New"** / **"New amount"**.
  10. **No counter** on the "Shopping list" tab for now.
- **Alternatives:** (1) Struck through in place; disappearing with only an undo message; long press to edit; "Bought" always open; message only; vibration. (2) Link Home in 3D. (3) Partial name matches; suggestions while typing; moves apply once; unknown drinks/household items in "Other". (4) No amounts in the text. (5) A second line. (6) Swipe. (7) Button only; automatic only. (8) Everything, also bought items. (9) Update at once with an undo message. (10) A counter.
- **Rationale:** Product owner's choices (2026-11-25): the list should feel like a paper list in the shop – fast to write, fast to tick off, with a feeling of progress.
- **Consequences:** `STORE_SECTIONS` gets `drinks`, `household` and `other` (also offered when the user adds an own ingredient). `ShoppingItem` gets `storeSection`, `boughtAt` and `pantryBefore`. New pure modules `src/data/shopping-input.ts` (splitting, amount parsing, catalogue match, word list, `resolveEntry`) and `src/data/shopping-list.ts` (`addTypedItems`, `setBought`, `clearBought`, `dropFinishedBought`, `sectionOf`, `shareText`, `planChanges`), tested in `shopping-list.test.ts`. Repository: `getSectionMemory` / `saveSectionMemory` (key `shopSections`) and the device preference `isBoughtSectionOpen`. UI: `ShoppingScreen`, `ItemSheet`; the banner "The plan has changed – 2 more items · 1 fewer · 1 new amount [Update the list]" on the week plan; "Changed since last time" in `ApproveSheet`. The glide down uses the browser's View Transitions where available, and is skipped with reduced motion.
- **Interpretations made while building** ((a)–(f) approved 2026-11-25; (g) replaced by #191):
  - (a) The word list also covers everyday food that the catalogue names differently ("melk" – the catalogue has "Lettmelk"; "brød", "smør", "pasta" …), so the product owner's own example sorts correctly.
  - (b) Own items get a capital first letter ("couscous" → "Couscous").
  - (c) Only catalogue items go to Home when bought; free-text items (toothpaste, water) don't.
  - (d) Staples have no amount field in the item sheet (they are listed without an amount, #187).
  - (e) Approving a week **again** keeps the first approval's start day (#185 F) instead of today, so items already ticked off for the week are subtracted from the same days. Before, an update in the middle of the week could subtract bought items twice and add too little.
  - (f) The banner counts new items, removed items and changed amounts; changed amounts of staples are ignored (they have no amount on the list).
  - (g) Changing an amount by hand on a plan item is replaced when the week is approved again.

## 191. Automatic updates never overwrite the user's own amounts; the banner sits above today's card
- **Date:** 2026-11-25
- **Decision:**
  1. **An amount the user changed on the shopping list is never overwritten** when the week is approved again – automation must never override the user's own choices. If the plan now needs **more** than when the user changed the amount, only the difference is added, with a small note: **"+200 g from the plan"**. If the plan needs the same or less, the user's amount stays unchanged.
  2. **The banner "The plan has changed"** is placed **right above today's card**, where the week plan opens – not as a floating message. Before the week has started (no card for today), it stays at the top.
  3. Interpretations (a)–(f) in #190 are approved; (g) is replaced by point 1.
- **Alternatives:** (1) Overwrite the amount with the plan's new amount (#190 g); ask every time. (2) At the top of the screen; a floating message at the bottom.
- **Rationale:** Product owner's review of milestone 3C (2026-11-25).
- **Consequences:** `ShoppingItem` gets `planAmount` (what the plan needed when the user changed the amount – marks the amount as the user's own) and `fromPlan` (what approving again added on top). `applyApproval` keeps such items and adds only the extra; if the user's unit differs from the plan's, the amount stays and only the note shows the extra. The note stays until the user changes the amount again. **Interpretations made while building (to be approved):** (a) an item with the user's own amount that the plan no longer needs **stays** on the list; (b) choosing **"Have"** for it in the approve sheet removes it (that is also the user's own choice); (c) if the plan first needs less and later more, the extra is counted from the latest plan amount. The week plan scrolls to the banner instead of today's card when the banner is shown, so both are in view.
