import { PlusIcon, SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { askConfirm } from '@/lib/confirm'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { localize } from '@/data/localize'
import { recipeNutrition } from '@/data/nutrition'
import { removeRecipeFromPlans } from '@/data/planner'
import { recipeRelevance } from '@/data/relevance'
import { repository } from '@/data/repository'
import { toIsoDate } from '@/data/week'
import type { Recipe } from '@/data/types'
import { useLanguage } from '@/i18n/useLanguage'
import { RecipeCard } from './RecipeCard'
import { RecipeDetailSheet } from './RecipeDetailSheet'
import { categoryNames, recipeBadges } from './recipe-format'
import { useRecipeData } from './useRecipeData'

/** Filter: all, a category id, favourites or kid-friendly (#79). */
type Filter = { kind: 'all' } | { kind: 'category'; id: string } | { kind: 'favorites' } | { kind: 'kidFriendly' }

const sameFilter = (a: Filter, b: Filter) =>
  a.kind === b.kind && (a.kind !== 'category' || (b.kind === 'category' && a.id === b.id))

export function RecipesScreen() {
  const { t } = useTranslation()
  const language = useLanguage()
  const navigate = useNavigate()
  const { data, reload, updateRecipe } = useRecipeData()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>({ kind: 'all' })
  const [openId, setOpenId] = useState<string | null>(null)

  // Only what is relevant to this household (#195): "Kid-friendly" without children and
  // meals the household doesn't eat are hidden; an active filter that disappears falls back to "All".
  const relevance = useMemo(() => (data ? recipeRelevance(data.household, data.categories) : null), [data])
  const activeFilter = useMemo<Filter>(
    () =>
      (filter.kind === 'kidFriendly' && !relevance?.kidFriendly) ||
      (filter.kind === 'category' && !relevance?.categories.some((c) => c.id === filter.id))
        ? { kind: 'all' }
        : filter,
    [filter, relevance],
  )

  const visible = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLocaleLowerCase(language)
    return data.recipes
      .filter((r) => {
        if (activeFilter.kind === 'category' && !r.categoryIds.includes(activeFilter.id)) return false
        if (activeFilter.kind === 'favorites' && !r.favorite) return false
        if (activeFilter.kind === 'kidFriendly' && !r.kidFriendly) return false
        if (!q) return true
        // Matches the recipe name or any ingredient name in the current language (#92).
        const names = [r.name, ...r.ingredients.map((line) => data.ingredientMap.get(line.ingredientId)?.name)]
        return names.some((name) => localize(name, language).toLocaleLowerCase(language).includes(q))
      })
      .sort((a, b) => localize(a.name, language).localeCompare(localize(b.name, language), language)) // #82
  }, [data, query, activeFilter, language])

  if (!data || !relevance) return <PageHeader title={t('screens.recipes.title')} />

  const openRecipe = data.recipes.find((r) => r.id === openId) ?? null
  const favoriteCount = data.recipes.filter((r) => r.favorite).length

  const toggleFavorite = (recipe: Recipe) => {
    const updated = { ...recipe, favorite: !recipe.favorite }
    updateRecipe(updated)
    void repository.saveRecipe(updated)
  }

  // Deleting a recipe is big: always ask first, naming it (#195, replaces undo in the toast #88).
  // The dish leaves the week plan from today on; days that have been stay as they were.
  const deleteRecipe = async (recipe: Recipe) => {
    const name = localize(recipe.name, language)
    const ok = await askConfirm({
      title: t('recipes.deleteConfirm.title', { name }),
      description: t('recipes.deleteConfirm.text'),
      cancelLabel: t('common.cancel'),
      confirmLabel: t('recipes.deleteConfirm.confirm'),
    })
    if (!ok) return
    setOpenId(null)
    await repository.deleteRecipe(recipe.id)
    const changed = removeRecipeFromPlans(await repository.listWeekPlans(), recipe.id, toIsoDate(new Date()))
    for (const plan of changed) await repository.saveWeekPlan(plan)
    await reload()
  }

  const filters: { filter: Filter; label: string }[] = [
    { filter: { kind: 'all' }, label: t('recipes.all') },
    ...relevance.categories.map((c) => ({ filter: { kind: 'category', id: c.id } as Filter, label: localize(c.name, language) })),
    { filter: { kind: 'favorites' }, label: t('recipes.favorites') },
    ...(relevance.kidFriendly ? [{ filter: { kind: 'kidFriendly' } as Filter, label: t('recipes.kidFriendly') }] : []),
  ]

  return (
    <>
      <PageHeader
        title={t('screens.recipes.title')}
        subtitle={`${t('recipes.recipeCount', { count: data.recipes.length })} · ${t('recipes.favoriteCount', { count: favoriteCount })}`}
        actions={
          <Button onClick={() => navigate('/recipes/new')}>
            <PlusIcon aria-hidden />
            {t('recipes.newRecipe')}
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="relative">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t('recipes.search')}
            placeholder={t('recipes.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11"
          />
        </div>

        <div role="group" aria-label={t('recipes.filters')} className="flex flex-wrap gap-2">
          {filters.map(({ filter: f, label }) => (
            <Chip key={label} selected={sameFilter(activeFilter, f)} onClick={() => setFilter(f)}>
              {label}
            </Chip>
          ))}
        </div>

        <p role="status" className="sr-only">
          {t('recipes.showing', { count: visible.length })}
        </p>

        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center text-muted-foreground">
            {t('recipes.empty')}
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {visible.map((recipe) => {
              const name = localize(recipe.name, language)
              const protein = Math.round(recipeNutrition(recipe, data.ingredientMap).proteinG)
              const meta = [
                categoryNames(recipe, relevance.categories, language),
                t('recipes.minutes', { count: recipe.timeMinutes }),
                t('recipes.proteinG', { value: protein }),
              ]
                .filter(Boolean)
                .join(' · ')
              return (
                <li key={recipe.id}>
                  <RecipeCard
                    name={name}
                    meta={meta}
                    badges={recipeBadges(recipe, t, relevance)}
                    favorite={recipe.favorite}
                    onOpen={() => setOpenId(recipe.id)}
                    onToggleFavorite={() => toggleFavorite(recipe)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <RecipeDetailSheet
        recipe={openRecipe}
        data={data}
        onClose={() => setOpenId(null)}
        onToggleFavorite={toggleFavorite}
        // Replace the sheet's history entry, so Back from the form returns to the list.
        onEdit={(recipe) => navigate(`/recipes/${recipe.id}/edit`, { replace: true })}
        onDelete={(recipe) => void deleteRecipe(recipe)}
        onIngredientSaved={() => void reload()}
      />
    </>
  )
}
