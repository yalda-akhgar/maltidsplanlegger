import { ArrowLeftIcon, PlusIcon, XIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from '@/lib/toast'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { localize } from '@/data/localize'
import { newId, repository } from '@/data/repository'
import { UNITS, type Ingredient, type Language, type LocalizedText, type Recipe, type RecipeIngredient, type Unit } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { householdNotTolerated } from '@/data/allergens'
import { IngredientPicker } from './IngredientPicker'
import { recipeRelevance } from '@/data/relevance'
import { useRecipeData, type RecipeData } from './useRecipeData'

type LineState = { key: string; ingredientId: string; amount: string; unit: Unit; note?: LocalizedText; omittable?: boolean }
type StepState = { key: string; text: string; original?: LocalizedText }

type FormState = {
  name: string
  categoryIds: string[]
  timeMinutes: string
  servings: string
  kidFriendly: boolean
  snackKind: 'healthy' | 'cheat'
  lines: LineState[]
  steps: StepState[]
}

type Errors = Partial<Record<'name' | 'categoryIds' | 'timeMinutes' | 'servings' | 'lines', string>>

const parsePositive = (value: string) => {
  const n = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/**
 * Keeps all translations of unchanged text; edited text is stored only in the
 * language it was written in (#65).
 */
const keepOrReplace = (original: LocalizedText | undefined, value: string, language: Language): LocalizedText =>
  original && localize(original, language) === value ? original : { [language]: value }

function initialState(recipe: Recipe | undefined, language: Language): FormState {
  return {
    name: recipe ? localize(recipe.name, language) : '',
    categoryIds: recipe?.categoryIds ?? [],
    timeMinutes: recipe ? String(recipe.timeMinutes) : '',
    servings: recipe ? String(recipe.servings) : '',
    kidFriendly: recipe?.kidFriendly ?? false,
    snackKind: recipe?.snackKind ?? 'healthy',
    lines: (recipe?.ingredients ?? []).map((line) => ({
      key: newId(),
      ingredientId: line.ingredientId,
      amount: String(line.amount).replace('.', language === 'en' ? '.' : ','),
      unit: line.unit,
      note: line.note,
      ...(line.omittable ? { omittable: true } : {}),
    })),
    steps: (recipe?.steps ?? []).map((step) => ({ key: newId(), text: localize(step, language), original: step })),
  }
}

/** Add or edit a recipe on its own page (#85, #87). */
export function RecipeFormScreen() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { data } = useRecipeData()
  const isEdit = id !== undefined
  const recipe = isEdit ? data?.recipes.find((r) => r.id === id) : undefined
  const title = isEdit ? t('recipes.form.editTitle') : t('recipes.form.newTitle')

  if (!data) return <PageHeader title={title} />
  if (isEdit && !recipe) {
    return (
      <>
        <BackButton />
        <PageHeader title={title} />
        <p className="text-muted-foreground">{t('recipes.form.notFound')}</p>
      </>
    )
  }
  return <RecipeForm key={id ?? 'new'} title={title} recipe={recipe} data={data} />
}

function useGoBack() {
  const navigate = useNavigate()
  const location = useLocation()
  // Go back in history if we came from inside the app, otherwise to the list.
  return () => (location.key !== 'default' ? navigate(-1) : navigate('/recipes', { replace: true }))
}

function BackButton() {
  const { t } = useTranslation()
  const goBack = useGoBack()
  return (
    <Button variant="ghost" className="mb-2 -ml-3" onClick={goBack}>
      <ArrowLeftIcon aria-hidden />
      {t('common.back')}
    </Button>
  )
}

function RecipeForm({ title, recipe, data }: { title: string; recipe: Recipe | undefined; data: RecipeData }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const goBack = useGoBack()
  const uid = useId()
  const [initial] = useState<FormState>(() => initialState(recipe, language))
  const [form, setForm] = useState<FormState>(initial)
  const [submitted, setSubmitted] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [ingredients, setIngredients] = useState(data.ingredients)
  const summaryRef = useRef<HTMLDivElement>(null)
  const leavingAfterSave = useRef(false)

  // Warn before unsaved changes are lost (#93): in-app navigation, Android back, reload/close.
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !leavingAfterSave.current && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])
  const focusStepKey = useRef<string | null>(null)

  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]))
  const isSnack = form.categoryIds.includes('snack')
  // Only what is relevant to this household (#195): meals it doesn't eat, the snack type without
  // a snack and "Kid-friendly" without children are hidden. Hidden values are kept when saving.
  const relevance = recipeRelevance(data.household, data.categories)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const validate = (f: FormState): Errors => {
    const e: Errors = {}
    if (!f.name.trim()) e.name = t('recipes.form.errors.name')
    if (f.categoryIds.length === 0) e.categoryIds = t('recipes.form.errors.categories')
    if (parsePositive(f.timeMinutes) === undefined) e.timeMinutes = t('recipes.form.errors.number')
    if (parsePositive(f.servings) === undefined) e.servings = t('recipes.form.errors.number')
    if (f.lines.some((l) => parsePositive(l.amount) === undefined)) e.lines = t('recipes.form.errors.amounts')
    return e
  }

  // After the first save attempt, errors update live while the user fixes them.
  const errors: Errors = submitted ? validate(form) : {}

  // Move focus into a newly added step field.
  useEffect(() => {
    if (!focusStepKey.current) return
    document.getElementById(`${uid}-step-${focusStepKey.current}`)?.focus()
    focusStepKey.current = null
  }, [form.steps, uid])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    const found = validate(form)
    if (Object.keys(found).length > 0) {
      // Announce and show the problem (WCAG 3.3.1).
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    const now = new Date().toISOString()
    const lines: RecipeIngredient[] = form.lines.map((l) => ({
      ingredientId: l.ingredientId,
      amount: parsePositive(l.amount) ?? 0,
      unit: l.unit,
      ...(l.note ? { note: l.note } : {}),
      ...(l.omittable ? { omittable: true } : {}),
    }))
    const saved: Recipe = {
      ...(recipe ?? { id: newId(), tags: [], favorite: false, source: 'user' as const, createdAt: now, updatedAt: now }),
      name: keepOrReplace(recipe?.name, form.name.trim(), language),
      categoryIds: form.categoryIds,
      timeMinutes: parsePositive(form.timeMinutes) ?? 0,
      servings: parsePositive(form.servings) ?? 1,
      kidFriendly: form.kidFriendly,
      ingredients: lines,
      steps: form.steps
        .filter((s) => s.text.trim())
        .map((s) => keepOrReplace(s.original, s.text.trim(), language)),
    }
    if (isSnack) saved.snackKind = form.snackKind
    else delete saved.snackKind
    await repository.saveRecipe(saved)
    toast(t('recipes.saved'))
    leavingAfterSave.current = true
    goBack()
  }

  const addIngredient = (ingredient: Ingredient) => {
    if (!ingredients.some((i) => i.id === ingredient.id)) setIngredients((list) => [...list, ingredient])
    const unit: Unit = ingredient.gramsPerUnit.pcs ? 'pcs' : 'g'
    set('lines', [...form.lines, { key: newId(), ingredientId: ingredient.id, amount: '', unit }])
    // Focus the new amount field once rendered.
    requestAnimationFrame(() => {
      const fields = document.querySelectorAll<HTMLInputElement>(`[data-amount-field="${uid}"]`)
      fields[fields.length - 1]?.focus()
    })
  }
  const updateLine = (key: string, patch: Partial<LineState>) =>
    set('lines', form.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const addStep = () => {
    const key = newId()
    focusStepKey.current = key
    set('steps', [...form.steps, { key, text: '' }])
  }

  const errorList = Object.values(errors)
  const fieldError = (field: keyof Errors) =>
    errors[field] ? (
      <p id={`${uid}-${field}-error`} className="text-sm text-destructive">
        {errors[field]}
      </p>
    ) : null
  const describedBy = (field: keyof Errors, extra?: string) =>
    [errors[field] ? `${uid}-${field}-error` : '', extra ?? ''].filter(Boolean).join(' ') || undefined

  return (
    <>
      <BackButton />
      <PageHeader title={title} />

      <form onSubmit={(e) => void save(e)} noValidate className="space-y-6 pb-4">
        {errorList.length > 0 ? (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            className="rounded-xl border border-destructive bg-card p-4 text-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-semibold">{t('recipes.form.errorSummary')}</p>
            <ul className="mt-1 list-disc pl-5">
              {[...new Set(errorList)].map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Field id={`${uid}-name`} label={t('recipes.form.name')}>
          <Input
            id={`${uid}-name`}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name')}
            autoComplete="off"
          />
          {fieldError('name')}
        </Field>

        <fieldset className="space-y-2" aria-describedby={describedBy('categoryIds')}>
          <legend className="mb-2 text-sm font-medium">{t('recipes.form.categories')}</legend>
          <div className="flex flex-wrap gap-2">
            {relevance.categories.map((c) => {
              const selected = form.categoryIds.includes(c.id)
              return (
                <Chip
                  key={c.id}
                  selected={selected}
                  onClick={() =>
                    set('categoryIds', selected ? form.categoryIds.filter((x) => x !== c.id) : [...form.categoryIds, c.id])
                  }
                >
                  {localize(c.name, language)}
                </Chip>
              )
            })}
          </div>
          {fieldError('categoryIds')}
        </fieldset>

        {isSnack && relevance.snackKind ? (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t('recipes.form.snackKind')}</legend>
            <div className="flex flex-wrap gap-2">
              {(['healthy', 'cheat'] as const).map((kind) => (
                <Chip key={kind} selected={form.snackKind === kind} onClick={() => set('snackKind', kind)}>
                  {t(`recipes.${kind}`)}
                </Chip>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${uid}-time`} label={t('recipes.form.time')}>
            <Input
              id={`${uid}-time`}
              inputMode="numeric"
              value={form.timeMinutes}
              onChange={(e) => set('timeMinutes', e.target.value)}
              aria-invalid={Boolean(errors.timeMinutes)}
              aria-describedby={describedBy('timeMinutes')}
            />
            {fieldError('timeMinutes')}
          </Field>
          <Field id={`${uid}-servings`} label={t('recipes.form.servings')}>
            <Input
              id={`${uid}-servings`}
              inputMode="decimal"
              value={form.servings}
              onChange={(e) => set('servings', e.target.value)}
              aria-invalid={Boolean(errors.servings)}
              aria-describedby={describedBy('servings', `${uid}-servings-hint`)}
            />
            <p id={`${uid}-servings-hint`} className="text-sm text-muted-foreground">
              {t('recipes.form.servingsHint')}
            </p>
            {fieldError('servings')}
          </Field>
        </div>

        {relevance.kidFriendly ? (
          <div className="flex min-h-11 items-center justify-between gap-4 rounded-xl border bg-card px-4 py-2">
            <label htmlFor={`${uid}-kid`} className="font-medium">
              {t('recipes.form.kidFriendly')}
            </label>
            <Switch id={`${uid}-kid`} checked={form.kidFriendly} onCheckedChange={(v) => set('kidFriendly', v)} />
          </div>
        ) : null}

        <fieldset className="space-y-3" aria-describedby={describedBy('lines')}>
          <legend className="mb-2 text-lg font-semibold">{t('recipes.form.ingredients')}</legend>
          {form.lines.length === 0 ? <p className="text-sm text-muted-foreground">{t('recipes.form.noIngredients')}</p> : null}
          <ul className="space-y-2">
            {form.lines.map((line) => {
              const name = localize(ingredientMap.get(line.ingredientId)?.name, language)
              const invalid = submitted && parsePositive(line.amount) === undefined
              return (
                <li key={line.key} className="rounded-xl border bg-card p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="min-w-0 font-medium break-words">{name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="-my-2 rounded-full"
                      aria-label={t('recipes.form.removeIngredient', { name })}
                      onClick={() => set('lines', form.lines.filter((l) => l.key !== line.key))}
                    >
                      <XIcon />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      data-amount-field={uid}
                      inputMode="decimal"
                      aria-label={t('recipes.form.amountFor', { name })}
                      placeholder={t('recipes.form.amount')}
                      value={line.amount}
                      onChange={(e) => updateLine(line.key, { amount: e.target.value })}
                      aria-invalid={invalid}
                    />
                    <NativeSelect
                      aria-label={t('recipes.form.unitFor', { name })}
                      value={line.unit}
                      onChange={(e) => updateLine(line.key, { unit: e.target.value as Unit })}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {t(`units.long.${u}`)} ({t(`units.short.${u}`)})
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="mt-2 flex min-h-11 items-center justify-between gap-3">
                    <label htmlFor={`${uid}-${line.key}-omit`} className="min-w-0 text-sm">
                      {t('recipes.form.omittable')}
                      <span className="block text-xs text-muted-foreground">{t('recipes.form.omittableHint')}</span>
                    </label>
                    <Switch
                      id={`${uid}-${line.key}-omit`}
                      aria-label={t('recipes.form.omittableFor', { name })}
                      checked={line.omittable === true}
                      onCheckedChange={(v) => updateLine(line.key, { omittable: v })}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
          {fieldError('lines')}
          <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
            <PlusIcon aria-hidden />
            {t('recipes.form.addIngredient')}
          </Button>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-lg font-semibold">{t('recipes.form.steps')}</legend>
          <ol className="space-y-2">
            {form.steps.map((step, index) => (
              <li key={step.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor={`${uid}-step-${step.key}`} className="text-sm font-medium">
                    {t('recipes.form.step', { n: index + 1 })}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={t('recipes.form.removeStep', { n: index + 1 })}
                    onClick={() => set('steps', form.steps.filter((s) => s.key !== step.key))}
                  >
                    <XIcon />
                  </Button>
                </div>
                <Textarea
                  id={`${uid}-step-${step.key}`}
                  value={step.text}
                  rows={2}
                  onChange={(e) =>
                    set('steps', form.steps.map((s) => (s.key === step.key ? { ...s, text: e.target.value } : s)))
                  }
                />
              </li>
            ))}
          </ol>
          <Button type="button" variant="outline" onClick={addStep}>
            <PlusIcon aria-hidden />
            {t('recipes.form.addStep')}
          </Button>
        </fieldset>

        <div className="flex flex-wrap gap-2 border-t pt-6">
          <Button type="submit" size="lg">
            {t('recipes.form.save')}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={goBack}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title={t('recipes.form.unsaved.title')}
        description={t('recipes.form.unsaved.description')}
        cancelLabel={t('recipes.form.unsaved.keepEditing')}
        confirmLabel={t('recipes.form.unsaved.discard')}
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />

      <IngredientPicker
        notToleratedIds={householdNotTolerated(data.household)}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        ingredients={ingredients}
        onPick={addIngredient}
      />
    </>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
