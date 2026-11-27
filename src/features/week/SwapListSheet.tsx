import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { formatAmount, unitCount } from '@/data/amounts'
import type { SwapListChange } from '@/data/swap-list'
import type { Id, ItemChoice, Unit } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { ChoiceButtons } from './ApproveSheet'

type SwapListSheetProps = {
  open: boolean
  title: string
  week: number
  change: SwapListChange | null
  ingredientName: (id: Id) => string
  onChoice: (key: string, choice: ItemChoice) => void
  onKeep: (key: string, keep: boolean) => void
  onConfirm: () => void
  onClose: () => void
}

/**
 * The shopping list after a dish is swapped in an approved week (3E, #173
 * point 6, #197): what comes on the list, what comes off, and what is already
 * bought. "Not now" leaves the list as it is; the banner "The plan has
 * changed" then stays.
 */
export function SwapListSheet({ open, title, week, change, ingredientName, onChoice, onKeep, onConfirm, onClose }: SwapListSheetProps) {
  const { t } = useTranslation()
  const language = useLanguage()
  const amountText = (amount: number | undefined, unit: Unit, plus = false) =>
    amount ? `${plus ? '+' : ''}${formatAmount(amount, language)} ${t(`units.short.${unit}`, { count: unitCount(amount) })}` : undefined
  const add = change?.add ?? []
  const remove = change?.remove ?? []
  const bought = change?.bought ?? []
  const added = add.filter((r) => r.choice === 'buy' && !r.alreadyBuying).length
  const removed = remove.filter((r) => !r.keep).length
  const counts = [added > 0 ? `+${added}` : null, removed > 0 ? `−${removed}` : null].filter(Boolean).join(' · ')

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={title}
      description={t('week.swapList.intro', { week })}
      footer={
        <>
          <Button onClick={onConfirm}>{counts ? t('week.swapList.confirmCounts', { counts }) : t('week.swapList.confirm')}</Button>
          <Button variant="ghost" onClick={onClose}>
            {t('week.swapList.notNow')}
          </Button>
        </>
      }
    >
      {add.length > 0 ? (
        <Section title={t('week.swapList.addTitle')}>
          {add.map((row) => {
            const name = ingredientName(row.ingredientId)
            const amount = row.isStaple ? undefined : amountText(row.amount, row.unit, row.alreadyBuying)
            return (
              <li key={row.key} className="flex min-h-11 items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{name}</span>
                  {amount ? <span className="text-muted-foreground"> · {amount}</span> : null}
                  {row.alreadyBuying ? <p className="text-sm text-muted-foreground">{t('week.swapList.more')}</p> : null}
                  {!row.alreadyBuying && row.atHome ? <p className="text-sm text-muted-foreground">{t('week.approve.atHome')}</p> : null}
                </div>
                {row.alreadyBuying ? null : <ChoiceButtons name={name} choice={row.choice} onChoice={(c) => onChoice(row.key, c)} />}
              </li>
            )
          })}
        </Section>
      ) : null}

      {remove.length > 0 ? (
        <Section title={t('week.swapList.removeTitle')}>
          {remove.map((row) => {
            const name = ingredientName(row.ingredientId)
            const amount = amountText(row.amount, row.unit)
            return (
              <li key={row.key} className="flex min-h-11 items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <span className={row.keep ? 'font-medium' : 'font-medium text-muted-foreground line-through'}>{name}</span>
                  {amount ? <span className="text-muted-foreground"> · {amount}</span> : null}
                  {row.keep ? <p className="text-sm text-muted-foreground">{t('week.swapList.keptHint')}</p> : null}
                </div>
                <Button
                  variant={row.keep ? 'default' : 'outline'}
                  aria-pressed={row.keep}
                  aria-label={t('week.swapList.keepLabel', { name })}
                  onClick={() => onKeep(row.key, !row.keep)}
                >
                  {row.keep ? t('week.swapList.kept') : t('week.swapList.keep')}
                </Button>
              </li>
            )
          })}
        </Section>
      ) : null}

      {bought.length > 0 ? (
        <Section title={t('week.swapList.boughtTitle')}>
          {bought.map((row) => (
            <li key={row.key} className="py-2">
              <span className="font-medium">{ingredientName(row.ingredientId)}</span>
              <span className="text-muted-foreground"> · {amountText(row.amount, row.unit)}</span>
              <p className="text-sm text-muted-foreground">{t('week.swapList.boughtHint')}</p>
            </li>
          ))}
        </Section>
      ) : null}
    </BottomSheet>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <ul className="divide-y">{children}</ul>
    </section>
  )
}
