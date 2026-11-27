import { PlusIcon, XIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import type { Weekday } from '@/data/types'
import { cn } from '@/lib/utils'
import { sortedDays } from './household-draft'

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

/** Food we don't want: pork one tap away (nothing pre-selected, #188) plus the household's own words. */
export function ExcludedFoodFields({
  excludedTags,
  excludedTerms,
  onChange,
}: {
  excludedTags: string[]
  excludedTerms: string[]
  onChange: (value: { excludedTags: string[]; excludedTerms: string[] }) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [term, setTerm] = useState('')
  const pork = excludedTags.includes('pork')

  const add = () => {
    const value = term.trim()
    if (!value) return
    if (!excludedTerms.some((x) => x.toLowerCase() === value.toLowerCase())) onChange({ excludedTags, excludedTerms: [...excludedTerms, value] })
    setTerm('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Chip
          selected={pork}
          onClick={() => onChange({ excludedTerms, excludedTags: pork ? excludedTags.filter((x) => x !== 'pork') : [...excludedTags, 'pork'] })}
        >
          {t('household.food.pork')}
        </Chip>
        {excludedTerms.map((x) => (
          <span key={x} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary bg-primary pr-1 pl-4 text-sm font-medium text-primary-foreground">
            {x}
            <button
              type="button"
              aria-label={t('household.food.remove', { name: x })}
              onClick={() => onChange({ excludedTags, excludedTerms: excludedTerms.filter((y) => y !== x) })}
              className="inline-flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon aria-hidden className="size-4" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <label htmlFor={id} className="sr-only">
          {t('household.food.addLabel')}
        </label>
        <Input id={id} value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('household.food.placeholder')} autoComplete="off" />
        <Button type="submit" variant="secondary" disabled={!term.trim()}>
          <PlusIcon aria-hidden />
          {t('household.food.add')}
        </Button>
      </form>
    </div>
  )
}

/** Seven weekday buttons. Several can be chosen, or exactly one with `single`. */
export function WeekdayPicker({
  label,
  value,
  onChange,
  single = false,
}: {
  label: string
  value: Weekday[]
  onChange: (days: Weekday[]) => void
  single?: boolean
}) {
  const { t } = useTranslation()
  const toggle = (day: Weekday) => {
    if (single) onChange([day])
    else onChange(sortedDays(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]))
  }
  return (
    <div role="group" aria-label={label} className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map((day) => {
        const on = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            aria-label={t(`household.weekdays.long.${day}`)}
            onClick={() => toggle(day)}
            className={cn(
              'flex min-h-11 items-center justify-center rounded-xl border text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:bg-secondary',
            )}
          >
            {t(`household.weekdays.short.${day}`)}
          </button>
        )
      })}
    </div>
  )
}

/** Fixed shopping day (#198): "No fixed day" or one weekday. */
export function ShoppingDayField({ value, onChange }: { value: Weekday | undefined; onChange: (day: Weekday | undefined) => void }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <p className="font-semibold">{t('household.week.shoppingDayTitle')}</p>
      <button
        type="button"
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
        className={cn(
          'flex min-h-11 w-full items-center justify-center rounded-xl border text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          value === undefined ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:bg-secondary',
        )}
      >
        {t('household.week.shoppingDayNone')}
      </button>
      <WeekdayPicker single label={t('household.week.shoppingDayTitle')} value={value === undefined ? [] : [value]} onChange={(days) => onChange(days[0])} />
      <p className="text-sm text-muted-foreground">{t('household.week.shoppingDayHint')}</p>
    </div>
  )
}

/** "Your week": fixed days without dinner at home (#107) and cheat days (#21). */
export function WeekRhythmFields({
  noDinnerAtHomeDays,
  cheatDays,
  snackOn = true,
  lunchOn = true,
  dinnerOn = true,
  onChange,
}: {
  noDinnerAtHomeDays: Weekday[]
  cheatDays: Weekday[]
  /** Cheat days are hidden while the household doesn't eat an evening snack (#183). */
  snackOn?: boolean
  /** "The next day gets a quick lunch" is hidden while the household doesn't eat lunch (#183). */
  lunchOn?: boolean
  /** Fixed days without dinner at home are hidden while the household doesn't eat dinner (#195). */
  dinnerOn?: boolean
  onChange: (value: { noDinnerAtHomeDays: Weekday[]; cheatDays: Weekday[] }) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      {dinnerOn ? (
        <div className="space-y-2">
          <p className="font-semibold">{t('household.week.outTitle')}</p>
          <WeekdayPicker label={t('household.week.outTitle')} value={noDinnerAtHomeDays} onChange={(days) => onChange({ cheatDays, noDinnerAtHomeDays: days })} />
          {lunchOn ? <p className="text-sm text-muted-foreground">{t('household.week.outHint')}</p> : null}
        </div>
      ) : null}
      {snackOn ? (
      <div className="space-y-2">
        <p className="font-semibold">{t('household.week.cheatTitle')}</p>
        <WeekdayPicker label={t('household.week.cheatTitle')} value={cheatDays} onChange={(days) => onChange({ noDinnerAtHomeDays, cheatDays: days })} />
        <p className="text-sm text-muted-foreground">{t('household.week.cheatHint')}</p>
      </div>
      ) : null}
    </div>
  )
}
