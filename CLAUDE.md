# CLAUDE.md

## 📍 Status (updated 2026-11-16 – resume here)
**Phase 1, milestone A (project setup + GitHub) – done. Waiting for "fortsett" before milestone B.**
Repo: https://github.com/yalda-akhgar/maltidsplanlegger (public). Git identity (repo-local): `Yalda Akhgar` / `357414314+yalda-akhgar@users.noreply.github.com`. ⚠️ Never use the NTNU address – it is the *global* git e-mail on this PC.

Next: milestone B. First ask the product owner about shadcn/ui setup and the folder structure.

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
Current (Vite template, to be reorganised once the structure is decided by the product owner):
```
docs/            Product docs: PROMPT, FASE1_PROMPT, DECISIONS, BACKLOG, Figma prompts
public/          Static files (icons, manifest assets)
src/             Application source
CLAUDE.md        This file
.env.example     Template for environment variables (no secrets)
```

## Current phase
**Phase 1 – Foundation**, milestone **A** done; milestone **B (design system + app shell)** next.

Milestones: A setup/GitHub · B design system + app shell · C data model · D recipes + snacks · E planner logic + tests · F week-plan screen · G onboarding + settings · H documentation.
