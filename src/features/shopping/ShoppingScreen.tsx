import { ShoppingCartIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/components/ComingSoon'
import { PageHeader } from '@/components/PageHeader'

export function ShoppingScreen() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('screens.shopping.title')} />
      <ComingSoon icon={ShoppingCartIcon} description={t('screens.shopping.description')} />
    </>
  )
}
