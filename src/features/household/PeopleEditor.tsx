import { PlusIcon, XIcon } from 'lucide-react'
import { useId, useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { localize } from '@/data/localize'
import type { Ingredient } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { DislikesSheet } from './DislikesSheet'
import { newDraft, type PersonDraft } from './household-draft'
import { ProteinTargetField } from './ProteinTargetField'

type Props = {
  /** Everyone except "me" (the first adult, edited under My profile, #32). */
  people: PersonDraft[]
  onChange: (people: PersonDraft[]) => void
  ingredients: Ingredient[]
  /** Read-only card for "me" at the top. */
  self?: React.ReactNode
}

/** Person cards for the household: adults with an optional target, children with lunch + dislikes (#160, #161). */
export function PeopleEditor({ people, onChange, ingredients, self }: Props) {
  const { t } = useTranslation()
  const update = (draft: PersonDraft) => onChange(people.map((p) => (p.id === draft.id ? draft : p)))

  return (
    <div className="space-y-3">
      {self}
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          ingredients={ingredients}
          onChange={update}
          onRemove={() => onChange(people.filter((p) => p.id !== person.id))}
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
  onChange,
  onRemove,
}: {
  person: PersonDraft
  ingredients: Ingredient[]
  onChange: (person: PersonDraft) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const language = useLanguage()
  const id = useId()
  const [dislikesOpen, setDislikesOpen] = useState(false)
  const kindLabel = t(person.kind === 'adult' ? 'household.adult' : 'household.child')
  const shownName = person.name.trim() || kindLabel
  const dislikeNames = person.dislikes
    .map((d) => ingredients.find((i) => i.id === d))
    .filter((i): i is Ingredient => !!i)
    .map((i) => localize(i.name, language).toLocaleLowerCase(language))

  return (
    <section aria-label={`${kindLabel}: ${shownName}`} className="space-y-3 rounded-2xl border bg-card p-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-semibold">
            {t(person.kind === 'adult' ? 'household.adultName' : 'household.childName')}
          </label>
          <Input id={`${id}-name`} value={person.name} onChange={(e) => onChange({ ...person, name: e.target.value })} autoComplete="off" />
        </div>
        <Button variant="ghost" size="icon" aria-label={t('household.remove', { name: shownName })} onClick={onRemove}>
          <XIcon aria-hidden />
        </Button>
      </div>

      {person.kind === 'adult' ? (
        <ProteinTargetField label={t('household.targetOptional')} value={person.target} onChange={(target) => onChange({ ...person, target })} />
      ) : (
        <>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            <span>{t('household.lunchAtHome')}</span>
            <Switch checked={person.lunchAtHome} onCheckedChange={(on) => onChange({ ...person, lunchAtHome: on })} />
          </label>
          <div className="flex min-h-11 items-center justify-between gap-3 text-sm">
            <span className="min-w-0">
              {t('household.dislikes.label')}{' '}
              <span className="text-muted-foreground">{dislikeNames.length > 0 ? dislikeNames.join(', ') : t('household.dislikes.none')}</span>
            </span>
            <Button variant="ghost" className="shrink-0 text-primary-text" aria-label={t('household.dislikes.edit', { name: shownName })} onClick={() => setDislikesOpen(true)}>
              {t('household.dislikes.change')}
            </Button>
          </div>
          <DislikesSheet
            open={dislikesOpen}
            name={shownName}
            ingredients={ingredients}
            selected={person.dislikes}
            onChange={(dislikes) => onChange({ ...person, dislikes })}
            onClose={() => setDislikesOpen(false)}
          />
        </>
      )}
    </section>
  )
}
