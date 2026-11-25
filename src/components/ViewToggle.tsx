import { useTranslation } from 'react-i18next'
import { TwoChoice } from '@/components/ui/two-choice'

export type ListView = 'list' | 'categories'

/** "List | Categories" – the same switch on Home and the shopping list (#194 point 2). */
export function ViewToggle({ value, onChange }: { value: ListView; onChange: (view: ListView) => void }) {
  const { t } = useTranslation()
  return (
    <TwoChoice
      label={t('listView.label')}
      options={[
        { value: 'list', label: t('listView.list') },
        { value: 'categories', label: t('listView.categories') },
      ]}
      value={value}
      onChange={onChange}
    />
  )
}
