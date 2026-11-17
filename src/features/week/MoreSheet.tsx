import { HeartIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/ui/bottom-sheet'

type MoreSheetProps = {
  open: boolean
  title: string
  /** "Make week plan" or "Fill in empty", depending on the week (#121). */
  action: string
  /** Some meals from today on are empty. */
  canFill: boolean
  /** Something is planned – it can be replaced (with confirmation). */
  canReplace: boolean
  onClose: () => void
  onFill: (favoritesOnly: boolean) => void
  onReplace: (favoritesOnly: boolean) => void
}

/** "⋯ More": fill with all dishes or favourites only (#123), or start over (#121). */
export function MoreSheet({ open, title, action, canFill, canReplace, onClose, onFill, onReplace }: MoreSheetProps) {
  const { t } = useTranslation()
  return (
    <BottomSheet open={open} onOpenChange={(o) => (o ? undefined : onClose())} title={title}>
      <ul className="space-y-2">
        {canFill ? (
          <>
            <Option icon={<SparklesIcon />} label={t('week.withAll', { action })} onClick={() => onFill(false)} />
            <Option icon={<HeartIcon />} label={t('week.withFavorites', { action })} hint={t('week.favoritesHint')} onClick={() => onFill(true)} />
          </>
        ) : null}
        {canReplace ? (
          <>
            <Option icon={<RefreshCwIcon />} label={t('week.replace')} hint={t('week.replaceHint')} onClick={() => onReplace(false)} />
            <Option icon={<HeartIcon />} label={t('week.replaceFavorites')} hint={`${t('week.replaceHint')} ${t('week.favoritesHint')}`} onClick={() => onReplace(true)} />
          </>
        ) : null}
      </ul>
    </BottomSheet>
  )
}

function Option({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint?: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-14 w-full items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-left outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring [&_svg]:mt-0.5 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-primary-text"
      >
        <span aria-hidden>{icon}</span>
        <span>
          <span className="block font-semibold">{label}</span>
          {hint ? <span className="block text-sm text-muted-foreground">{hint}</span> : null}
        </span>
      </button>
    </li>
  )
}
