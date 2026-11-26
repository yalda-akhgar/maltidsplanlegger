import { GlobeIcon, PencilIcon, XIcon, UsersIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { repository } from '@/data/repository'
import { LANGUAGES, type HouseholdSettings, type Ingredient, type Language, type Weekday } from '@/data/types'
import { FoodRows } from '@/features/household/FoodRows'
import { ExcludedFoodFields, WeekRhythmFields } from '@/features/household/FoodAndWeekFields'
import { MealsOnFields } from '@/features/household/MealsOnFields'
import { mealOn, mealsOn } from '@/data/meals'
import { fromDraft, parseTarget, targetInvalid } from '@/features/household/household-draft'
import { PeopleEditor } from '@/features/household/PeopleEditor'
import { toWizardDraft, type Draft } from './wizard-draft'
import { personName } from '@/features/household/person-name'
import { ProteinTargetField } from '@/features/household/ProteinTargetField'
import { withExampleFamily } from '@/features/household/example-family'
import { makeFirstWeekPlan, saveSettings, showSavedToast } from '@/features/household/save-settings'
import { cn } from '@/lib/utils'
import { back, currentStep, edit, isEditing, next, nextReturnsToSummary, skipAll, startNav } from './wizard-nav'

const STEPS = 6


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
  /** The path through the steps: "Back" follows it (#187). */
  const [nav, setNav] = useState(startNav)
  const step = currentStep(nav)
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
    const others = draft.others.map((d) => fromDraft(d))
    const hasSelf =
      draft.name.trim() !== '' || parseTarget(draft.target) !== undefined || draft.allergies.length > 0 || draft.notTolerated.length > 0 || draft.dislikes.length > 0
    const self = fromDraft(
      {
        id: draft.selfId,
        kind: 'adult',
        name: draft.name,
        target: draft.target,
        dislikes: draft.dislikes,
        notTolerated: draft.notTolerated,
        lunchAtHome: false,
        allergies: draft.allergies,
    })
    const household: HouseholdSettings = {
      ...loaded.household,
      people: hasSelf ? [self, ...others] : others,
      excludedTags: draft.excludedTags,
      excludedTerms: draft.excludedTerms,
      noDinnerAtHomeDays: draft.noDinnerAtHomeDays,
      cheatDays: draft.cheatDays,
      proteinSplit: draft.proteinSplit,
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

  /** "Try with an example family" (#176): a finished week plan in one click, for testers and employers. */
  async function tryExample() {
    if (!loaded) return
    setBusy(true)
    const household: HouseholdSettings = { ...withExampleFamily(loaded.household), onboardingDone: true }
    await saveSettings(loaded.household, household)
    await makeFirstWeekPlan(household)
    navigate('/week', { replace: true })
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
          {step === 1 ? <LanguageRow /> : null}
          <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none">
            {title}
          </h1>

          {step === 1 ? <WelcomeStep name={draft.name} onName={(name) => set({ name })} /> : null}
          {step === 1 && !again ? (
            <div className="mt-auto space-y-3 rounded-2xl bg-secondary p-4">
              <p className="text-sm text-secondary-foreground">{t('onboarding.welcome.exampleText')}</p>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void tryExample()}>
                <UsersIcon aria-hidden />
                {t('onboarding.welcome.example')}
              </Button>
            </div>
          ) : null}
          {step === 2 ? (
            <ProteinTargetField label={t('onboarding.protein.label')} value={draft.target} onChange={(target) => set({ target })} withCalculator />
          ) : null}
          {step === 3 ? (
            <>
              <p className="text-muted-foreground">{t('onboarding.household.text')}</p>
              <p className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{t('allergens.wizardNote')}</p>
              <PeopleEditor
                people={draft.others}
                onChange={(others) => set({ others })}
                ingredients={loaded.ingredients}
                lunchOn={mealOn(draft.proteinSplit, 'lunch')}
                selfId={draft.selfId}
                self={
                  <div className="space-y-1 rounded-2xl border bg-card p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{draft.name.trim() || t('onboarding.me')}</span>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        {parseTarget(draft.target) ? t('onboarding.household.youWithTarget', { target: parseTarget(draft.target) }) : t('onboarding.household.you')}
                      </span>
                    </div>
                    <FoodRows name={draft.name.trim() || t('onboarding.me')} value={draft} ingredients={loaded.ingredients} onChange={set} />
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
          {step === 5 ? (
            <div className="space-y-5">
              <MealsOnFields split={draft.proteinSplit} onChange={(proteinSplit) => set({ proteinSplit })} />
              <WeekRhythmFields
                noDinnerAtHomeDays={draft.noDinnerAtHomeDays}
                cheatDays={draft.cheatDays}
                snackOn={mealOn(draft.proteinSplit, 'snack')}
                dinnerOn={mealOn(draft.proteinSplit, 'dinner')}
                lunchOn={mealOn(draft.proteinSplit, 'lunch')}
                onChange={set}
              />
            </div>
          ) : null}
          {step === 6 ? <Summary draft={draft} again={again} onEdit={(first, last) => setNav(edit(nav, first, last))} /> : null}
        </main>

        <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 bg-background py-3">
          {step > 1 || isEditing(nav) ? (
            <Button variant="secondary" onClick={() => setNav(back(nav))}>
              {t('common.back')}
            </Button>
          ) : null}
          {isEditing(nav) ? null : step === 1 ? (
            <Button variant="ghost" className="text-primary-text" onClick={() => setNav(skipAll(nav, STEPS))}>
              {t('onboarding.skipAll')}
            </Button>
          ) : step < STEPS ? (
            <Button variant="ghost" className="text-primary-text" onClick={() => setNav(next(nav, STEPS))}>
              {t('onboarding.skip')}
            </Button>
          ) : null}
          {step < STEPS ? (
            <Button className="ml-auto min-w-28" disabled={invalid} onClick={() => setNav(next(nav, STEPS))}>
              {nextReturnsToSummary(nav) ? t('onboarding.toSummary') : t('onboarding.next')}
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

/**
 * The language choice, at the very top of the first step (#195): the app starts
 * in the phone's language (English if it has none of the app's languages), and
 * one tap changes it.
 */
function LanguageRow() {
  const { t, i18n } = useTranslation()
  const changeLanguage = (language: Language) => {
    repository.setLanguage(language)
    void i18n.changeLanguage(language)
  }
  return (
    <div role="group" aria-label={t('settings.language.title')} className="flex flex-wrap items-center gap-2">
      <GlobeIcon aria-hidden className="size-5 text-muted-foreground" />
      {LANGUAGES.map((language) => (
        <Chip key={language} lang={language} selected={i18n.language === language} onClick={() => changeLanguage(language)}>
          {t(`languages.${language}`)}
        </Chip>
      ))}
    </div>
  )
}

function WelcomeStep({ name, onName }: { name: string; onName: (name: string) => void }) {
  const { t } = useTranslation()
  return (
    <>
      <p className="text-muted-foreground">{t('onboarding.welcome.text')}</p>
      <div className="space-y-1.5">
        <label htmlFor="onboarding-name" className="text-sm font-semibold">
          {t('onboarding.welcome.name')}
        </label>
        <Input id="onboarding-name" value={name} onChange={(e) => onName(e.target.value)} placeholder={t('onboarding.me')} autoComplete="given-name" />
      </div>
    </>
  )
}

function Summary({ draft, again, onEdit }: { draft: Draft; again: boolean; onEdit: (first: number, last?: number) => void }) {
  const { t } = useTranslation()
  const days = (list: Weekday[]) => (list.length > 0 ? list.map((d) => t(`household.weekdays.long.${d}`)).join(', ') : t('onboarding.done.none'))
  // The user's own name and target are set on steps 1–2, so they get their own row (#189).
  const myTarget = parseTarget(draft.target)
  const me = [draft.name.trim() || t('onboarding.me'), ...(myTarget ? [t('onboarding.done.protein', { target: myTarget })] : [])].join(' · ')
  const everyone = [{ id: draft.selfId, kind: 'adult' as const }, ...draft.others]
  const adults = draft.others
    .filter((p) => p.kind === 'adult')
    .map((p) => `${personName(p, everyone, t)}${parseTarget(p.target) ? ` (${parseTarget(p.target)} g)` : ''}`)
  const children = draft.others.filter((p) => p.kind === 'child').map((p) => personName(p, everyone, t))
  const excluded = [...(draft.excludedTags.includes('pork') ? [t('household.food.pork')] : []), ...draft.excludedTerms]
  // [label, value, the first step where it is changed, the last one] (#187, #189)
  const rows: [string, string, number, number?][] = [
    [t('onboarding.done.you'), me, 1, 2],
    [t('onboarding.done.adults'), adults.length > 0 ? adults.join(', ') : t('onboarding.done.none'), 3],
    [t('onboarding.done.children'), children.length > 0 ? children.join(', ') : t('onboarding.done.none'), 3],
    [t('onboarding.done.excluded'), excluded.length > 0 ? excluded.join(', ') : t('onboarding.done.none'), 4],
    [t('onboarding.done.meals'), mealsOn(draft.proteinSplit).map((s) => t(`week.slots.${s}`)).join(', '), 5],
    ...(mealOn(draft.proteinSplit, 'dinner') ? [[t('onboarding.done.out'), days(draft.noDinnerAtHomeDays), 5] as [string, string, number]] : []),
    ...(mealOn(draft.proteinSplit, 'snack') ? [[t('onboarding.done.cheat'), days(draft.cheatDays), 5] as [string, string, number]] : []),
  ]
  return (
    <>
      <ul className="divide-y rounded-2xl border bg-card">
        {rows.map(([label, value, first, last]) => (
          <SummaryRow key={label} label={label} value={value} onEdit={() => onEdit(first, last)} />
        ))}
      </ul>
      <p className="text-muted-foreground">{again ? t('onboarding.done.textAgain') : t('onboarding.done.text')}</p>
    </>
  )
}

/** A summary row is a button: it opens the step where the value is changed (#187). */
function SummaryRow({ label, value, onEdit }: { label: string; value: React.ReactNode; onEdit: () => void }) {
  const { t } = useTranslation()
  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        aria-label={t('onboarding.done.edit', { label })}
        className="flex min-h-11 w-full items-center justify-between gap-4 rounded-2xl p-3 text-left text-sm outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2 text-right font-semibold">
          {value}
          <PencilIcon aria-hidden className="size-4 shrink-0 text-primary-text" />
        </span>
      </button>
    </li>
  )
}
