import { ChevronRightIcon, RotateCcwIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { repository } from '@/data/repository'
import { MEAL_SLOTS, type HouseholdSettings } from '@/data/types'
import { selfOf } from '@/features/household/household-draft'
import { useHouseholdData } from './SettingsPage'

/** Settings as a grouped list of sub-pages (#163). */
export function SettingsScreen() {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const data = useHouseholdData()
  const [alerts, setAlerts] = useState(() => repository.getProteinAlertsSync())

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="space-y-6">
        {data ? <FamilyGroup household={data.household} /> : null}

        <Group title={t('settings.groups.weekPlan')}>
          <li>
            <label className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
              <span>
                <span className="block font-medium">{t('settings.alerts.title')}</span>
                <span className="block text-sm text-muted-foreground">{t('settings.alerts.hint')}</span>
              </span>
              <Switch
                checked={alerts}
                onCheckedChange={(on) => {
                  setAlerts(on)
                  repository.setProteinAlerts(on)
                }}
              />
            </label>
          </li>
          {data ? (
            <>
              <Row
                to="/settings/auto-plan"
                title={t('settings.autoPlan.title')}
                hint={
                  data.household.autoWeekPlan?.enabled
                    ? t('settings.autoPlan.summary', { day: t(`household.weekdays.long.${data.household.autoWeekPlan.weekday}`) })
                    : t('settings.autoPlan.off')
                }
              />
              <Row to="/settings/split" title={t('settings.split.title')} hint={MEAL_SLOTS.map((s) => data.household.proteinSplit[s]).join(' / ') + ' %'} />
            </>
          ) : null}
        </Group>

        <Group title={t('settings.groups.app')}>
          <Row to="/settings/language" title={t('settings.language.title')} hint={t(`languages.${i18n.language}`)} />
          <Row to="/settings/appearance" title={t('settings.appearance.title')} hint={t(`settings.appearance.${theme ?? 'system'}`)} />
          <Row to="/settings/install" title={t('settings.install.title')} />
        </Group>

        <Button variant="secondary" asChild>
          <Link to="/welcome?again=1">
            <RotateCcwIcon aria-hidden />
            {t('settings.runWizard')}
          </Link>
        </Button>
      </div>
    </>
  )
}

function FamilyGroup({ household }: { household: HouseholdSettings }) {
  const { t } = useTranslation()
  const self = selfOf(household)
  const adults = household.people.filter((p) => p.kind === 'adult').length
  const children = household.people.length - adults
  const excluded = [...(household.excludedTags.includes('pork') ? [t('household.food.pork')] : []), ...household.excludedTerms]
  return (
    <Group title={t('settings.groups.family')}>
      <Row
        to="/settings/profile"
        title={t('settings.profile.title')}
        hint={self ? (self.proteinTargetG ? t('settings.profile.summary', { name: self.name, target: self.proteinTargetG }) : self.name) : t('settings.profile.empty')}
      />
      <Row to="/settings/household" title={t('settings.household.title')} hint={t('settings.household.summary', { adults, children })} />
      <Row
        to="/settings/food-week"
        title={t('settings.foodWeek.title')}
        hint={excluded.length > 0 ? t('settings.foodWeek.summary', { list: excluded.join(', ') }) : t('settings.foodWeek.summaryNone')}
      />
    </Group>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `group-${title}`
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">{children}</ul>
    </section>
  )
}

function Row({ to, title, hint }: { to: string; title: string; hint?: string }) {
  return (
    <li>
      <Link
        to={to}
        className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          {hint ? <span className="block truncate text-sm text-muted-foreground">{hint}</span> : null}
        </span>
        <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}
