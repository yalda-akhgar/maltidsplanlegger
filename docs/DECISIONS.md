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
