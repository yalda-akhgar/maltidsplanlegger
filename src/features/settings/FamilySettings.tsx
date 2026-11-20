/**
 * Settings pages for the family (#163): My profile, Household, Food and week,
 * Protein split. Each has a Save button; saving updates planned weeks (#162).
 */
import { FoodRows } from '@/features/household/FoodRows'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { canTurnOff, mealOn, turnMealOff, turnMealOn } from '@/data/meals'
import { DEFAULT_PROTEIN_SPLIT } from '@/data/defaults'
import { newId } from '@/data/repository'
import { MEAL_SLOTS, type HouseholdSettings, type Ingredient, type ProteinSplit } from '@/data/types'
import { ExcludedFoodFields, WeekRhythmFields } from '@/features/household/FoodAndWeekFields'
import { fromDraft, selfOf, targetInvalid, toDraft, type PersonDraft } from '@/features/household/household-draft'
import { PeopleEditor } from '@/features/household/PeopleEditor'
import { ProteinTargetField } from '@/features/household/ProteinTargetField'
import { saveSettings, showSavedToast } from '@/features/household/save-settings'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { SettingsPage, useBackToSettings, useHouseholdData } from './SettingsPage'

/** Shared Save logic: save, show what changed in the plan, go back. */
function useSave(old: HouseholdSettings, dirty: boolean) {
  const { t } = useTranslation()
  const back = useBackToSettings()
  const { dialog, allowLeave } = useUnsavedChanges(dirty)
  const [busy, setBusy] = useState(false)
  const save = async (household: HouseholdSettings) => {
    setBusy(true)
    showSavedToast(t, await saveSettings(old, household))
    allowLeave()
    back()
  }
  return { dialog, busy, save }
}

function SaveButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <Button className="flex-1" disabled={disabled} onClick={onClick}>
      {t('settings.save')}
    </Button>
  )
}

// --- My profile ----------------------------------------------------------------

export function ProfileSettings() {
  const data = useHouseholdData()
  return data ? <ProfileForm household={data.household} ingredients={data.ingredients} /> : null
}

function ProfileForm({ household, ingredients }: { household: HouseholdSettings; ingredients: Ingredient[] }) {
  const { t } = useTranslation()
  const self = selfOf(household)
  const initial = {
    name: self?.name ?? '',
    target: self?.proteinTargetG ? String(self.proteinTargetG) : '',
    allergies: [...(self?.allergies ?? [])],
    notTolerated: [...(self?.notToleratedIngredientIds ?? [])],
    dislikes: [...(self?.dislikedIngredientIds ?? [])],
  }
  const [form, setForm] = useState(initial)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const { dialog, busy, save } = useSave(household, dirty)

  const submit = () => {
    const person = fromDraft({ ...(self ? toDraft(self) : { id: newId(), kind: 'adult' as const, dislikes: [], notTolerated: [], lunchAtHome: false, allergies: [] }), ...form }, t('onboarding.me'))
    const people = self ? household.people.map((p) => (p.id === self.id ? person : p)) : [person, ...household.people]
    void save({ ...household, people })
  }

  return (
    <SettingsPage title={t('settings.profile.title')} footer={<SaveButton disabled={!dirty || busy || targetInvalid(form.target)} onClick={submit} />}>
      <p className="text-muted-foreground">{t('settings.profile.text')}</p>
      <div className="space-y-1.5">
        <label htmlFor="profile-name" className="text-sm font-semibold">
          {t('onboarding.welcome.name')}
        </label>
        <Input id="profile-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="given-name" />
      </div>
      <ProteinTargetField label={t('settings.profile.target')} value={form.target} onChange={(target) => setForm({ ...form, target })} withCalculator />
      <FoodRows name={form.name.trim() || t('onboarding.me')} value={form} ingredients={ingredients} onChange={(food) => setForm({ ...form, ...food })} />
      {dialog}
    </SettingsPage>
  )
}

// --- Household -------------------------------------------------------------------

export function HouseholdSettingsPage() {
  const data = useHouseholdData()
  return data ? <HouseholdForm household={data.household} ingredients={data.ingredients} /> : null
}

function HouseholdForm({ household, ingredients }: { household: HouseholdSettings; ingredients: Ingredient[] }) {
  const { t } = useTranslation()
  const self = selfOf(household)
  const [initial] = useState<PersonDraft[]>(() => household.people.filter((p) => p !== self).map(toDraft))
  const [people, setPeople] = useState(initial)
  const dirty = JSON.stringify(people) !== JSON.stringify(initial)
  const { dialog, busy, save } = useSave(household, dirty)
  const invalid = people.some((p) => p.kind === 'adult' && targetInvalid(p.target))

  const submit = () => {
    let count = { adult: 1, child: 0 }
    const others = people.map((d) => {
      count = { ...count, [d.kind]: count[d.kind] + 1 }
      return fromDraft(d, `${t(d.kind === 'adult' ? 'household.adult' : 'household.child')} ${count[d.kind]}`)
    })
    void save({ ...household, people: self ? [self, ...others] : others })
  }

  return (
    <SettingsPage title={t('settings.household.title')} footer={<SaveButton disabled={!dirty || busy || invalid} onClick={submit} />}>
      <PeopleEditor
        people={people}
        onChange={setPeople}
        ingredients={ingredients}
        lunchOn={mealOn(household.proteinSplit, 'lunch')}
        self={
          self ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
              <span className="font-semibold">{self.name}</span>
              <span className="text-right text-sm text-muted-foreground">
                {self.proteinTargetG ? t('settings.household.selfTarget', { target: self.proteinTargetG }) : t('settings.household.selfNoTarget')}
              </span>
            </div>
          ) : null
        }
      />
      {dialog}
    </SettingsPage>
  )
}

// --- Food and week ---------------------------------------------------------------

export function FoodWeekSettings() {
  const data = useHouseholdData()
  return data ? <FoodWeekForm household={data.household} /> : null
}

function FoodWeekForm({ household }: { household: HouseholdSettings }) {
  const { t } = useTranslation()
  const pick = (h: HouseholdSettings) => ({
    excludedTags: h.excludedTags,
    excludedTerms: h.excludedTerms,
    noDinnerAtHomeDays: h.noDinnerAtHomeDays,
    cheatDays: h.cheatDays,
  })
  const [initial] = useState(() => pick(household))
  const [form, setForm] = useState(initial)
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const { dialog, busy, save } = useSave(household, dirty)

  return (
    <SettingsPage title={t('settings.foodWeek.title')} footer={<SaveButton disabled={!dirty || busy} onClick={() => void save({ ...household, ...form })} />}>
      <section aria-labelledby="food-title" className="space-y-3">
        <h2 id="food-title" className="font-semibold">
          {t('onboarding.food.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('onboarding.food.text')}</p>
        <ExcludedFoodFields excludedTags={form.excludedTags} excludedTerms={form.excludedTerms} onChange={(v) => setForm({ ...form, ...v })} />
      </section>
      <WeekRhythmFields
        noDinnerAtHomeDays={form.noDinnerAtHomeDays}
        cheatDays={form.cheatDays}
        snackOn={mealOn(household.proteinSplit, 'snack')}
        onChange={(v) => setForm({ ...form, ...v })}
      />
      {dialog}
    </SettingsPage>
  )
}

// --- Meals and protein split (#165, #183) -----------------------------------------

const SPLIT_STEP = 5

export function SplitSettings() {
  const data = useHouseholdData()
  return data ? <SplitForm household={data.household} /> : null
}

function SplitForm({ household }: { household: HouseholdSettings }) {
  const { t } = useTranslation()
  const [split, setSplit] = useState<ProteinSplit>(household.proteinSplit)
  const dirty = JSON.stringify(split) !== JSON.stringify(household.proteinSplit)
  const { dialog, busy, save } = useSave(household, dirty)
  const sum = MEAL_SLOTS.reduce((s, slot) => s + split[slot], 0)
  const isDefault = JSON.stringify(split) === JSON.stringify(DEFAULT_PROTEIN_SPLIT)
  const change = (slot: keyof ProteinSplit, delta: number) => setSplit({ ...split, [slot]: Math.min(100, Math.max(0, split[slot] + delta)) })
  // 0 % = the household doesn't eat the meal (#183); the last main meal can't go to 0.
  const canLower = (slot: keyof ProteinSplit) => split[slot] > SPLIT_STEP || (split[slot] > 0 && canTurnOff(split, slot))
  const locked = MEAL_SLOTS.some((slot) => !canTurnOff(split, slot))

  return (
    <SettingsPage
      title={t('settings.split.title')}
      footer={<SaveButton disabled={!dirty || busy || sum !== 100} onClick={() => void save({ ...household, proteinSplit: split })} />}
    >
      <p className="text-muted-foreground">{t('settings.split.text')}</p>
      <ul className="divide-y rounded-2xl border bg-card">
        {MEAL_SLOTS.map((slot) => {
          const name = t(`week.slots.${slot}`)
          const on = mealOn(split, slot)
          return (
            <li key={slot} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                <Switch
                  aria-labelledby={`split-${slot}`}
                  aria-describedby={locked ? 'split-min' : undefined}
                  checked={on}
                  disabled={!canTurnOff(split, slot)}
                  onCheckedChange={(next) => setSplit(next ? turnMealOn(split, slot) : turnMealOff(split, slot))}
                />
                <span id={`split-${slot}`} className="font-medium">
                  {name}
                </span>
              </div>
              {!on ? (
                <span className="min-h-11 content-center text-sm text-muted-foreground">{t('household.meals.off')}</span>
              ) : (
              <div role="group" aria-labelledby={`split-${slot}`} className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="rounded-full" aria-label={t('settings.split.less', { name })} disabled={!canLower(slot)} onClick={() => change(slot, -SPLIT_STEP)}>
                  <MinusIcon />
                </Button>
                <output aria-live="polite" className="min-w-14 text-center font-semibold tabular-nums">
                  {split[slot]} %
                </output>
                <Button variant="outline" size="icon" className="rounded-full" aria-label={t('settings.split.more', { name })} disabled={split[slot] >= 100} onClick={() => change(slot, SPLIT_STEP)}>
                  <PlusIcon />
                </Button>
              </div>
              )}
            </li>
          )
        })}
        <li className="flex items-center justify-between gap-3 p-3">
          <span className="text-muted-foreground">{t('settings.split.sum')}</span>
          <span aria-live="polite" className={sum === 100 ? 'font-semibold text-success-foreground' : 'font-semibold text-warning-foreground'}>
            {sum === 100 ? t('settings.split.sumOk') : t('settings.split.sumWrong', { sum })}
          </span>
        </li>
      </ul>
      {locked ? (
        <p id="split-min" className="text-sm text-muted-foreground">
          {t('household.meals.minOne')}
        </p>
      ) : null}
      {!isDefault ? (
        <Button variant="secondary" onClick={() => setSplit({ ...DEFAULT_PROTEIN_SPLIT })}>
          {t('settings.split.reset')}
        </Button>
      ) : null}
      {dialog}
    </SettingsPage>
  )
}

