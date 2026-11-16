import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

type ComingSoonProps = {
  icon: LucideIcon
  description: string
}

/** Friendly placeholder for screens that are planned for a later phase. */
export function ComingSoon({ icon: Icon, description }: ComingSoonProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-8" aria-hidden />
      </div>
      <Badge variant="secondary" className="mb-3 h-auto px-3 py-1 text-sm">
        {t('common.comingSoon')}
      </Badge>
      <p className="max-w-sm text-muted-foreground">{description}</p>
    </div>
  )
}
