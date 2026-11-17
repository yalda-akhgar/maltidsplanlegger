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
