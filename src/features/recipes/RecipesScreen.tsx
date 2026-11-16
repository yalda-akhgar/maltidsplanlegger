import { BookOpenIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/components/ComingSoon'
import { PageHeader } from '@/components/PageHeader'

export function RecipesScreen() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('screens.recipes.title')} />
      <ComingSoon icon={BookOpenIcon} description={t('screens.recipes.description')} />
    </>
  )
}
