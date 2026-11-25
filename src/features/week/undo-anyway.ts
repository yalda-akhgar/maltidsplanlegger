import type { TFunction } from 'i18next'
import { askConfirm } from '@/lib/confirm'

/**
 * Undo would bring back a dish that was replaced because of an allergy or
 * something someone doesn't tolerate: ask "Pick anyway?" first (#194, #180).
 * Resolves true to bring the dishes back anyway.
 */
export function confirmUnsafeUndo(t: TFunction, dishNames: string[]): Promise<boolean> {
  return askConfirm({
    title: t('allergens.pickAnyway.title'),
    description: t('allergens.undoAnyway.description', { dishes: [...new Set(dishNames)].join(', ') }),
    cancelLabel: t('allergens.undoAnyway.cancel'),
    confirmLabel: t('allergens.pickAnyway.confirm'),
  })
}
