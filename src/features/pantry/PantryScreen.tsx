import { EllipsisIcon, ListPlusIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { ViewToggle, type ListView } from '@/components/ViewToggle'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TwoChoice } from '@/components/ui/two-choice'
import { localize } from '@/data/localize'
import { addEmptyToShopping, addTypedToPantry, HOME_CATEGORIES, homeCategory, togglePantryIngredient } from '@/data/pantry'
import { newId, repository } from '@/data/repository'
import type { Id, PantryItem } from '@/data/types'
import { useRecipeData } from '@/features/recipes/useRecipeData'
import { useLanguage } from '@/i18n/useLanguage'
import { toast } from '@/lib/toast'
import { PickFromListSheet } from './PickFromListSheet'

/**
 * Home (milestone 3D, #178, #194): what the household has at home, "Have" or
 * "Empty". Filled by ticking items off on the shopping list; items can also be
 * typed freely or picked from the list. "Empty" puts the item on the
 * shopping list. Nothing leaves Home by itself.
 */
export function PantryScreen() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { data } = useRecipeData()
  const [items, setItems] = useState<PantryItem[] | null>(null)
  const [view, setView] = useState<ListView>(() => repository.getListView('pantry'))
  const [text, setText] = useState('')
  const [pickOpen, setPickOpen] = useState(false)
  const [editId, setEditId] = useState<Id | null>(null)
  const inputId = 'pantry-add'

  // The ref mirrors the latest list for toast buttons, which run after later changes.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  })

  useEffect(() => {
    let active = true
    void repository.listPantry().then((stored) => active && setItems(stored))
    return () => {
      active = false
    }
  }, [])

  if (!data || !items) return <PageHeader title={t('screens.pantry.title')} />

  const ingredientOf = (item: PantryItem) => (item.ingredientId ? data.ingredientMap.get(item.ingredientId) : undefined)
  const nameOf = (item: PantryItem) => item.customName ?? localize(ingredientOf(item)?.name, language)
  const byName = (list: PantryItem[]) => [...list].sort((a, b) => nameOf(a).localeCompare(nameOf(b), language))
  const groups = HOME_CATEGORIES.map((category) => ({
    category,
    items: byName(items.filter((i) => homeCategory(ingredientOf(i), i.customName) === category)),
  })).filter((g) => g.items.length > 0)
  const haveCount = items.filter((i) => i.status === 'have').length
  const editing = items.find((i) => i.id === editId) ?? null

  function persist(next: PantryItem[]) {
    itemsRef.current = next
    setItems(next)
    void repository.savePantry(next)
  }

  // --- Typing freely (#194 point 4) ---------------------------------------------------------

  function add(event?: FormEvent) {
    event?.preventDefault()
    if (!text.trim()) return
    const result = addTypedToPantry(itemsRef.current ?? [], text, { ingredients: data!.ingredients, now: new Date().toISOString(), newId })
    persist(result.items)
    setText('')
    const parts: string[] = []
    const changed = [...result.added, ...result.restocked]
    if (changed.length > 0) parts.push(t('pantry.added', { count: changed.length, name: nameOf(changed[0]) }))
    if (result.duplicates.length > 0) parts.push(t('pantry.alreadyHave', { names: result.duplicates.map(nameOf).join(', ') }))
    if (parts.length > 0) toast(parts.join(' · '))
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      add()
    }
  }

  // --- "Have" / "Empty" (#194 point 3) --------------------------------------------------------

  async function setStatus(item: PantryItem, status: PantryItem['status']) {
    if (item.status === status) return
    const before = itemsRef.current ?? []
    const now = new Date().toISOString()
    persist(before.map((i) => (i.id === item.id ? { ...i, status, updatedAt: now } : i)))
    if (status !== 'empty') return
    // "Empty" puts the item on the shopping list right away, with Undo.
    const [list, memory] = await Promise.all([repository.listShoppingItems(), repository.getSectionMemory()])
    const { items: nextList, added } = addEmptyToShopping(list, item, { memory, now, newId })
    if (added) await repository.saveShoppingItems(nextList)
    toast(added ? t('pantry.toList', { name: nameOf(item) }) : t('pantry.alreadyOnList', { name: nameOf(item) }), {
      duration: 6000,
      action: {
        label: t('common.undo'),
        onClick: () => {
          persist((itemsRef.current ?? []).map((i) => (i.id === item.id ? { ...i, status: item.status } : i)))
          if (added) void repository.listShoppingItems().then((l) => repository.saveShoppingItems(l.filter((i) => i.id !== added.id)))
        },
      },
    })
  }

  // --- Removing an item -----------------------------------------------------------------------

  function remove(item: PantryItem) {
    const before = itemsRef.current ?? []
    persist(before.filter((i) => i.id !== item.id))
    setEditId(null)
    toast(t('pantry.removed', { name: nameOf(item) }), {
      duration: 8000,
      action: { label: t('common.undo'), onClick: () => persist([...(itemsRef.current ?? []), item]) },
    })
  }

  // --- Rendering ------------------------------------------------------------------------------

  const row = (item: PantryItem) => {
    const name = nameOf(item)
    return (
      <li key={item.id} className="flex min-h-12 items-center gap-2 py-1.5">
        <span className="min-w-0 flex-1 font-medium break-words">{name}</span>
        <TwoChoice
          label={t('pantry.choiceLabel', { name })}
          options={[
            { value: 'have', label: t('pantry.have') },
            { value: 'empty', label: t('pantry.empty') },
          ]}
          value={item.status}
          onChange={(status) => void setStatus(item, status)}
        />
        <Button variant="ghost" size="icon" className="shrink-0" aria-label={t('pantry.edit', { name })} onClick={() => setEditId(item.id)}>
          <EllipsisIcon />
        </Button>
      </li>
    )
  }

  return (
    <>
      <PageHeader
        title={t('screens.pantry.title')}
        subtitle={items.length > 0 ? t('pantry.summary', { have: haveCount, empty: items.length - haveCount }) : undefined}
      />

      <form onSubmit={add} className="mb-3">
        <label htmlFor={inputId} className="sr-only">
          {t('pantry.addLabel')}
        </label>
        <div className="flex items-start gap-2">
          <Textarea
            id={inputId}
            rows={1}
            value={text}
            placeholder={t('pantry.addPlaceholder')}
            aria-describedby={`${inputId}-hint`}
            enterKeyHint="enter"
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            className="min-h-11 resize-none [field-sizing:content]"
          />
          <Button type="submit" className="shrink-0" disabled={!text.trim()}>
            <PlusIcon aria-hidden />
            {t('pantry.addButton')}
          </Button>
        </div>
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-muted-foreground">
          {t('pantry.addHint')}
        </p>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" onClick={() => setPickOpen(true)}>
          <ListPlusIcon aria-hidden />
          {t('pantry.pick.open')}
        </Button>
        {items.length > 0 ? (
          <ViewToggle
            value={view}
            onChange={(next) => {
              setView(next)
              repository.setListView('pantry', next)
            }}
          />
        ) : null}
      </div>

      {items.length === 0 ? <div className="rounded-2xl bg-secondary p-4 text-sm">{t('pantry.emptyState')}</div> : null}

      {view === 'list' && items.length > 0 ? <ul className="divide-y rounded-2xl border bg-card px-3">{byName(items).map(row)}</ul> : null}
      {view === 'categories' ? (
        <div className="space-y-4">
          {groups.map(({ category, items: groupItems }) => (
            <section key={category} aria-labelledby={`home-${category}`}>
              <h2 id={`home-${category}`} className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t(`pantry.categories.${category}`)}
              </h2>
              <ul className="divide-y rounded-2xl border bg-card px-3">{groupItems.map(row)}</ul>
            </section>
          ))}
        </div>
      ) : null}

      <PickFromListSheet
        open={pickOpen}
        ingredients={data.ingredients}
        inHome={new Set(items.map((i) => i.ingredientId).filter((id): id is Id => !!id))}
        onToggle={(ingredientId) => persist(togglePantryIngredient(itemsRef.current ?? [], ingredientId, new Date().toISOString(), newId))}
        onClose={() => setPickOpen(false)}
      />

      <BottomSheet open={editing !== null} onOpenChange={(o) => (o ? undefined : setEditId(null))} title={editing ? nameOf(editing) : ''}>
        <Button variant="ghost" className="w-full text-destructive" onClick={() => editing && remove(editing)}>
          <Trash2Icon aria-hidden />
          {t('pantry.remove')}
        </Button>
      </BottomSheet>
    </>
  )
}
