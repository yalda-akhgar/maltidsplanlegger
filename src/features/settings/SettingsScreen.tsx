import { useTheme } from 'next-themes'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Chip } from '@/components/ui/chip'
import { repository } from '@/data/repository'
import { LANGUAGES, type Language } from '@/data/types'
import { InstallGuide } from '@/features/install/InstallGuide'

const THEMES = ['system', 'light', 'dark'] as const

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border bg-card p-4 sm:p-5">
      <h2 id={id} className="mb-3 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function SettingsScreen() {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const changeLanguage = (language: Language) => {
    repository.setLanguage(language)
    void i18n.changeLanguage(language)
  }

  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="space-y-4">
        <Section id="settings-language" title={t('settings.language.title')}>
          <div role="group" aria-labelledby="settings-language" className="flex flex-wrap gap-2">
            {LANGUAGES.map((language) => (
              <Chip
                key={language}
                lang={language}
                selected={i18n.language === language}
                onClick={() => changeLanguage(language)}
              >
                {t(`languages.${language}`)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section id="settings-appearance" title={t('settings.appearance.title')}>
          <div role="group" aria-labelledby="settings-appearance" className="flex flex-wrap gap-2">
            {THEMES.map((value) => (
              <Chip key={value} selected={(theme ?? 'system') === value} onClick={() => setTheme(value)}>
                {t(`settings.appearance.${value}`)}
              </Chip>
            ))}
          </div>
        </Section>

        <Section id="settings-install" title={t('settings.install.title')}>
          <InstallGuide />
        </Section>
      </div>
    </>
  )
}
