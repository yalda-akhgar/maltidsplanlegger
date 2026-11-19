import { HeartIcon, MinusIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { recipeAllergens, unlabelledIngredients } from '@/data/allergens'
import { useAllergyText } from '@/features/household/allergy-text'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { formatAmount, formatPortions, householdPortions, roundAmount, unitCount } from '@/data/amounts'
import { localize } from '@/data/localize'
import { recipeNutrition } from '@/data/nutrition'
import type { Recipe } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { cn } from '@/lib/utils'
import { categoryNames, recipeBadges } from './recipe-format'
import type { RecipeData } from './useRecipeData'

type RecipeDetailSheetProps = {
  recipe: Recipe | null
  data: RecipeData
  onClose: () => void
  onToggleFavorite: (recipe: Recipe) => void
  onEdit: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
}

/** Recipe detail in a bottom sheet: stats, portion stepper, scaled ingredients and steps (#83). */
export function RecipeDetailSheet({ recipe, data, onClose, onToggleFavorite, onEdit, onDelete }: RecipeDetailSheetProps) {
  const { t } = useTranslation()
  const language = useLanguage()

  return (
    <BottomSheet
      open={recipe !== null}
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={recipe ? localize(recipe.name, language) : ''}
      description={recipe ? categoryNames(recipe, data.categories, language) : undefined}
      footer={
        recipe ? (
          <div className="flex flex-wrap gap-2 [&>*]:min-w-fit [&>*]:flex-1">
            <Button variant="outline" size="sm" aria-pressed={recipe.favorite} onClick={() => onToggleFavorite(recipe)}>
              <HeartIcon aria-hidden className={cn(recipe.favorite && 'fill-current text-primary-text')} />
              {t('recipes.detail.favorite')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(recipe)}>
              <PencilIcon aria-hidden />
              {t('recipes.detail.edit')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(recipe)}>
              <Trash2Icon aria-hidden />
              {t('recipes.detail.delete')}
            </Button>
          </div>
        ) : null
      }
    >
      {/* Keyed so the portion stepper resets when another recipe is opened. */}
      {recipe ? <RecipeDetailBody key={recipe.id} recipe={recipe} data={data} /> : null}
    </BottomSheet>
  )
}

/**
 * Stats, allergens, portion stepper, scaled ingredients and steps. Also used
 * in the week plan's meal sheet, with the meal's safe alternatives already in
 * `recipe` (#180).
 */
export function RecipeDetailBody({ recipe, data, initialPortions }: { recipe: Recipe; data: RecipeData; initialPortions?: number }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const nutrition = recipeNutrition(recipe, data.ingredientMap)
  const allergyText = useAllergyText(data.ingredientMap, () => '')
  const allergens = recipeAllergens(recipe, data.ingredientMap)
  const unlabelled = unlabelledIngredients(recipe, data.ingredientMap)
  const household = householdPortions(data.household)
  const [portions, setPortions] = useState(initialPortions && initialPortions > 0 ? initialPortions : household > 0 ? household : recipe.servings)
  const factor = portions / (recipe.servings || 1)
  const badges = recipeBadges(recipe, t)

  const stats = [
    { value: t('recipes.detail.grams', { value: Math.round(nutrition.proteinG) }), label: t('recipes.detail.protein') },
    { value: t('recipes.minutes', { count: recipe.timeMinutes }), label: t('recipes.detail.time') },
    { value: String(Math.round(nutrition.kcal)), label: t('recipes.detail.kcal') },
  ]

  return (
    <div className="space-y-6">
      {badges.length > 0 || nutrition.incomplete ? (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <Badge key={badge} variant="secondary">
              {badge}
            </Badge>
          ))}
          {nutrition.incomplete ? <Badge variant="destructive">{t('recipes.nutritionMissing')}</Badge> : null}
        </div>
      ) : null}

      <dl className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse rounded-xl bg-secondary p-3 text-center">
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="text-lg font-bold text-secondary-foreground">{stat.value}</dd>
          </div>
        ))}
      </dl>
      {nutrition.incomplete ? <p className="text-sm text-muted-foreground">{t('recipes.detail.nutritionMissing')}</p> : null}

      <div className="space-y-1 text-sm">
        <p className="font-medium">
          {allergens.length > 0 ? t('allergens.contains', { list: allergyText.allergenList(allergens) }) : t('allergens.containsNone')}
        </p>
        {unlabelled.length > 0 ? <p className="text-warning-foreground">{allergyText.notStatedText(unlabelled)}</p> : null}
      </div>

      <section aria-labelledby="recipe-ingredients">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="recipe-ingredients" className="font-semibold">
            {t('recipes.detail.ingredients')}
          </h3>
          <div role="group" aria-label={t('recipes.detail.portions')} className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={t('recipes.detail.fewer')}
              disabled={portions <= 0.5}
              onClick={() => setPortions((p) => Math.max(0.5, p - 0.5))}
            >
              <MinusIcon />
            </Button>
            <output aria-live="polite" className="min-w-24 text-center text-sm font-semibold">
              {formatPortions(portions, language)} {t('recipes.detail.portions').toLowerCase()}
            </output>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={t('recipes.detail.more')}
              onClick={() => setPortions((p) => p + 0.5)}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">{t('recipes.detail.portionsHint')}</p>
        <ul className="divide-y rounded-xl border bg-card">
          {recipe.ingredients.map((line, index) => {
            const ingredient = data.ingredientMap.get(line.ingredientId)
            const amount = roundAmount(line.amount * factor, line.unit, ingredient)
            return (
              <li key={`${line.ingredientId}-${index}`} className="flex gap-3 px-4 py-2.5">
                <span className="w-24 shrink-0 font-medium tabular-nums">
                  {formatAmount(amount, language)} {t(`units.short.${line.unit}`, { count: unitCount(amount) })}
                </span>
                <span className="min-w-0 break-words">
                  {localize(ingredient?.name, language)}
                  {line.note ? <span className="text-muted-foreground">, {localize(line.note, language)}</span> : null}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {recipe.steps.length > 0 ? (
        <section aria-labelledby="recipe-steps">
          <h3 id="recipe-steps" className="mb-3 font-semibold">
            {t('recipes.detail.steps')}
          </h3>
          <ol className="space-y-3">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                >
                  {index + 1}
                </span>
                <span className="pt-0.5">{localize(step, language)}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">{t('allergens.disclaimer')}</p>
    </div>
  )
}
