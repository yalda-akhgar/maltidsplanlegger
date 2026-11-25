import { CheckIcon, ChevronDownIcon, CircleIcon, EllipsisIcon, PlusIcon, Share2Icon } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatAmount, unitCount } from '@/data/amounts'
import { localize } from '@/data/localize'
import { newId, repository } from '@/data/repository'
import { memoryKey, type SectionMemory } from '@/data/shopping-input'
import { addTypedItems, clearBought, dropFinishedBought, groupBySection, sectionOf, setBought, shareText } from '@/data/shopping-list'
import type { Id, ShoppingItem } from '@/data/types'
import { weekIdOf } from '@/data/week'
import { useRecipeData } from '@/features/recipes/useRecipeData'
import { weekNumber } from '@/features/week/week-format'
import { useLanguage } from '@/i18n/useLanguage'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { ItemSheet, type ItemEdit } from './ItemSheet'

/** A ticked item stays in place this long before it moves to "Bought", so the list doesn't jump (#190 point 1). */
const MOVE_DELAY_MS = 1000

/** Runs a state change as an animated view transition where the browser supports it (the item glides down). */
function withTransition(change: () => void) {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!reduced && typeof document.startViewTransition === 'function') document.startViewTransition(() => flushSync(change))
  else change()
}

/**
 * The shopping list (milestone 3C, #184, #190): items by store section, tick
 * off with one tap anywhere on the row, own items typed freely, "Bought"
 * section, share.
 */
export function ShoppingScreen() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { data } = useRecipeData()
  const [items, setItems] = useState<ShoppingItem[] | null>(null)
  const [memory, setMemory] = useState<SectionMemory>({})
  const [boughtOpen, setBoughtOpen] = useState(() => repository.isBoughtSectionOpen())
  /** Items just ticked off: they stay in place (with ✓) for a second before moving down. */
  const [moving, setMoving] = useState<ReadonlySet<Id>>(new Set())
  const timers = useRef(new Map<Id, number>())
  const [editId, setEditId] = useState<Id | null>(null)
  const [text, setText] = useState('')
  const inputId = 'shopping-add'

  // The ref mirrors the latest list for toast buttons and timers, which run after later changes.
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  })

  useEffect(() => {
    let active = true
    void Promise.all([repository.listShoppingItems(), repository.getSectionMemory()]).then(([stored, remembered]) => {
      if (!active) return
      // Bought items disappear by themselves once their week is over (#190 point 7).
      const kept = dropFinishedBought(stored, weekIdOf(new Date()))
      if (kept.length !== stored.length) void repository.saveShoppingItems(kept)
      setItems(kept)
      setMemory(remembered)
    })
    const pending = timers.current
    return () => {
      active = false
      for (const timer of pending.values()) window.clearTimeout(timer)
    }
  }, [])

  if (!data || !items) return <PageHeader title={t('screens.shopping.title')} />

  const ingredientOf = (item: ShoppingItem) => (item.ingredientId ? data.ingredientMap.get(item.ingredientId) : undefined)
  const nameOf = (item: ShoppingItem) => item.customName ?? localize(ingredientOf(item)?.name, language)
  const isStaple = (item: ShoppingItem) => ingredientOf(item)?.isStaple ?? false
  const section = (item: ShoppingItem) => sectionOf(item, data.ingredientMap, memory)
  // Staples are shown without an amount: you buy a bottle, not 85 g (#187).
  const amountOf = (item: ShoppingItem) =>
    item.amount !== undefined && item.unit && !isStaple(item)
      ? `${formatAmount(item.amount, language)} ${t(`units.short.${item.unit}`, { count: unitCount(item.amount) })}`
      : undefined

  const open = items.filter((i) => !i.bought || moving.has(i.id))
  const bought = items.filter((i) => i.bought && !moving.has(i.id))
  const leftCount = items.filter((i) => !i.bought).length
  const groups = groupBySection(open, section, nameOf, language)
  const weeks = new Set(items.map((i) => i.weekId).filter(Boolean))
  const editing = items.find((i) => i.id === editId) ?? null

  function persist(next: ShoppingItem[]) {
    itemsRef.current = next
    setItems(next)
    void repository.saveShoppingItems(next)
  }

  // --- Home (#178, #190 point 2): bought items are "have"; un-ticking puts Home back ---------

  async function markAtHome(item: ShoppingItem): Promise<ShoppingItem['pantryBefore']> {
    if (!item.ingredientId) return undefined
    const pantry = await repository.listPantry()
    const existing = pantry.find((p) => p.ingredientId === item.ingredientId)
    const now = new Date().toISOString()
    await repository.savePantryItem(existing ? { ...existing, status: 'have' } : { id: newId(), ingredientId: item.ingredientId, status: 'have', updatedAt: now })
    return existing?.status ?? 'none'
  }

  async function restoreHome(item: ShoppingItem) {
    if (!item.ingredientId || !item.pantryBefore || item.pantryBefore === 'have') return
    const existing = (await repository.listPantry()).find((p) => p.ingredientId === item.ingredientId)
    if (!existing) return
    if (item.pantryBefore === 'none') await repository.deletePantryItem(existing.id)
    else await repository.savePantryItem({ ...existing, status: item.pantryBefore })
  }

  // --- Ticking off (#190 point 1) -----------------------------------------------------------

  function stopMoving(id: Id) {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    setMoving((m) => {
      const next = new Set(m)
      next.delete(id)
      return next
    })
  }

  function untick(id: Id) {
    const current = itemsRef.current?.find((i) => i.id === id)
    if (!current?.bought) return
    const list = itemsRef.current ?? []
    withTransition(() => {
      stopMoving(id)
      persist(setBought(list, id, false, new Date().toISOString()))
    })
    void restoreHome(current)
  }

  async function tick(item: ShoppingItem) {
    const now = new Date().toISOString()
    const ticked = setBought(itemsRef.current ?? [], item.id, true, now)
    persist(ticked)
    setMoving((m) => new Set(m).add(item.id))
    timers.current.set(
      item.id,
      window.setTimeout(() => withTransition(() => stopMoving(item.id)), MOVE_DELAY_MS),
    )
    const allDone = ticked.every((i) => i.bought)
    toast(allDone ? t('shopping.allDone') : t('shopping.boughtToast', { name: nameOf(item) }), {
      duration: allDone ? 6000 : 4000,
      action: { label: t('common.undo'), onClick: () => untick(item.id) },
    })
    // Record Home's earlier status on the item, so un-ticking can put it back.
    const pantryBefore = await markAtHome(item)
    if (pantryBefore) {
      const latest = itemsRef.current ?? []
      if (latest.find((i) => i.id === item.id)?.bought) persist(setBought(latest, item.id, true, now, pantryBefore))
    }
  }

  function toggle(item: ShoppingItem) {
    if (item.bought) untick(item.id)
    else void tick(item)
  }

  function removeBought() {
    const before = itemsRef.current ?? []
    const removed = before.filter((i) => i.bought)
    persist(clearBought(before))
    toast(t('shopping.cleared', { count: removed.length }), {
      duration: 8000,
      action: { label: t('common.undo'), onClick: () => persist([...(itemsRef.current ?? []), ...removed]) },
    })
  }

  // --- Own items, typed freely (#190 point 3–5) ---------------------------------------------

  function add(event?: FormEvent) {
    event?.preventDefault()
    if (!text.trim()) return
    const result = addTypedItems(itemsRef.current ?? [], text, {
      ingredients: data!.ingredients,
      memory,
      now: new Date().toISOString(),
      newId,
    })
    if (result.added.length > 0) persist(result.items)
    setText('')
    const parts: string[] = []
    if (result.added.length > 0) parts.push(t('shopping.added', { count: result.added.length, name: nameOf(result.added[0]) }))
    if (result.duplicates.length > 0) parts.push(t('shopping.alreadyOn', { names: result.duplicates.map(nameOf).join(', ') }))
    if (parts.length > 0) toast(parts.join(' · '))
    // Only one item, and it is already there: open it so the amount can be changed (#190 point 5).
    if (result.added.length === 0 && result.duplicates.length === 1) setEditId(result.duplicates[0].id)
  }

  /** Enter adds; Shift+Enter makes a new line (several items can also be pasted). */
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      add()
    }
  }

  // --- Editing one item (#190 point 6) ------------------------------------------------------

  function saveEdit(item: ShoppingItem, edit: ItemEdit) {
    const { amount: _amount, unit: _unit, ...rest } = item
    const updated: ShoppingItem = { ...rest, ...edit, updatedAt: new Date().toISOString() }
    persist((itemsRef.current ?? []).map((i) => (i.id === item.id ? updated : i)))
    // Moving an item is remembered for next time (#190 point 3y).
    if (edit.storeSection !== section(item)) {
      const next = { ...memory, [memoryKey({ ingredientId: item.ingredientId, name: updated.customName })]: edit.storeSection }
      setMemory(next)
      void repository.saveSectionMemory(next)
    }
    setEditId(null)
  }

  function deleteItem(item: ShoppingItem) {
    const before = itemsRef.current ?? []
    const index = before.findIndex((i) => i.id === item.id)
    persist(before.filter((i) => i.id !== item.id))
    setEditId(null)
    toast(t('shopping.sheet.deleted', { name: nameOf(item) }), {
      duration: 8000,
      action: {
        label: t('common.undo'),
        onClick: () => {
          const now = [...(itemsRef.current ?? [])]
          now.splice(Math.min(index, now.length), 0, item)
          persist(now)
        },
      },
    })
  }

  // --- Share (#190 point 8) -------------------------------------------------------------------

  async function share() {
    const toShare = items!.filter((i) => !i.bought)
    const textToShare = shareText(
      t('shopping.shareTitle'),
      groupBySection(toShare, section, nameOf, language).map((g) => ({
        title: t(`storeSections.${g.section}`),
        lines: g.items.map((i) => [nameOf(i), amountOf(i)].filter(Boolean).join(' · ')),
      })),
    )
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: textToShare })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return // the user closed the share menu
      }
    }
    try {
      await navigator.clipboard.writeText(textToShare)
      toast(t('shopping.copied'))
    } catch {
      toast.error(t('shopping.shareFailed'))
    }
  }

  // --- Rendering ------------------------------------------------------------------------------

  const row = (item: ShoppingItem) => {
    const name = nameOf(item)
    const amount = amountOf(item)
    const checked = item.bought
    return (
      <li key={item.id} style={{ viewTransitionName: `item-${item.id}` }} className="flex items-center gap-1">
        {/* The whole row ticks off: a big target while one hand holds the basket (#190 point 1). */}
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => toggle(item)}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {checked ? (
            <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-foreground text-background">
              <CheckIcon className="size-4" strokeWidth={3} />
            </span>
          ) : (
            <CircleIcon aria-hidden className="size-6 shrink-0 text-muted-foreground" />
          )}
          <span className={cn('min-w-0 flex-1', checked && 'text-muted-foreground line-through')}>
            <span className={cn(!checked && 'font-medium')}>{name}</span>
            {amount ? <span className="text-muted-foreground"> · {amount}</span> : null}
          </span>
          {/* The week label only matters when the list has items from more than one week (#184 point 8). */}
          {item.weekId && weeks.size > 1 ? (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {t('shopping.weekLabel', { week: weekNumber(item.weekId) })}
            </span>
          ) : null}
        </button>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label={t('shopping.edit', { name })} onClick={() => setEditId(item.id)}>
          <EllipsisIcon />
        </Button>
      </li>
    )
  }

  return (
    <>
      <PageHeader
        title={t('screens.shopping.title')}
        subtitle={items.length > 0 ? t('shopping.summary', { left: leftCount, bought: items.length - leftCount }) : undefined}
        actions={
          leftCount > 0 ? (
            <Button variant="secondary" onClick={() => void share()}>
              <Share2Icon aria-hidden />
              {t('shopping.share')}
            </Button>
          ) : null
        }
      />

      <form onSubmit={add} className="mb-5">
        <label htmlFor={inputId} className="sr-only">
          {t('shopping.addLabel')}
        </label>
        <div className="flex items-start gap-2">
          <Textarea
            id={inputId}
            rows={1}
            value={text}
            placeholder={t('shopping.addPlaceholder')}
            aria-describedby={`${inputId}-hint`}
            enterKeyHint="enter"
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            className="min-h-11 resize-none [field-sizing:content]"
          />
          <Button type="submit" className="shrink-0" disabled={!text.trim()}>
            <PlusIcon aria-hidden />
            {t('shopping.addButton')}
          </Button>
        </div>
        <p id={`${inputId}-hint`} className="mt-1 text-sm text-muted-foreground">
          {t('shopping.addHint')}
        </p>
      </form>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-secondary p-4 text-sm">{t('shopping.empty')}</div>
      ) : null}

      {/* Everything is ticked off: a short confirmation and the natural next step (#190 point 1c). */}
      {items.length > 0 && open.length === 0 ? (
        <div className="mb-4 rounded-2xl bg-secondary p-4">
          <p className="font-semibold text-secondary-foreground">{t('shopping.allDone')}</p>
          <p className="mt-1 text-sm">{t('shopping.allDoneText')}</p>
          <Button variant="outline" className="mt-3" onClick={removeBought}>
            {t('shopping.clearBought')}
          </Button>
        </div>
      ) : null}

      <div className="space-y-4">
        {groups.map(({ section: s, items: sectionItems }) => (
          <section key={s} aria-labelledby={`section-${s}`}>
            <h2 id={`section-${s}`} className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t(`storeSections.${s}`)}
            </h2>
            <ul className="divide-y rounded-2xl border bg-card px-3">{sectionItems.map(row)}</ul>
          </section>
        ))}

        {bought.length > 0 ? (
          <details
            open={boughtOpen}
            onToggle={(e) => {
              const isOpen = e.currentTarget.open
              setBoughtOpen(isOpen)
              repository.setBoughtSectionOpen(isOpen)
            }}
            className="group rounded-2xl border bg-card"
          >
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-2 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              {t('shopping.bought', { count: bought.length })}
              <ChevronDownIcon aria-hidden className="size-5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3">
              <ul className="divide-y">{groupBySection(bought, section, nameOf, language).flatMap((g) => g.items.map(row))}</ul>
              {open.length > 0 ? (
                <Button variant="outline" className="mt-2" onClick={removeBought}>
                  {t('shopping.clearBought')}
                </Button>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>

      <ItemSheet
        item={editing}
        name={editing ? nameOf(editing) : ''}
        section={editing ? section(editing) : 'other'}
        isStaple={editing ? isStaple(editing) : false}
        onSave={(edit) => editing && saveEdit(editing, edit)}
        onDelete={() => editing && deleteItem(editing)}
        onClose={() => setEditId(null)}
      />
    </>
  )
}
