import { CalculatorIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { targetInvalid } from './household-draft'

/** Grams of protein per kg body weight for each activity level (#159). */
const ACTIVITY = [
  { key: 'low', factor: 1.2 },
  { key: 'medium', factor: 1.6 },
  { key: 'high', factor: 2.0 },
] as const

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  /** Large field with the "Work it out" calculator (wizard step 2, My profile). */
  withCalculator?: boolean
}

/** Daily protein target in grams, optional (#160), with a guideline calculator (#159). */
export function ProteinTargetField({ label, value, onChange, withCalculator = false }: Props) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const [calcOpen, setCalcOpen] = useState(false)
  const [weight, setWeight] = useState('')
  const [activity, setActivity] = useState<(typeof ACTIVITY)[number]['key']>('medium')
  const invalid = targetInvalid(value)

  const kg = Number.parseFloat(weight.replace(',', '.'))
  const factor = ACTIVITY.find((a) => a.key === activity)!.factor
  const result = Number.isFinite(kg) && kg >= 20 && kg <= 300 ? Math.round(kg * factor) : undefined
  const number = (n: number) => n.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <div className="relative">
          <Input
            id={id}
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? `${id}-error` : undefined}
            className={cn('pr-24', withCalculator && 'h-14 text-2xl font-bold')}
          />
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted-foreground">
            {t('household.gramsPerDay')}
          </span>
        </div>
        {invalid ? (
          <p id={`${id}-error`} className="text-sm text-destructive">
            {t('household.targetInvalid')}
          </p>
        ) : null}
      </div>

      {withCalculator ? (
        calcOpen ? (
          <div className="space-y-3 rounded-2xl bg-secondary p-3">
            <p className="font-semibold text-secondary-foreground">{t('household.calc.title')}</p>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-kg`} className="text-sm font-medium">
                {t('household.calc.weight')}
              </label>
              <Input id={`${id}-kg`} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div role="group" aria-label={t('household.calc.activity')} className="flex flex-wrap gap-2">
              {ACTIVITY.map((a) => (
                <Chip key={a.key} selected={activity === a.key} onClick={() => setActivity(a.key)}>
                  {t(`household.calc.${a.key}`, { factor: number(a.factor) })}
                </Chip>
              ))}
            </div>
            <p aria-live="polite" className="text-sm">
              {result !== undefined ? t('household.calc.result', { kg: number(kg), factor: number(factor), result }) : t('household.calc.enterWeight')}
            </p>
            {result !== undefined ? (
              <Button variant="outline" onClick={() => onChange(String(result))}>
                {t('household.calc.use', { result })}
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">{t('household.calc.note')}</p>
          </div>
        ) : (
          <Button variant="ghost" className="-ml-3 text-primary-text" onClick={() => setCalcOpen(true)}>
            <CalculatorIcon aria-hidden />
            {t('household.calc.open')}
          </Button>
        )
      ) : null}
    </div>
  )
}
