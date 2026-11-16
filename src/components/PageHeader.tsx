import { useEffect } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'

type PageHeaderProps = {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}

/** Page heading (the screen's only h1). Also sets the browser tab title (WCAG 2.4.2). */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const { t } = useTranslation()
  const appName = t('app.name')

  useEffect(() => {
    document.title = `${title} – ${appName}`
  }, [title, appName])

  return (
    // The actions wrap below the title on narrow screens instead of squeezing it.
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="max-w-full shrink-0 grow">
        <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
