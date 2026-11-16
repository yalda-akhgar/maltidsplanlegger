import { HeartIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

/** Development-only overview of the base components (route /design). */
export function DesignPreview() {
  const { t } = useTranslation()
  const [chip, setChip] = useState('all')
  const [switchOn, setSwitchOn] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const chips = [
    ['all', 'designPreview.chipAll'],
    ['breakfast', 'designPreview.chipBreakfast'],
    ['dinner', 'designPreview.chipDinner'],
    ['favorites', 'designPreview.chipFavorites'],
  ] as const

  return (
    <>
      <PageHeader title={t('designPreview.title')} subtitle={t('designPreview.subtitle')} />
      <div className="space-y-8">
        <Group title={t('designPreview.buttons')}>
          <div className="flex flex-wrap gap-2">
            <Button>{t('designPreview.primary')}</Button>
            <Button variant="secondary">{t('designPreview.secondary')}</Button>
            <Button variant="outline">{t('designPreview.outline')}</Button>
            <Button variant="ghost">{t('designPreview.ghost')}</Button>
            <Button variant="destructive">{t('designPreview.destructive')}</Button>
            <Button size="icon" variant="outline" aria-label="↻">
              <RefreshCwIcon />
            </Button>
          </div>
        </Group>

        <Group title={t('designPreview.card')}>
          <Card>
            <CardHeader>
              <CardTitle>{t('designPreview.cardTitle')}</CardTitle>
              <CardDescription>{t('designPreview.cardText')}</CardDescription>
              <CardAction>
                <Button size="icon" variant="ghost" aria-label="♥">
                  <HeartIcon className="fill-primary text-primary" />
                </Button>
              </CardAction>
            </CardHeader>
          </Card>
        </Group>

        <Group title={t('designPreview.chips')}>
          <div className="flex flex-wrap gap-2">
            {chips.map(([value, key]) => (
              <Chip key={value} selected={chip === value} onClick={() => setChip(value)}>
                {t(key)}
              </Chip>
            ))}
          </div>
        </Group>

        <Group title={t('designPreview.input')}>
          <Input placeholder={t('designPreview.inputPlaceholder')} />
        </Group>

        <Group title={t('designPreview.switchLabel')}>
          <div className="flex items-center gap-4">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} aria-label={t('designPreview.switchLabel')} />
            <Badge>{t('designPreview.badge')}</Badge>
            <Badge variant="secondary">{t('designPreview.badge')}</Badge>
          </div>
        </Group>

        <Group title={t('designPreview.sheet')}>
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            {t('designPreview.openSheet')}
          </Button>
          <BottomSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            title={t('designPreview.sheetTitle')}
            footer={<Button onClick={() => setSheetOpen(false)}>{t('common.close')}</Button>}
          >
            <p className="text-muted-foreground">{t('designPreview.sheetText')}</p>
          </BottomSheet>
        </Group>

        <Group title={t('designPreview.toast')}>
          <Button variant="outline" onClick={() => toast.success(t('designPreview.toastText'))}>
            {t('designPreview.showToast')}
          </Button>
        </Group>
      </div>
    </>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  )
}
