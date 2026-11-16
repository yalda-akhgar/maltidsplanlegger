import { SmartphoneIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { repository } from '@/data/repository'
import { InstallGuide } from './InstallGuide'
import { promptInstall, useInstallMode } from './install-prompt'

/** Dismissible card on the Week screen suggesting to install the app. */
export function InstallCard() {
  const { t } = useTranslation()
  const mode = useInstallMode()
  const [dismissed, setDismissed] = useState(() => repository.isInstallCardDismissed())
  const [guideOpen, setGuideOpen] = useState(false)

  if (dismissed || mode === 'installed') return null

  const dismiss = () => {
    repository.dismissInstallCard()
    setDismissed(true)
  }

  return (
    <section className="relative mb-6 rounded-2xl border border-accent bg-secondary p-4 pr-12">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 rounded-full text-muted-foreground"
        onClick={dismiss}
        aria-label={t('install.notNow')}
      >
        <XIcon />
      </Button>
      <div className="flex gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <SmartphoneIcon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="font-semibold">{t('install.cardTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('install.cardText')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {mode === 'prompt' ? (
              <Button
                onClick={async () => {
                  if (await promptInstall()) toast.success(t('install.installedToast'))
                }}
              >
                {t('install.installButton')}
              </Button>
            ) : (
              <Button onClick={() => setGuideOpen(true)}>{t('install.showHow')}</Button>
            )}
            <Button variant="ghost" onClick={dismiss}>
              {t('install.notNow')}
            </Button>
          </div>
        </div>
      </div>
      <BottomSheet open={guideOpen} onOpenChange={setGuideOpen} title={t('install.cardTitle')}>
        <InstallGuide />
      </BottomSheet>
    </section>
  )
}
