/**
 * Navigation in the onboarding wizard (#187). "Back" follows the path the
 * user actually took, not the order of the steps: after "Skip everything"
 * on step 1, "Back" on the summary returns to step 1. A row in the summary
 * opens its step(s) in edit mode; "Next" after the last of them (or "Back"
 * from the first) returns to the summary. The "You" row covers steps 1–2:
 * name and protein target (#189). Pure functions, so they are easy to test.
 */

export interface WizardNav {
  /** Every step visited, in order; the last one is shown. */
  path: number[]
  /** Steps opened from the summary: `start` is the summary's index in `path`, `last` the last step to edit. */
  edit: { start: number; last: number } | null
}

export const startNav = (): WizardNav => ({ path: [1], edit: null })

export const currentStep = (nav: WizardNav) => nav.path[nav.path.length - 1]

/** True while a step opened from the summary is shown. */
export const isEditing = (nav: WizardNav) => nav.edit !== null

/** True when "Next" goes back to the summary (the last step being edited). */
export const nextReturnsToSummary = (nav: WizardNav) => nav.edit !== null && currentStep(nav) >= nav.edit.last

/** Goes back one step along the path taken. Stays on the first step. */
export function back(nav: WizardNav): WizardNav {
  if (nav.path.length <= 1) return nav
  const path = nav.path.slice(0, -1)
  const edit = nav.edit && path.length - 1 > nav.edit.start ? nav.edit : null
  return { path, edit }
}

/** "Next" or "Skip": the following step, or back to the summary after the last step being edited. */
export function next(nav: WizardNav, total: number): WizardNav {
  const step = currentStep(nav)
  if (nav.edit) {
    if (step < nav.edit.last) return { path: [...nav.path, step + 1], edit: nav.edit }
    return { path: nav.path.slice(0, nav.edit.start + 1), edit: null }
  }
  return step >= total ? nav : { path: [...nav.path, step + 1], edit: null }
}

/** "Skip everything": straight to the summary. */
export const skipAll = (nav: WizardNav, total: number): WizardNav => ({ path: [...nav.path, total], edit: null })

/** A row in the summary: opens `step` (through `last`), then "Next" comes back to the summary. */
export const edit = (nav: WizardNav, step: number, last = step): WizardNav => ({
  path: [...nav.path, step],
  edit: { start: nav.path.length - 1, last },
})
