# CLAUDE.md

## 📍 Status (updated 2026-11-16 – resume here)
**Phase 1, milestone C (data model) – done. Waiting for the product owner's review and "fortsett" before milestone D (recipes + snacks).**

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

---

## Working agreement
- The product owner is a beginner. Explanations in chat are in **Norwegian**, short and simple. After each step: 2–4 sentences on what was done, why, and how to see the result.
- When the product owner must act (create an account, click, approve), give numbered steps with exactly what to click.
- Work in milestones and **stop after each one**, waiting for "fortsett".
- **All documentation is in English**: README, `CLAUDE.md`, everything in `docs/`, code comments and commit messages. The app UI is Norwegian by default (German and English via i18n).
- **New ideas go to `docs/BACKLOG.md`** (in English) instead of being built right away.
- **Every decision is logged in `docs/DECISIONS.md`** (date, decision, alternatives, rationale, consequences).
- Commit after each finished step with short, clear English messages, and push to GitHub.
- The product owner uses Windows + PowerShell.
- All accounts (GitHub, Supabase, Vercel, Anthropic) must be the product owner's **private** accounts, never the bootcamp/student ones. Commits must use the private e-mail.

## Project summary
**Måltidsplanlegger** is a mobile-first PWA meal planner for families with children. Its core value is **protein-balanced planning**: each adult has a personal daily protein target, and the planner picks dishes and adjusts portions so breakfast + lunch (leftovers from the previous dinner) + dinner + evening snack meet it, while keeping each day nutritionally balanced.

Full vision: `docs/PROMPT.md`. Phase 1 brief: `docs/FASE1_PROMPT.md` plus the product owner's answers in `docs/SVAR_PLAN.md`. Original UI prototype prompts: `docs/FIGMA_MAKE_*.md`.

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
- Friday has no dinner. Lunch = leftovers from the previous day's dinner (Monday = previous week's Sunday, else a quick lunch). Saturday has its own quick lunch. Eating out → quick lunch the next day.
- Excluded food (pork by default, plus custom exclusions) is never suggested. Children's dislikes are avoided where possible (soft rule).
- Regular dinners ≤ 30 min. No repeated dinner within a week. Favourites twice as likely.
- Personal protein targets, split 25/30/30/15 % (breakfast/lunch/dinner/snack), portions scaled 0.75×–2× per person, then a "protein boost" suggestion. A child = 0.5 portion, no target. Guests = standard adult portion.
- Evening snack every day; healthy except on chosen cheat days.
- Recipe categories are data and extensible (e.g. "Baking" later).

## Folder structure
Feature-based (decision #40):
```
docs/                    Product docs: PROMPT, FASE1_PROMPT, SVAR_PLAN, DECISIONS, BACKLOG, Figma prompts
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
- Colours only via design tokens (`bg-primary`, `text-muted-foreground`, …), never raw hex in components. Purple **text** uses `text-primary-text` (not `text-primary`). After changing colours, run `npm run check:contrast`.
- Touch targets ≥ 44 px (`h-11` / `min-h-11`). Respect safe areas with `env(safe-area-inset-*)`.
- **Accessibility – WCAG 2.2 AA is a requirement** (decision #53): contrast in both themes; colour never the only signal; `aria-label` on icon-only buttons; full keyboard use with visible focus (`focus-visible:ring-2 ring-ring`); text sizes in rem; reduced motion respected (global rule in `index.css`). Each screen sets its title via `PageHeader`.
- **Editing files on Windows:** never use PowerShell 5.1 `Get-Content`/`Set-Content` to edit source files – it corrupts UTF-8 (æøå, –, ↻) and adds a BOM. Use the Edit/Write tools or Node.
- Theme (system/light/dark) is stored by `next-themes` under `mp:theme`; everything else via the repository.

## Current phase
**Phase 1 – Foundation**, milestones **A–C** done; milestone **D (recipes + snacks)** next.

Milestones: A setup/GitHub · B design system + app shell · C data model · D recipes + snacks · E planner logic + tests · F week-plan screen · G onboarding + settings · H documentation.
