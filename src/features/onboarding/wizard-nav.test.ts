import { describe, expect, it } from 'vitest'
import { back, currentStep, edit, isEditing, next, nextReturnsToSummary, skipAll, startNav } from './wizard-nav'

const TOTAL = 6

describe('wizard navigation (#187)', () => {
  it('"Back" after "Skip everything" returns to step 1, where the user was', () => {
    const summary = skipAll(startNav(), TOTAL)
    expect(currentStep(summary)).toBe(TOTAL)
    expect(currentStep(back(summary))).toBe(1)
  })

  it('"Back" follows the steps in order when the user went through them', () => {
    let nav = startNav()
    for (let i = 1; i < TOTAL; i++) nav = next(nav, TOTAL)
    expect(currentStep(nav)).toBe(6)
    nav = back(nav)
    expect(currentStep(nav)).toBe(5)
    nav = back(back(back(back(nav))))
    expect(currentStep(nav)).toBe(1)
    expect(currentStep(back(nav))).toBe(1) // stays on the first step
  })

  it('a summary row opens its step; "Next" returns to the summary', () => {
    const summary = skipAll(startNav(), TOTAL)
    const editing = edit(summary, 4)
    expect(currentStep(editing)).toBe(4)
    expect(isEditing(editing)).toBe(true)
    expect(nextReturnsToSummary(editing)).toBe(true)
    const done = next(editing, TOTAL)
    expect(currentStep(done)).toBe(TOTAL)
    expect(isEditing(done)).toBe(false)
    // …and "Back" from the summary still goes to where the user came from.
    expect(currentStep(back(done))).toBe(1)
  })

  it('"Back" while editing also returns to the summary', () => {
    const editing = edit(skipAll(startNav(), TOTAL), 3)
    expect(currentStep(back(editing))).toBe(TOTAL)
  })

  it('"Next" on the last step does nothing', () => {
    const summary = skipAll(startNav(), TOTAL)
    expect(next(summary, TOTAL)).toEqual(summary)
  })

  it('the "You" row opens step 1, "Next" goes to step 2, then back to the summary (#189)', () => {
    const summary = skipAll(startNav(), TOTAL)
    const step1 = edit(summary, 1, 2)
    expect(currentStep(step1)).toBe(1)
    expect(nextReturnsToSummary(step1)).toBe(false)
    const step2 = next(step1, TOTAL)
    expect(currentStep(step2)).toBe(2)
    expect(isEditing(step2)).toBe(true)
    expect(nextReturnsToSummary(step2)).toBe(true)
    const done = next(step2, TOTAL)
    expect(currentStep(done)).toBe(TOTAL)
    expect(isEditing(done)).toBe(false)
    expect(currentStep(back(done))).toBe(1)
  })

  it('"Back" from step 2 while editing goes to step 1, then to the summary (#189)', () => {
    const step2 = next(edit(skipAll(startNav(), TOTAL), 1, 2), TOTAL)
    const step1 = back(step2)
    expect(currentStep(step1)).toBe(1)
    expect(isEditing(step1)).toBe(true)
    const summary = back(step1)
    expect(currentStep(summary)).toBe(TOTAL)
    expect(isEditing(summary)).toBe(false)
  })
})
