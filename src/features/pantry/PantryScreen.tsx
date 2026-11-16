import { RefrigeratorIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/components/ComingSoon'
import { PageHeader } from '@/components/PageHeader'

export function PantryScreen() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('screens.pantry.title')} />
      <ComingSoon icon={RefrigeratorIcon} description={t('screens.pantry.description')} />
    </>
  )
}
