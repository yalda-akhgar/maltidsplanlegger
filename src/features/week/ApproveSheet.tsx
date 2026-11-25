import { ChevronDownIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { formatAmount, unitCount } from '@/data/amounts'
import type { ApprovalRow } from '@/data/shopping'
import { STORE_SECTIONS, type Id, type ItemChoice, type Language, type StoreSection } from '@/data/types'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/useLanguage'
import { weekdayName } from './week-format'

type ApproveSheetProps = {
  open: boolean
  week: number
  rows: ApprovalRow[]
  /** The week was approved before: the sheet shows the saved choices and updates the list (#186 point 8). */
  again: boolean
  /** The week has started: only today and the rest of the week count (#185 F). */
  fromToday: boolean
  ingredientName: (id: Id) => string
  recipeName: (id: Id) => string
  onChoice: (index: number, choice: ItemChoice) => void
  onConfirm: () => void
  onSkip: () => void
  onClose: () => void
}

/** "Approve week plan" (#173, #184, #186): every item the week needs, with "Have" / "Buy" per item. */
export function ApproveSheet({ open, week, rows, again, fromToday, ingredientName, recipeName, onChoice, onConfirm, onSkip, onClose }: ApproveSheetProps) {
  const { t } = useTranslation()
  const indexed = rows.map((row, index) => ({ row, index }))
  const sections = STORE_SECTIONS.map((section) => ({
    section,
    items: indexed.filter(({ row }) => !row.need.isStaple && row.need.storeSection === section),
  })).filter((s) => s.items.length > 0)
  const staples = indexed.filter(({ row }) => row.need.isStaple)
  const count = rows.filter((r) => r.choice === 'buy').length
  const mainLabel = again ? t('week.approve.update', { count }) : count > 0 ? t('week.approve.add', { count }) : t('week.approve.addNone')

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => (o ? undefined : onClose())}
      title={again ? t('week.approve.titleAgain', { week }) : t('week.approve.title', { week })}
      description={rows.length > 0 ? t('week.approve.intro') : undefined}
      footer={
        <>
          <Button onClick={onConfirm}>{mainLabel}</Button>
          {again ? null : (
            <Button variant="ghost" onClick={onSkip}>
              {t('week.approve.skip')}
            </Button>
          )}
        </>
      }
    >
      {fromToday ? <p className="mb-3 text-sm text-muted-foreground">{t('week.approve.fromToday')}</p> : null}
      {rows.length === 0 ? <p className="text-sm">{t('week.approve.nothing')}</p> : null}

      {sections.map(({ section, items }) => (
        <Section key={section} section={section}>
          {items.map(({ row, index }) => (
            <ItemRow key={`${row.need.ingredientId}|${row.need.unit}`} row={row} name={ingredientName(row.need.ingredientId)} recipeName={recipeName} onChoice={(c) => onChoice(index, c)} />
          ))}
        </Section>
      ))}

      {staples.length > 0 ? (
        <details className="group mt-4 rounded-2xl border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {t('week.approve.staples', { count: staples.length })}
            <ChevronDownIcon aria-hidden className="size-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-3">
            <p className="mb-2 text-sm text-muted-foreground">{t('week.approve.staplesHint')}</p>
            <ul className="divide-y">
              {staples.map(({ row, index }) => (
                <ItemRow key={`${row.need.ingredientId}|${row.need.unit}`} row={row} name={ingredientName(row.need.ingredientId)} recipeName={recipeName} onChoice={(c) => onChoice(index, c)} />
              ))}
            </ul>
          </div>
        </details>
      ) : null}
    </BottomSheet>
  )
}

function Section({ section, children }: { section: StoreSection; children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <section className="mb-4">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`storeSections.${section}`)}</h3>
      <ul className="divide-y">{children}</ul>
    </section>
  )
}

function ItemRow({ row, name, recipeName, onChoice }: { row: ApprovalRow; name: string; recipeName: (id: Id) => string; onChoice: (choice: ItemChoice) => void }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const [showUses, setShowUses] = useState(false)
  const { need } = row
  // Staples are shown without an amount, as on the shopping list (#187, #189).
  const amount = need.isStaple ? undefined : `${formatAmount(need.amount, language)} ${t(`units.short.${need.unit}`, { count: unitCount(need.amount) })}`
  return (
    <li className="py-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-expanded={showUses}
          aria-label={`${amount ? `${name} · ${amount}` : name}. ${t('week.approve.showUses', { name })}`}
          onClick={() => setShowUses((v) => !v)}
          className="min-h-11 min-w-0 flex-1 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-medium">{name}</span>
          {amount ? <span className="text-muted-foreground"> · {amount}</span> : null}
        </button>
        <ChoiceButtons name={name} choice={row.choice} onChoice={onChoice} />
      </div>
      {row.usedLastWeek ? <p className="text-sm text-muted-foreground">{t('week.approve.usedLastWeek')}</p> : null}
      {row.atHome && !row.usedLastWeek ? <p className="text-sm text-muted-foreground">{t('week.approve.atHome')}</p> : null}
      {showUses ? <p className="text-sm text-muted-foreground">{t('week.approve.usedIn', { list: usesText(row, recipeName, language, t) })}</p> : null}
    </li>
  )
}

/** "Chicken tikka (Mon), Wok (Thu)": every dish once, with the days it is cooked. */
function usesText(row: ApprovalRow, recipeName: (id: Id) => string, language: Language, t: (key: string) => string): string {
  const byName = new Map<string, string[]>()
  for (const use of row.need.uses) {
    const label = use.recipeId ? recipeName(use.recipeId) : t(`week.slots.${use.slot}`)
    const days = byName.get(label) ?? []
    const day = weekdayName(use.date, language).slice(0, 3)
    if (!days.includes(day)) days.push(day)
    byName.set(label, days)
  }
  return [...byName].map(([label, days]) => `${label} (${days.join(', ')})`).join(', ')
}

/** "Have" / "Buy": two buttons, the chosen one filled (#184 point 4). */
export function ChoiceButtons({ name, choice, onChoice }: { name: string; choice: ItemChoice; onChoice: (choice: ItemChoice) => void }) {
  const { t } = useTranslation()
  return (
    <div role="group" aria-label={t('week.approve.choiceLabel', { name })} className="flex shrink-0 rounded-xl border p-0.5">
      {(['have', 'buy'] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={choice === c}
          onClick={() => onChoice(c)}
          className={cn(
            'min-h-11 min-w-16 rounded-lg px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
            choice === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary',
          )}
        >
          {t(`week.approve.${c}`)}
        </button>
      ))}
    </div>
  )
}
