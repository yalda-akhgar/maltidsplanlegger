import { ArrowLeftIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { repository } from '@/data/repository'
import type { HouseholdSettings, Ingredient } from '@/data/types'

/** Goes back to the settings list (in history if we came from there). */
export function useBackToSettings() {
  const navigate = useNavigate()
  const location = useLocation()
  return () => (location.key !== 'default' ? navigate(-1) : navigate('/settings', { replace: true }))
}

/** A settings sub-page (#163): back button, heading, content and an optional sticky Save bar. */
export function SettingsPage({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { t } = useTranslation()
  const back = useBackToSettings()
  return (
    <>
      <Button variant="ghost" className="mb-2 -ml-3" onClick={back}>
        <ArrowLeftIcon aria-hidden />
        {t('settings.title')}
      </Button>
      <PageHeader title={title} />
      <div className="space-y-5">{children}</div>
      {footer ? (
        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] mt-6 flex gap-2 bg-background py-3 lg:bottom-0">{footer}</div>
      ) : null}
    </>
  )
}

/** Loads the household (and the ingredients, for children's dislikes). */
export function useHouseholdData() {
  const [data, setData] = useState<{ household: HouseholdSettings; ingredients: Ingredient[] } | null>(null)
  useEffect(() => {
    let active = true
    void Promise.all([repository.getHousehold(), repository.listIngredients()]).then(
      ([household, ingredients]) => active && setData({ household, ingredients }),
    )
    return () => {
      active = false
    }
  }, [])
  return data
}
