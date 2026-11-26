# Backlog – ideas for later

Ideas we have deliberately postponed to keep the first version focused. Each idea is reviewed before a new phase starts.

| # | Idea | Description | Status | Reason for postponing | Added |
|---|------|-------------|--------|------------------------|-------|
| 1 | Baking section | A "Baking" recipe category with 4–5 easy recipes to start with: healthy options as well as treats/cakes the family likes (adults and kids). Users can favorite baking recipes and add their own. | Later | Keep the first version focused on the core value (protein-balanced meal planning). Easy to add later because recipe categories are extensible. | 2026-11-15 |
| 2 | Seasonal suggestions (optional, background) | Optionally prefer fruit/vegetables that are in season, without showing it as a requirement. Must work for any country (e.g. Norway, Germany). | Maybe | Most produce is available year-round; not essential for the MVP. | 2026-11-15 |
| 3 | Brand name | Find an international app name that works in Norwegian, German and English (the working name "Måltidsplanlegger" is Norwegian-only). | Later | Naming is not needed to validate the core value; the working name is fine for the prototype. | 2026-11-16 |
| 4 | German menu labels on small phones | German menu labels wrap on very small phones (320 px) – revisit after German testers have tried the app. | Later | Only affects German on the narrowest screens; real feedback first (#91). | 2026-11-16 |
| 5 | Planner prefers fruit and vegetables | Planner actively prefers dishes with more fruit and vegetables. | Later | Kept the first planner simple; fruit/veg is shown in "Today's nutrition" (#99). | 2026-11-16 |
| 6 | Longer weekend dinners | Longer weekend dinners (over 30 min). | Later | All dinners are ≤ 30 min in phase 1 (#97). | 2026-11-16 |
| 7 | Food diary | Manual protein logging (add protein eaten outside the app, e.g. dinner out) together with logging what was actually eaten (eaten / "ate something else" / skipped). Logged protein is shown next to planned protein. Meal tracking is planned for phase 2 (#106); manual logging should be designed together with it. | Later | Phase 2; the data model is ready (#106). | 2026-11-16 |
| 8 | Redo (↷) | Redo (↷) like in Word – add if testers miss it. Option: undo/redo pair in the top bar for all plan changes. | Maybe | Undo per meal (↶) is enough to start with (#146). | 2026-11-17 |
| 9 | Skip a meal for one person · which meals each person eats | Skip a meal for one person only (e.g. low appetite) – only that person's portion and protein change. Also "Which meals do you eat?" per person instead of per household (external tester 1, 2026-11-20). **High priority for phase 5.** | Planned (phase 5) | "Remove meal" works for the whole household for now (#168); per person needs changes to the data model. | 2026-11-17 |
| 10 | Pantry step and reminder | If testers use the pantry toggle a lot: consider a pantry step in onboarding and a weekly reminder. | Maybe | The "use what we have at home first" toggle is an unvalidated idea, shipped small and off by default first (#177). | 2026-11-17 |
| 11 | Guests with allergies | Guests with allergies: set allergies for the guests at a meal, so the dish is checked for them too. Guests can also include children (e.g. "2 guests, 1 child"), so kid-friendly is considered for that meal (#195). **High priority.** | Planned | Allergies are per household member for now (#180, point 12). | 2026-11-19 |
| 12 | Show what blends contain | Show "contains: chili, cumin …" under spice blends and sauces in the recipe view, and let users fill in "contains" on their own ingredients. | Maybe | The pick list already names the ingredient that doesn't fit (#181). | 2026-11-19 |
| 13 | Expiry dates in Home | "Use before" date on items at home; the planner suggests dishes that use them first. The data model already has `PantryItem.expiresOn`. | Later | Core flow of phase 3 first (#184, choice 7). | 2026-11-20 |
| 14 | Lunchbox mode | Lunch (leftovers) shown as a lunchbox, with its own list. | Later | Core flow of phase 3 first (#184, choice 7). | 2026-11-20 |
| 15 | Weekly budget | Approximate price of the shopping list and cheaper alternatives. Needs a price for every ingredient (`Ingredient.price`). | Later | Core flow of phase 3 first; prices are missing (#184, choice 7). | 2026-11-20 |
| 16 | Own order of store sections | Sort the shopping list sections in the order of the household's own shop. | Later | Fixed shop order is enough to start with (#190). | 2026-11-25 |
| 17 | Vibration when ticking off | A short vibration when an item is ticked off (Android only; iPhone browsers don't support it). | Maybe | Some find it annoying, and it doesn't work the same everywhere (#190, 1d). | 2026-11-25 |
| 18 | Portion hint without children | The recipe hint "Adult = 1 portion, child = ½." is shown also in households without children (#195 e). | Maybe | Found during #195; needs the product owner's choice. | 2026-11-26 |
| 19 | Delete own ingredients | Delete an own ingredient, with a named confirmation (#195). Must decide what happens to recipes that use it. | Later | Not possible today; the rule for big deletions is in place (#195, 11a). | 2026-11-26 |

## How to use this list
- New idea? Add a row with status **Later** or **Maybe**.
- Before each phase: review the list and decide what moves into the next phase (status **Planned**) or gets dropped (**Won't do**, with a reason).
