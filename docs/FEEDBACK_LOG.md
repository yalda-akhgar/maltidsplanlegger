# Feedback log

User feedback and what changed because of it. Newest first. Each entry links to the decision it led to in [DECISIONS.md](DECISIONS.md).

**Priority:** High = blocks the core value or misleads the user · Medium = noticeable friction · Low = polish or idea for later.

## Template

Copy this block for each piece of feedback:

```markdown
### YYYY-MM-DD – short title
- **Who / role:** e.g. tester (parent of two, trains 3×/week) · product owner (acceptance test)
- **Context:** what they were doing, on which device
- **What they said:** their words, as close as possible
- **Insight:** the underlying need or problem
- **Priority:** High / Medium / Low
- **What changed and why:** the change (with decision #), or why nothing changed
```

---

## External tester 1, 2026-11-20

First feedback from someone outside the project (German-speaking), after trying the live demo.

### Positive first impression
- **Who / role:** external tester (German-speaking)
- **Context:** first use of the live demo
- **What they said:** easy to use and clear; likes "leftovers for lunch"; would use the app for inspiration and to keep track of protein.
- **Insight:** the core idea (protein overview + leftovers for lunch) is understood without explanation.
- **Priority:** –
- **What changed and why:** nothing – confirms the direction.

### Choosing allergens
- **Who / role:** external tester (German-speaking)
- **What they said:** wanted to be able to choose allergens.
- **Insight:** allergies are a basic need for families, not an extra.
- **Priority:** High
- **What changed and why:** already built: allergies (#180), "Doesn't tolerate" (#181) and "not stated" for own ingredients (#182).

### Not everyone eats four meals
- **Who / role:** external tester (German-speaking)
- **What they said:** eats only two meals plus a snack, but lunch is planned anyway – even with 0 % protein on lunch.
- **Insight:** the four meals are hard-wired; a household that skips a meal gets a plan, a shopping list and a protein split that don't match how they eat.
- **Priority:** High (the protein split – the core value – is wrong for them)
- **What changed and why:** "Which meals do you eat?" per household, built before phase 3 (#183); per person in phase 5 (BACKLOG #9).

## Acceptance test – milestone G (onboarding and settings), 2026-11-17

### Plan changes after the shopping list is made
- **Who / role:** product owner (acceptance test)
- **Context:** thinking ahead from the finished week plan to shopping
- **What they said:** "Nothing should be added to the shopping list automatically without me confirming." If a dish is swapped after shopping (salmon → chicken), the app should ask whether the salmon was bought already.
- **Insight:** the plan and the shopping list must never drift apart silently; the user wants control at one clear moment ("Approve week plan").
- **Priority:** High (core of phase 3)
- **What changed and why:** phase 3 core flow defined: approve → check what is at home → confirm → shopping list, plus dialogs for changes after approval (#172, refined in #173). Not built yet.

### Publish earlier
- **Who / role:** product owner
- **What they said:** "We publish right after phase 1, not in phase 7."
- **Insight:** real testers and employers should be able to try the app early.
- **Priority:** High
- **What changed and why:** publishing moved to right after phase 1 (#174); the README says "Live demo: coming soon".

### Leftovers should come back with the dinner
- **Who / role:** product owner (acceptance test)
- **Context:** removed a dinner, then filled it in again
- **What they said:** "If I fill in a removed dinner again, the next day's lunch should get the leftovers back – unless I picked another lunch myself. The rule should apply both ways."
- **Insight:** "lunch = leftovers" is understood as one rule, not a one-way side effect.
- **Priority:** Medium
- **What changed and why:** the app remembers which quick lunches replaced leftovers and restores them when the dinner returns (#170).

### Remove a meal
- **Who / role:** product owner (acceptance test)
- **Context:** planning a day with low appetite
- **What they said:** "I miss being able to remove a meal, e.g. lunch on a day with little appetite."
- **Insight:** real days are not always four meals; a skipped meal should not count against the protein target or trigger a boost.
- **Priority:** High
- **What changed and why:** "Remove meal" with its own status "skipped", undo, fewer dinner portions when a leftovers lunch is removed, and "Fill in again" (#168, #171). Skipping for one person only is in the backlog (#9, phase 5).

### Check-in and positive summary
- **Who / role:** product owner
- **What they said:** a daily or weekly check-in ("Did you eat what was planned today?") and an encouraging summary, never shaming, no medical advice.
- **Insight:** recording what was eaten must take one tap, and feedback should motivate.
- **Priority:** Medium
- **What changed and why:** planned for phase 2 (#169).

### Undo after a settings change
- **Who / role:** product owner (acceptance test)
- **What they said:** "Check that Undo at the top can undo this" (a dinner removed because a weekday became a day without dinner at home).
- **Insight:** settings changes that touch the plan must be as safe as changes made on the plan.
- **Priority:** Medium
- **What changed and why:** verified and covered by a test; the meals come back, the setting itself stays (#167). The development-only "Fill in example family" button was kept for testing (#142).

---

## Acceptance test – milestone F (week plan screen), 2026-11-17

### Messages pile up and disappear
- **Who / role:** product owner (acceptance test)
- **Context:** swapping several dishes in a row on the phone
- **What they said:** several undo messages appeared at once, and they disappeared before there was time to use them.
- **Insight:** undo belongs next to the change, not in a message that times out.
- **Priority:** High
- **What changed and why:** an ↶ button on every changed meal plus one for whole-week actions, and never more than one message at a time (#146–#151).

### Protein alerts on half-planned days
- **Who / role:** product owner (acceptance test)
- **What they said:** alerts about being under target appeared while the day was still being planned.
- **Insight:** a warning about an unfinished day is noise, not help.
- **Priority:** High
- **What changed and why:** no alert while a day has empty meals; one summary when the day is fully planned, and a status label per adult on every day card (#152, #155).

### A boost that does not cover the gap
- **Who / role:** product owner (acceptance test)
- **What they said:** "Add skyr" was offered for a 48 g gap, which skyr alone cannot cover.
- **Insight:** the suggestion must be honest about what it achieves.
- **Priority:** High
- **What changed and why:** the boost combines up to two items, picks the smallest combination that covers the gap, and says how much it covers if it cannot cover all of it; one button for everyone who is short (#153, #154).

### Text squeezed by the button in messages
- **Who / role:** product owner (acceptance test, phone)
- **What they said:** the message text became very narrow next to the button.
- **Priority:** Low
- **What changed and why:** the button sits below the text (#156).

### The shopping list is core value
- **Who / role:** product owner (acceptance test)
- **What they said:** a week plan is only half the job without a shopping list.
- **Insight:** the shopping list is part of the core value, not an extra.
- **Priority:** High
- **What changed and why:** phase 3 (Home + shopping list) moved ahead of phase 2 (#144); used items are asked about when the list is made (#145).
