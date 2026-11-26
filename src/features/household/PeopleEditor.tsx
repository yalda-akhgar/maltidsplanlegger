import { PlusIcon, XIcon } from 'lucide-react'
import { useId } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { Id, Ingredient } from '@/data/types'
import { askConfirm } from '@/lib/confirm'
import { FoodRows } from './FoodRows'
import { newDraft, type PersonDraft } from './household-draft'
import { defaultName } from './person-name'
import { ProteinTargetField } from './ProteinTargetField'

type Props = {
  /** Everyone except "me" (the first adult, edited under My profile, #32). */
  people: PersonDraft[]
  onChange: (people: PersonDraft[]) => void
  ingredients: Ingredient[]
  /** Read-only card for "me" at the top. */
  self?: React.ReactNode
  /** Whether the household eats lunch; otherwise children's "lunch at home" is hidden (#183). */
  lunchOn?: boolean
  /** Id of "me", the first adult – counts when numbering default names ("Adult 2", #195). */
  selfId?: Id
}

/** Person cards for the household: adults with an optional target, children with lunch (#160, #161), everyone with allergies, food they don't tolerate and dislikes (#180, #181). */
export function PeopleEditor({ people, onChange, ingredients, self, lunchOn = true, selfId }: Props) {
  const { t } = useTranslation()
  const update = (draft: PersonDraft) => onChange(people.map((p) => (p.id === draft.id ? draft : p)))
  const everyone = [...(selfId ? [{ id: selfId, kind: 'adult' as const }] : []), ...people]

  // Removing a person is big: always ask, naming them (#195).
  async function remove(person: PersonDraft) {
    const name = person.name.trim() || defaultName(person, everyone, t)
    const ok = await askConfirm({
      title: t('household.removeConfirm.title', { name }),
      description: t('household.removeConfirm.text', { name }),
      cancelLabel: t('common.cancel'),
      confirmLabel: t('household.removeConfirm.confirm'),
    })
    if (ok) onChange(people.filter((p) => p.id !== person.id))
  }

  return (
    <div className="space-y-3">
      {self}
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          ingredients={ingredients}
          lunchOn={lunchOn}
          onChange={update}
          fallbackName={defaultName(person, everyone, t)}
          onRemove={() => void remove(person)}
        />
      ))}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 border-dashed" onClick={() => onChange([...people, newDraft('adult')])}>
          <PlusIcon aria-hidden />
          {t('household.addAdult')}
        </Button>
        <Button variant="outline" className="flex-1 border-dashed" onClick={() => onChange([...people, newDraft('child')])}>
          <PlusIcon aria-hidden />
          {t('household.addChild')}
        </Button>
      </div>
    </div>
  )
}

function PersonCard({
  person,
  ingredients,
  lunchOn,
  fallbackName,
  onChange,
  onRemove,
}: {
  person: PersonDraft
  /** Shown in grey in the empty name field, and used when no name is typed (#195). */
  fallbackName: string
  ingredients: Ingredient[]
  lunchOn: boolean
  onChange: (person: PersonDraft) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const kindLabel = t(person.kind === 'adult' ? 'household.adult' : 'household.child')
  const shownName = person.name.trim() || fallbackName

  return (
    <section aria-label={`${kindLabel}: ${shownName}`} className="space-y-3 rounded-2xl border bg-card p-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-semibold">
            {t(person.kind === 'adult' ? 'household.adultName' : 'household.childName')}
          </label>
          <Input id={`${id}-name`} value={person.name} onChange={(e) => onChange({ ...person, name: e.target.value })} placeholder={fallbackName} autoComplete="off" />
        </div>
        <Button variant="ghost" size="icon" aria-label={t('household.remove', { name: shownName })} onClick={onRemove}>
          <XIcon aria-hidden />
        </Button>
      </div>

      <FoodRows name={shownName} value={person} ingredients={ingredients} onChange={(food) => onChange({ ...person, ...food })} />

      {person.kind === 'adult' ? (
        <ProteinTargetField label={t('household.targetOptional')} value={person.target} onChange={(target) => onChange({ ...person, target })} />
      ) : lunchOn ? (
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          <span>{t('household.lunchAtHome')}</span>
          <Switch checked={person.lunchAtHome} onCheckedChange={(on) => onChange({ ...person, lunchAtHome: on })} />
        </label>
      ) : null}
    </section>
  )
}
