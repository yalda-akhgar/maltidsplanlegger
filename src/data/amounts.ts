import type { HouseholdSettings, Ingredient, Language, Unit } from './types'

/** Portions the household eats: adult = 1, child = ½ (#12). 0 if nobody is set up. */
export function householdPortions(household: Pick<HouseholdSettings, 'people'>): number {
  return household.people.reduce((sum, p) => sum + (p.kind === 'child' ? 0.5 : 1), 0)
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step

/**
 * Rounds a scaled amount to something you can measure (#84):
 * pieces to the nearest half (whole for e.g. eggs), grams/ml to 5 or 10,
 * dl/l/kg to one decimal, spoons to the nearest half. Never rounds a
 * positive amount down to 0.
 */
export function roundAmount(amount: number, unit: Unit, ingredient?: Pick<Ingredient, 'wholeUnitsOnly'>): number {
  if (amount <= 0) return 0
  let rounded: number
  let smallest: number
  switch (unit) {
    case 'g':
    case 'ml':
      smallest = 1
      rounded = amount < 10 ? Math.round(amount) : roundTo(amount, amount < 100 ? 5 : 10)
      break
    case 'dl':
    case 'l':
    case 'kg':
      smallest = 0.1
      rounded = roundTo(amount, 0.1)
      break
    case 'pinch':
      smallest = 1
      rounded = Math.round(amount)
      break
    default: // pcs, pack, can, tbsp, tsp
      smallest = ingredient?.wholeUnitsOnly ? 1 : 0.5
      rounded = roundTo(amount, smallest)
  }
  return Math.max(smallest, Number(rounded.toFixed(2)))
}

/** Formats an amount for display: halves as "½" (1½), other decimals in the language's style (1,5 / 1.5). */
export function formatAmount(amount: number, language: Language): string {
  const whole = Math.floor(amount)
  const rest = amount - whole
  if (Math.abs(rest - 0.5) < 1e-9) return whole === 0 ? '½' : `${whole}½`
  return new Intl.NumberFormat(language === 'nb' ? 'nb-NO' : language, { maximumFractionDigits: 1 }).format(amount)
}

/** Count for a unit's plural form: up to 1 reads as singular ("½ can", "1 can", "2 cans"). */
export const unitCount = (amount: number) => (amount > 1 ? 2 : 1)

/** Formats a number of portions, e.g. 2.5 → "2½". */
export const formatPortions = formatAmount
