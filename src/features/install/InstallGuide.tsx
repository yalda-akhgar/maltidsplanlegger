import { CheckCircle2Icon, DownloadIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { promptInstall, useInstallMode } from './install-prompt'

/** Device-specific instructions for adding the app to the home screen. */
export function InstallGuide() {
  const { t } = useTranslation()
  const mode = useInstallMode()

  if (mode === 'installed') {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <CheckCircle2Icon className="size-5 shrink-0 text-primary-text" aria-hidden />
        {t('install.installed')}
      </p>
    )
  }

  if (mode === 'prompt') {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground">{t('install.promptText')}</p>
        <Button
          onClick={async () => {
            if (await promptInstall()) toast.success(t('install.installedToast'))
          }}
        >
          <DownloadIcon data-icon="inline-start" />
          {t('install.installButton')}
        </Button>
      </div>
    )
  }

  const steps =
    mode === 'ios'
      ? [t('install.iosStep1'), t('install.iosStep2'), t('install.iosStep3')]
      : [t('install.manualStep1'), t('install.manualStep2')]

  return (
    <div className="space-y-3">
      <p className="font-medium">{mode === 'ios' ? t('install.iosTitle') : t('install.manualTitle')}</p>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      {mode === 'manual' ? <p className="text-sm text-muted-foreground">{t('install.manualNote')}</p> : null}
    </div>
  )
}
