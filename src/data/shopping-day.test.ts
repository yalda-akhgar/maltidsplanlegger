import { describe, expect, it } from 'vitest'
import { shoppingReminderWeek } from './shopping-day'

// 2026-11-28 is a Saturday in week 48; 2026-11-29 is a Sunday.
const SATURDAY = '2026-11-28'
const SUNDAY = '2026-11-29'
const none = () => false

describe('shoppingReminderWeek (#198)', () => {
  it('never reminds without a shopping day', () => {
    expect(shoppingReminderWeek(SATURDAY, undefined, none)).toBeUndefined()
  })

  it('only reminds on the shopping day', () => {
    expect(shoppingReminderWeek(SATURDAY, 2, none)).toBeUndefined()
    expect(shoppingReminderWeek(SATURDAY, 5, none)).toBe('2026-W48')
  })

  it('reminds about next week when this week is approved', () => {
    expect(shoppingReminderWeek(SATURDAY, 5, (w) => w === '2026-W48')).toBe('2026-W49')
  })

  it('no reminder when both weeks are approved', () => {
    expect(shoppingReminderWeek(SATURDAY, 5, () => true)).toBeUndefined()
  })

  it('on Sunday the reminder is for next week', () => {
    expect(shoppingReminderWeek(SUNDAY, 6, none)).toBe('2026-W49')
  })
})
