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
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  )
}
