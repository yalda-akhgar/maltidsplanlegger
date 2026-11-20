import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { canTurnOff, mealOn, turnMealOff, turnMealOn } from '@/data/meals'
import { MEAL_SLOTS, type ProteinSplit } from '@/data/types'

/**
 * "Which meals do you eat?" (#183): one switch per meal. Turning a meal off
 * spreads its protein share over the others; at least one main meal stays on.
 */
export function MealsOnFields({ split, onChange }: { split: ProteinSplit; onChange: (split: ProteinSplit) => void }) {
  const { t } = useTranslation()
  const id = useId()
  const locked = MEAL_SLOTS.some((slot) => !canTurnOff(split, slot))

  return (
    <div className="space-y-2">
      <p id={`${id}-title`} className="font-semibold">
        {t('household.meals.title')}
      </p>
      <ul aria-labelledby={`${id}-title`} className="divide-y rounded-2xl border bg-card">
        {MEAL_SLOTS.map((slot) => {
          const on = mealOn(split, slot)
          return (
            <li key={slot}>
              <label className="flex min-h-11 items-center justify-between gap-3 px-3 py-1.5">
                <span className="font-medium">{t(`week.slots.${slot}`)}</span>
                <Switch
                  checked={on}
                  disabled={!canTurnOff(split, slot)}
                  aria-describedby={locked ? `${id}-min` : undefined}
                  onCheckedChange={(next) => onChange(next ? turnMealOn(split, slot) : turnMealOff(split, slot))}
                />
              </label>
            </li>
          )
        })}
      </ul>
      <p className="text-sm text-muted-foreground">{t('household.meals.hint')}</p>
      {locked ? (
        <p id={`${id}-min`} className="text-sm text-muted-foreground">
          {t('household.meals.minOne')}
        </p>
      ) : null}
    </div>
  )
}
