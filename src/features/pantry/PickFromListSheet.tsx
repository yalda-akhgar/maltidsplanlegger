import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { localize } from '@/data/localize'
import { HOME_CATEGORIES, homeCategory } from '@/data/pantry'
import type { Id, Ingredient } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'

type PickFromListSheetProps = {
  open: boolean
  ingredients: Ingredient[]
  /** Ingredients already in Home (shown with a check mark). */
  inHome: ReadonlySet<Id>
  onToggle: (ingredientId: Id) => void
  onClose: () => void
}

/**
 * "Pick from the list" (#178, #194): every catalogue item grouped like Home's
 * categories; one tap adds it as "Have", another tap removes it. Safe
 * alternatives (gluten-free pasta …) are left out to keep the list short.
 */
export function PickFromListSheet({ open, ingredients, inHome, onToggle, onClose }: PickFromListSheetProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const shown = ingredients.filter((i) => !i.alternativeFor)
  const groups = HOME_CATEGORIES.map((category) => ({
    category,
    items: shown
      .filter((i) => homeCategory(i) === category)
      .map((i) => ({ id: i.id, name: localize(i.name, language) }))
      .sort((a, b) => a.name.localeCompare(b.name, language)),
  })).filter((g) => g.items.length > 0)

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={t('pantry.pick.title')}
      description={t('pantry.pick.intro')}
      footer={<Button onClick={onClose}>{t('pantry.pick.done')}</Button>}
    >
      <div className="space-y-4">
        {groups.map(({ category, items }) => (
          <section key={category} aria-labelledby={`pick-${category}`}>
            <h3 id={`pick-${category}`} className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t(`pantry.categories.${category}`)}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <Chip key={item.id} selected={inHome.has(item.id)} onClick={() => onToggle(item.id)}>
                  {item.name}
                </Chip>
              ))}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  )
}
