/**
 * Settings pages that save right away (#163): automatic week plan (#164),
 * language, appearance and "Add to home screen".
 */
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/components/ui/chip'
import { Switch } from '@/components/ui/switch'
import { repository } from '@/data/repository'
import { LANGUAGES, type AutoWeekPlan, type HouseholdSettings, type Language } from '@/data/types'
import { WeekdayPicker } from '@/features/household/FoodAndWeekFields'
import { InstallGuide } from '@/features/install/InstallGuide'
import { SettingsPage, useHouseholdData } from './SettingsPage'

const DEFAULT_AUTO: AutoWeekPlan = { enabled: false, weekday: 6, favoritesOnly: false }

export function AutoPlanSettings() {
  const data = useHouseholdData()
  return data ? <AutoPlanForm household={data.household} /> : null
}

function AutoPlanForm({ household }: { household: HouseholdSettings }) {
  const { t } = useTranslation()
  const [auto, setAuto] = useState<AutoWeekPlan>(household.autoWeekPlan ?? DEFAULT_AUTO)
  const update = (patch: Partial<AutoWeekPlan>) => {
    const next = { ...auto, ...patch }
    setAuto(next)
    void repository.saveHousehold({ ...household, autoWeekPlan: next })
  }

  return (
    <SettingsPage title={t('settings.autoPlan.title')}>
      <div className="space-y-4 rounded-2xl border bg-card p-4">
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span className="font-medium">{t('settings.autoPlan.enabled')}</span>
          <Switch checked={auto.enabled} onCheckedChange={(enabled) => update({ enabled })} />
        </label>
        {auto.enabled ? (
          <>
            <div className="space-y-2">
              <p className="font-medium">{t('settings.autoPlan.day')}</p>
              <WeekdayPicker label={t('settings.autoPlan.day')} value={[auto.weekday]} onChange={([weekday]) => update({ weekday })} single />
            </div>
            <div className="space-y-2">
              <p id="auto-with" className="font-medium">
                {t('settings.autoPlan.with')}
              </p>
              <div role="group" aria-labelledby="auto-with" className="flex flex-wrap gap-2">
                <Chip selected={!auto.favoritesOnly} onClick={() => update({ favoritesOnly: false })}>
                  {t('settings.autoPlan.all')}
                </Chip>
                <Chip selected={auto.favoritesOnly} onClick={() => update({ favoritesOnly: true })}>
                  {t('settings.autoPlan.favorites')}
                </Chip>
              </div>
            </div>
          </>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        {auto.enabled ? t('settings.autoPlan.hint', { day: t(`household.weekdays.long.${auto.weekday}`).toLocaleLowerCase() }) : t('settings.autoPlan.offHint')}
      </p>
    </SettingsPage>
  )
}

export function LanguageSettings() {
  const { t, i18n } = useTranslation()
  const changeLanguage = (language: Language) => {
    repository.setLanguage(language)
    void i18n.changeLanguage(language)
  }
  return (
    <SettingsPage title={t('settings.language.title')}>
      <div role="group" aria-label={t('settings.language.title')} className="flex flex-wrap gap-2">
        {LANGUAGES.map((language) => (
          <Chip key={language} lang={language} selected={i18n.language === language} onClick={() => changeLanguage(language)}>
            {t(`languages.${language}`)}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t('settings.language.hint')}</p>
    </SettingsPage>
  )
}

export const THEMES = ['system', 'light', 'dark'] as const

export function AppearanceSettings() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  return (
    <SettingsPage title={t('settings.appearance.title')}>
      <div role="group" aria-label={t('settings.appearance.title')} className="flex flex-wrap gap-2">
        {THEMES.map((value) => (
          <Chip key={value} selected={(theme ?? 'system') === value} onClick={() => setTheme(value)}>
            {t(`settings.appearance.${value}`)}
          </Chip>
        ))}
      </div>
    </SettingsPage>
  )
}

export function InstallSettings() {
  const { t } = useTranslation()
  return (
    <SettingsPage title={t('settings.install.title')}>
      <InstallGuide />
    </SettingsPage>
  )
}
