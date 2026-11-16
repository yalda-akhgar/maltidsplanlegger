import { CalendarDaysIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ComingSoon } from '@/components/ComingSoon'
import { PageHeader } from '@/components/PageHeader'
import { InstallCard } from '@/features/install/InstallCard'

export function WeekScreen() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('screens.week.title')} />
      <InstallCard />
      <ComingSoon icon={CalendarDaysIcon} description={t('screens.week.description')} />
    </>
  )
}
