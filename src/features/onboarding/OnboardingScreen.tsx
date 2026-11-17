import { XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { newId, repository } from '@/data/repository'
import { LANGUAGES, type HouseholdSettings, type Ingredient, type Language, type Weekday } from '@/data/types'
import { ExcludedFoodFields, WeekRhythmFields } from '@/features/household/FoodAndWeekFields'
import { fromDraft, parseTarget, selfOf, targetInvalid, toDraft, type PersonDraft } from '@/features/household/household-draft'
import { PeopleEditor } from '@/features/household/PeopleEditor'
import { ProteinTargetField } from '@/features/household/ProteinTargetField'
import { makeFirstWeekPlan, saveSettings, showSavedToast } from '@/features/household/save-settings'
import { cn } from '@/lib/utils'

const STEPS = 6

type Draft = {
  selfId: string
  name: string
  target: string
  others: PersonDraft[]
  excludedTags: string[]
  excludedTerms: string[]
  noDinnerAtHomeDays: Weekday[]
  cheatDays: Weekday[]
}

function toWizardDraft(household: HouseholdSettings): Draft {
  const self = selfOf(household)
  return {
    selfId: self?.id ?? newId(),
    name: self?.name ?? '',
    target: self?.proteinTargetG ? String(self.proteinTargetG) : '',
    others: household.people.filter((p) => p !== self).map(toDraft),
    excludedTags: [...household.excludedTags],
    excludedTerms: [...household.excludedTerms],
    noDinnerAtHomeDays: [...household.noDinnerAtHomeDays],
    cheatDays: [...household.cheatDays],
  }
}

/**
 * The onboarding wizard (#24, #158): six full-screen steps, each can be
 * skipped. On first run it ends by making the first week plan; when run again
 * from Settings it just saves (#166).
 */
export function OnboardingScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const again = params.get('again') === '1'
  const [loaded, setLoaded] = useState<{ household: HouseholdSettings; ingredients: Ingredient[] } | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    void Promise.all([repository.getHousehold(), repository.listIngredients()]).then(([household, ingredients]) => {
      setLoaded({ household, ingredients })
      setDraft(toWizardDraft(household))
    })
  }, [])

  // Move focus to the new step's heading, so screen readers start there.
  const ready = draft !== null
  useEffect(() => {
    headingRef.current?.focus()
  }, [step, ready])

  if (!loaded || !draft) return null
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })

  const invalid = (step === 2 && targetInvalid(draft.target)) || (step === 3 && draft.others.some((p) => p.kind === 'adult' && targetInvalid(p.target)))

  async function finish() {
    if (!loaded || !draft) return
    setBusy(true)
    let count = { adult: 1, child: 0 }
    const others = draft.others.map((d) => {
      count = { ...count, [d.kind]: count[d.kind] + 1 }
      return fromDraft(d, `${t(d.kind === 'adult' ? 'household.adult' : 'household.child')} ${count[d.kind]}`)
    })
    const hasSelf = draft.name.trim() !== '' || parseTarget(draft.target) !== undefined
    const self = fromDraft(
      { id: draft.selfId, kind: 'adult', name: draft.name, target: draft.target, dislikes: [], lunchAtHome: false },
      t('onboarding.me'),
    )
    const household: HouseholdSettings = {
      ...loaded.household,
      people: hasSelf ? [self, ...others] : others,
      excludedTags: draft.excludedTags,
      excludedTerms: draft.excludedTerms,
      noDinnerAtHomeDays: draft.noDinnerAtHomeDays,
      cheatDays: draft.cheatDays,
      onboardingDone: true,
    }
    const result = await saveSettings(loaded.household, household)
    if (again) {
      showSavedToast(t, result)
      navigate('/settings', { replace: true })
    } else {
      await makeFirstWeekPlan(household)
      navigate('/week', { replace: true })
    }
  }

  const titles = ['welcome', 'protein', 'household', 'food', 'week', 'done'] as const
  const title =
    step === 2 && draft.name.trim() ? t('onboarding.protein.titleNamed', { name: draft.name.trim() }) : t(`onboarding.${titles[step - 1]}.title`)

  return (
    <div className="flex min-h-dvh flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <DocumentTitle title={title} />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-[max(1rem,env(safe-area-inset-left))] py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-1.5" aria-hidden>
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-accent')} />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{t('onboarding.stepOf', { step, total: STEPS })}</span>
          {again ? (
            <Button variant="ghost" size="icon" aria-label={t('onboarding.cancel')} onClick={() => navigate('/settings', { replace: true })}>
              <XIcon aria-hidden />
            </Button>
          ) : null}
        </div>

        <main className="mt-6 flex flex-1 flex-col gap-5">
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
            {title}
          </h1>

          {step === 1 ? <WelcomeStep name={draft.name} onName={(name) => set({ name })} /> : null}
          {step === 2 ? (
            <ProteinTargetField label={t('onboarding.protein.label')} value={draft.target} onChange={(target) => set({ target })} withCalculator />
          ) : null}
          {step === 3 ? (
            <>
              <p className="text-muted-foreground">{t('onboarding.household.text')}</p>
              <PeopleEditor
                people={draft.others}
                onChange={(others) => set({ others })}
                ingredients={loaded.ingredients}
                self={
                  <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-3">
                    <span className="font-semibold">{draft.name.trim() || t('onboarding.me')}</span>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                      {parseTarget(draft.target) ? t('onboarding.household.youWithTarget', { target: parseTarget(draft.target) }) : t('onboarding.household.you')}
                    </span>
                  </div>
                }
              />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <p className="text-muted-foreground">{t('onboarding.food.text')}</p>
              <ExcludedFoodFields excludedTags={draft.excludedTags} excludedTerms={draft.excludedTerms} onChange={set} />
            </>
          ) : null}
          {step === 5 ? <WeekRhythmFields noDinnerAtHomeDays={draft.noDinnerAtHomeDays} cheatDays={draft.cheatDays} onChange={set} /> : null}
          {step === 6 ? <Summary draft={draft} again={again} /> : null}
        </main>

        <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 bg-background py-3">
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              {t('common.back')}
            </Button>
          ) : null}
          {step === 1 ? (
            <Button variant="ghost" className="text-primary-text" onClick={() => setStep(STEPS)}>
              {t('onboarding.skipAll')}
            </Button>
          ) : step < STEPS ? (
            <Button variant="ghost" className="text-primary-text" onClick={() => setStep(step + 1)}>
              {t('onboarding.skip')}
            </Button>
          ) : null}
          {step < STEPS ? (
            <Button className="ml-auto min-w-28" disabled={invalid} onClick={() => setStep(step + 1)}>
              {t('onboarding.next')}
            </Button>
          ) : (
            <Button className="ml-auto" disabled={busy} onClick={() => void finish()}>
              {again ? t('onboarding.done.save') : t('onboarding.done.makePlan')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentTitle({ title }: { title: string }) {
  const { t } = useTranslation()
  useEffect(() => {
    document.title = `${title} – ${t('app.name')}`
  }, [title, t])
  return null
}

function WelcomeStep({ name, onName }: { name: string; onName: (name: string) => void }) {
  const { t, i18n } = useTranslation()
  const changeLanguage = (language: Language) => {
    repository.setLanguage(language)
    void i18n.changeLanguage(language)
  }
  return (
    <>
      <div role="group" aria-label={t('settings.language.title')} className="flex flex-wrap gap-2">
        {LANGUAGES.map((language) => (
          <Chip key={language} lang={language} selected={i18n.language === language} onClick={() => changeLanguage(language)}>
            {t(`languages.${language}`)}
          </Chip>
        ))}
      </div>
      <p className="text-muted-foreground">{t('onboarding.welcome.text')}</p>
      <div className="space-y-1.5">
        <label htmlFor="onboarding-name" className="text-sm font-semibold">
          {t('onboarding.welcome.name')}
        </label>
        <Input id="onboarding-name" value={name} onChange={(e) => onName(e.target.value)} autoComplete="given-name" />
      </div>
    </>
  )
}

function Summary({ draft, again }: { draft: Draft; again: boolean }) {
  const { t } = useTranslation()
  const days = (list: Weekday[]) => (list.length > 0 ? list.map((d) => t(`household.weekdays.long.${d}`)).join(', ') : t('onboarding.done.none'))
  const adults = [
    `${draft.name.trim() || t('onboarding.me')}${parseTarget(draft.target) ? ` (${parseTarget(draft.target)} g)` : ''}`,
    ...draft.others
      .filter((p) => p.kind === 'adult')
      .map((p) => `${p.name.trim() || t('household.adult')}${parseTarget(p.target) ? ` (${parseTarget(p.target)} g)` : ''}`),
  ]
  const children = draft.others.filter((p) => p.kind === 'child').map((p) => p.name.trim() || t('household.child'))
  const excluded = [...(draft.excludedTags.includes('pork') ? [t('household.food.pork')] : []), ...draft.excludedTerms]
  const rows: [string, string][] = [
    [t('onboarding.done.adults'), adults.join(', ')],
    [t('onboarding.done.children'), children.length > 0 ? children.join(', ') : t('onboarding.done.none')],
    [t('onboarding.done.excluded'), excluded.length > 0 ? excluded.join(', ') : t('onboarding.done.none')],
    [t('onboarding.done.out'), days(draft.noDinnerAtHomeDays)],
    [t('onboarding.done.cheat'), days(draft.cheatDays)],
  ]
  return (
    <>
      <dl className="divide-y rounded-2xl border bg-card">
        {rows.map(([label, value]) => (
          <SummaryRow key={label} label={label} value={value} />
        ))}
      </dl>
      <p className="text-muted-foreground">{again ? t('onboarding.done.textAgain') : t('onboarding.done.text')}</p>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 p-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}
