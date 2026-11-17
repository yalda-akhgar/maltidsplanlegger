import { format, getISOWeek, parseISO, type Locale } from 'date-fns'
import { de, enGB, nb } from 'date-fns/locale'
import type { TFunction } from 'i18next'
import type { IsoDate, Language, WeekId } from '@/data/types'
import { datesOfWeek, mondayOf } from '@/data/week'

const LOCALES: Record<Language, Locale> = { nb, de, en: enGB }

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)

/** "Tirsdag 17. nov." – or "tirsdag 17. nov." inside a sentence or after a comma. */
export function formatDay(date: IsoDate, language: Language, t: TFunction, inSentence = false): string {
  const text = format(parseISO(date), t('week.dateFormats.day'), { locale: LOCALES[language] })
  return inSentence ? text : capitalize(text)
}

/** Weekday name as used inside a sentence: "mandag" (nb), "Montag" (de), "Monday" (en). */
export function weekdayName(date: IsoDate, language: Language): string {
  return format(parseISO(date), 'EEEE', { locale: LOCALES[language] })
}

/** "Uke 47 · 16.–22. nov." */
export function formatWeek(weekId: WeekId, language: Language, t: TFunction): string {
  const dates = datesOfWeek(weekId)
  const [first, last] = [parseISO(dates[0]), parseISO(dates[6])]
  const locale = LOCALES[language]
  const startFormat = first.getMonth() === last.getMonth() ? t('week.dateFormats.rangeStart') : t('week.dateFormats.rangeStartOtherMonth')
  const range = `${format(first, startFormat, { locale })}–${format(last, t('week.dateFormats.rangeEnd'), { locale })}`
  return t('week.weekLabel', { week: weekNumber(weekId), range })
}

/** Portion as a mixed number in quarters, e.g. 1.25 → "1¼" (#101). */
export function formatQuarters(value: number): string {
  const quarters = Math.round(value * 4)
  const whole = Math.floor(quarters / 4)
  const frac = ['', '¼', '½', '¾'][quarters % 4]
  return whole === 0 && frac ? frac : `${whole}${frac}`
}

export const weekNumber = (weekId: WeekId) => getISOWeek(mondayOf(weekId))
