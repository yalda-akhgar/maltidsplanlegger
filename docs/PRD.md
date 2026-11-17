# Product requirements – Måltidsplanlegger

> **Status:** draft, 2026-11-17. The success metrics in section 4 are proposals and will be corrected by the product owner.
> This is the English summary of the requirements. The original brief is in Norwegian (`PROMPT.md`, `FASE1_PROMPT.md`, see [README](README.md)); details and reasons for every rule are in [DECISIONS.md](DECISIONS.md).

## 1. Problem

Families who want enough protein spend time every week on planning and arithmetic: adults have different protein targets, children need ordinary food they like, weekdays are busy, and the plan must turn into a shopping list. Existing meal planners plan dishes, not people: they do not show whether each adult reaches their target, or how much of a dish each person should eat.

## 2. Target users

- **Primary:** a parent in a family with children (2 adults, 1–3 children) who plans the week's food and cares about protein, e.g. for training, weight management or general health. Plans on the phone, often on Sunday evening.
- **Secondary:** the other adult in the household, who follows the plan, swaps a dish on short notice and wants to see their own numbers.
- **Not for (now):** people who need medical nutrition therapy. The app gives guidelines, not medical advice.

## 3. Goals

1. A family can make a week plan that meets every adult's protein target in a few minutes.
2. The plan fits real life: short weekday dinners, leftovers for lunch, days without dinner at home, children's dislikes, cheat days.
3. Changes are cheap and safe: swapping, picking, removing or undoing a meal never breaks the rules or loses the user's own choices.
4. The plan becomes a shopping list with as few questions as possible (phase 3).
5. Accessible and pleasant on any phone, in Norwegian, German and English.

## 4. Success metrics (proposed – to be confirmed)

| Metric | Proposed target | How to measure |
|---|---|---|
| Time to plan a week | Under 5 minutes from opening the app to a finished week | Testers time themselves; later analytics (phase 7) |
| Protein targets reached | At least 5 of 7 planned days on target for every adult | Calculated from the plan; from phase 2 also from meals marked as eaten |
| Weekly use | The family plans at least 3 weeks in a row | Analytics (phase 7) |
| Manual changes | Fewer than 5 swaps per week on average after the first two weeks (the suggestions fit) | Analytics (phase 7) |
| Onboarding completion | 90 % of new users finish or skip the wizard and get a first week plan | Analytics (phase 7) |
| Accessibility | Lighthouse accessibility 100; no WCAG 2.2 AA failures | Lighthouse and manual checks per milestone |
| Tester satisfaction | 4 of 5 testers say they would keep using it | Interviews after the first live test |

## 5. Features

### Must (phase 1 – built)
- Personal daily protein target per adult, split across four meals; portions scaled per person; children at half a portion.
- Week plan generator with rules: dinners ≤ 30 min, no repeated dinner, varied protein sources, favourites more often, excluded food never, children's dislikes avoided.
- Lunch = leftovers from the previous dinner; quick lunch when the dinner is not cooked at home.
- Day status per adult and an honest protein boost suggestion.
- Plan by hand: swap, pick with protein impact, eating out, guests, remove a meal, undo per meal and per week action.
- Recipes and snacks with nutrition calculated from ingredients; own recipes; favourites.
- Onboarding wizard and settings (people, targets, excluded food, fixed days without dinner at home, cheat days, protein split, automatic week plan, language, theme).
- PWA (installable, offline), light and dark mode, nb / de / en, WCAG 2.2 AA.

### Should (next phases)
- Publish a live version right after phase 1.
- Phase 3 – Home and shopping list: approve the week plan, check what is at home grouped by store section, a shopping list that is only filled after confirmation, dialogs when the plan changes after approval, a fixed shopping day, expiry dates, packed lunch mode, weekly budget, sharing the list.
- Phase 2 – Use: cooking mode, rating dishes, marking meals as eaten, check-in and a positive weekly summary.

### Could (later phases)
- Voice commands (phase 4).
- Login with Google, email or passkeys, and sharing within the household (phase 5).
- AI: fridge suggestions, recipe import from a link or photo, week plans from free text (phase 6).
- Reminders, feedback button, analytics, calendar sync (phase 7).
- Ideas in the [backlog](BACKLOG.md), e.g. skipping a meal for one person, baking recipes, seasonal produce.

## 6. Out of scope

- Medical or clinical nutrition advice, calorie counting as a goal, or diets for medical conditions.
- Native App Store / Google Play apps (the PWA covers iPhone, Android and desktop).
- Sign in with Apple (cost).
- Tracking exact quantities in the pantry (the app asks "Do you still have …?" instead).
- A server or accounts before phase 5; until then data stays on the device.
