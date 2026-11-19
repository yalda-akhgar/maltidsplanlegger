import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { ALLERGENS, type Allergen } from '@/data/types'

/** "Gluten, milk (allergy)" in list order, or "None". */
export function useAllergyList() {
  const { t } = useTranslation()
  return (allergies: readonly Allergen[]) =>
    allergies.length > 0 ? ALLERGENS.filter((a) => allergies.includes(a)).map((a) => t(`allergens.names.${a}`)).join(', ') : t('allergens.none')
}

/**
 * "Allergies and intolerances" row on a person card, with the sheet to change
 * them (#180). A fixed list – the EU's 14 allergens plus lactose – not free text.
 */
export function AllergyRow({ name, allergies, onChange }: { name: string; allergies: Allergen[]; onChange: (allergies: Allergen[]) => void }) {
  const { t } = useTranslation()
  const list = useAllergyList()
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
      <span className="min-w-0">
        {t('allergens.label')}{' '}
        <span className={allergies.length > 0 ? 'font-semibold' : 'text-muted-foreground'}>{list(allergies)}</span>
      </span>
      <Button variant="ghost" className="shrink-0 text-primary-text" aria-label={t('allergens.edit', { name })} onClick={() => setOpen(true)}>
        {t('allergens.change')}
      </Button>
      <AllergiesSheet open={open} name={name} selected={allergies} onChange={onChange} onClose={() => setOpen(false)} />
    </div>
  )
}

type SheetProps = {
  open: boolean
  name: string
  selected: Allergen[]
  onChange: (allergies: Allergen[]) => void
  onClose: () => void
}

/** Choose a person's allergies and intolerances (#180). Several can be chosen. */
export function AllergiesSheet({ open, name, selected, onChange, onClose }: SheetProps) {
  const { t } = useTranslation()
  const toggle = (a: Allergen) => onChange(selected.includes(a) ? selected.filter((x) => x !== a) : ALLERGENS.filter((x) => x === a || selected.includes(x)))
  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={t('allergens.title', { name })}
      description={t('allergens.description', { name })}
      footer={<Button onClick={onClose}>{t('allergens.done')}</Button>}
    >
      <div className="space-y-4">
        <div role="group" aria-label={t('allergens.label')} className="flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <Chip key={a} selected={selected.includes(a)} onClick={() => toggle(a)}>
              {t(`allergens.names.${a}`)}
            </Chip>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{t('allergens.lactoseHint')}</p>
        <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{t('allergens.disclaimer')}</p>
      </div>
    </BottomSheet>
  )
}
