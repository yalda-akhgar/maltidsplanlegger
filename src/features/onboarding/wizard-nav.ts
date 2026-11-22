/**
 * Navigation in the onboarding wizard (#187). "Back" follows the path the
 * user actually took, not the order of the steps: after "Skip everything"
 * on step 1, "Back" on the summary returns to step 1. A row in the summary
 * opens its step in edit mode; "Next" (or "Back") then returns to the summary.
 * Pure functions, so they are easy to test.
 */

export interface WizardNav {
  /** Every step visited, in order; the last one is shown. */
  path: number[]
  /** A step opened from the summary: "Next" returns to the summary. */
  editing: boolean
}

export const startNav = (): WizardNav => ({ path: [1], editing: false })

export const currentStep = (nav: WizardNav) => nav.path[nav.path.length - 1]

/** Goes back one step along the path taken. Stays on the first step. */
export function back(nav: WizardNav): WizardNav {
  if (nav.path.length <= 1) return nav
  return { path: nav.path.slice(0, -1), editing: false }
}

/** "Next" or "Skip": the following step, or back to the summary in edit mode. */
export function next(nav: WizardNav, total: number): WizardNav {
  if (nav.editing) return back(nav)
  const step = currentStep(nav)
  return step >= total ? nav : { path: [...nav.path, step + 1], editing: false }
}

/** "Skip everything": straight to the summary. */
export const skipAll = (nav: WizardNav, total: number): WizardNav => ({ path: [...nav.path, total], editing: false })

/** A row in the summary: opens that step, and "Next" comes back to the summary. */
export const edit = (nav: WizardNav, step: number): WizardNav => ({ path: [...nav.path, step], editing: true })
