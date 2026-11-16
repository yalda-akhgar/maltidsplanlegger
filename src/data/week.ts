import { addDays, format, getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek } from 'date-fns'
import type { IsoDate, WeekId } from './types'

/** ISO week id for a date, e.g. 2026-11-16 → "2026-W47" (#73). */
export function weekIdOf(date: Date): WeekId {
  return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

/** The Monday of an ISO week. */
export function mondayOf(weekId: WeekId): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekId)
  if (!match) throw new Error(`Invalid week id: ${weekId}`)
  // 4 January is always in ISO week 1.
  const jan4 = new Date(Number(match[1]), 0, 4)
  return startOfISOWeek(setISOWeek(jan4, Number(match[2])))
}

/** The 7 dates (Monday–Sunday) of an ISO week. */
export function datesOfWeek(weekId: WeekId): IsoDate[] {
  const monday = mondayOf(weekId)
  return Array.from({ length: 7 }, (_, i) => toIsoDate(addDays(monday, i)))
}

/** The week `weeks` before (negative) or after (positive), e.g. shiftWeek("2026-W47", 1) → "2026-W48". */
export function shiftWeek(weekId: WeekId, weeks: number): WeekId {
  return weekIdOf(addDays(mondayOf(weekId), weeks * 7))
}

export function toIsoDate(date: Date): IsoDate {
  return format(date, 'yyyy-MM-dd')
}
