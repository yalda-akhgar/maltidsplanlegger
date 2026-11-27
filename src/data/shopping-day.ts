/**
 * Fixed shopping day (#198): a reminder only – the shopping list still covers
 * one calendar week. Pure, so it is easy to test.
 */
import { weekdayOf } from './planner'
import type { IsoDate, WeekId, Weekday } from './types'
import { shiftWeek, weekIdOf } from './week'

/**
 * The week the reminder "Today is shopping day – approve the shopping list"
 * is about, or undefined when there is no reminder today:
 * - only on the household's shopping day (none set → never);
 * - this week, if it isn't approved and has more than today left;
 * - otherwise next week, if it isn't approved.
 */
export function shoppingReminderWeek(
  today: IsoDate,
  shoppingDay: Weekday | undefined,
  isApproved: (weekId: WeekId) => boolean,
): WeekId | undefined {
  if (shoppingDay === undefined || weekdayOf(today) !== shoppingDay) return undefined
  const thisWeek = weekIdOf(new Date(`${today}T12:00:00`))
  // On Sunday only today is left of this week: the shopping is for next week.
  if (shoppingDay !== 6 && !isApproved(thisWeek)) return thisWeek
  const nextWeek = shiftWeek(thisWeek, 1)
  return isApproved(nextWeek) ? undefined : nextWeek
}
