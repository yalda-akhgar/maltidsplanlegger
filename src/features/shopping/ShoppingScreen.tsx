import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { formatAmount, unitCount } from '@/data/amounts'
import { localize } from '@/data/localize'
import { repository } from '@/data/repository'
import { STORE_SECTIONS, type ShoppingItem } from '@/data/types'
import { useRecipeData } from '@/features/recipes/useRecipeData'
import { weekNumber } from '@/features/week/week-format'
import { useLanguage } from '@/i18n/useLanguage'

/**
 * Simple shopping list (#186 point 7): the items from approved weeks, grouped
 * by store section. Ticking off and own items come in milestone 3C.
 */
export function ShoppingScreen() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { data } = useRecipeData()
  const [items, setItems] = useState<ShoppingItem[] | null>(null)

  useEffect(() => {
    void repository.listShoppingItems().then(setItems)
  }, [])

  if (!data || !items) return <PageHeader title={t('screens.shopping.title')} />

  const open = items.filter((i) => !i.bought)
  const nameOf = (item: ShoppingItem) => item.customName ?? localize(item.ingredientId ? data.ingredientMap.get(item.ingredientId)?.name : undefined, language)
  const sectionOf = (item: ShoppingItem) => (item.ingredientId ? data.ingredientMap.get(item.ingredientId)?.storeSection : undefined)
  const sections = STORE_SECTIONS.map((section) => ({
    section,
    items: open.filter((i) => sectionOf(i) === section).sort((a, b) => nameOf(a).localeCompare(nameOf(b), language)),
  })).filter((s) => s.items.length > 0)
  const weeks = new Set(open.map((i) => i.weekId).filter(Boolean))

  return (
    <>
      <PageHeader title={t('screens.shopping.title')} />
      {open.length === 0 ? (
        <div className="rounded-2xl bg-secondary p-4 text-sm">{t('shopping.empty')}</div>
      ) : (
        <div className="space-y-4">
          {sections.map(({ section, items }) => (
            <section key={section}>
              <h2 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(`storeSections.${section}`)}</h2>
              <ul className="divide-y rounded-2xl border bg-card px-4">
                {items.map((item) => (
                  <li key={item.id} className="flex min-h-11 items-center justify-between gap-3 py-2">
                    <span>
                      <span className="font-medium">{nameOf(item)}</span>
                      {item.amount !== undefined && item.unit ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · {formatAmount(item.amount, language)} {t(`units.short.${item.unit}`, { count: unitCount(item.amount) })}
                        </span>
                      ) : null}
                    </span>
                    {/* The week label only matters when the list has items from more than one week (#184 point 8). */}
                    {item.weekId && weeks.size > 1 ? (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                        {t('shopping.weekLabel', { week: weekNumber(item.weekId) })}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="text-sm text-muted-foreground">{t('shopping.comingSoon')}</p>
        </div>
      )}
    </>
  )
}
