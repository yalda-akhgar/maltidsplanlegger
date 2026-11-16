import { HeartIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RecipeCardProps = {
  name: string
  meta: string
  badges: string[]
  favorite: boolean
  onOpen: () => void
  onToggleFavorite: () => void
}

/** One recipe in the list: initial tile, name, "Middag · 25 min · 42 g protein", badges and a heart (#80, #81). */
export function RecipeCard({ name, meta, badges, favorite, onOpen, onToggleFavorite }: RecipeCardProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1 rounded-2xl border bg-card p-2 pr-1">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground"
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block font-semibold break-words">{name}</span>
          <span className="block text-sm text-muted-foreground">{meta}</span>
          {badges.length > 0 ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {badges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </span>
          ) : null}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label={t('recipes.favorite', { name })}
        aria-pressed={favorite}
        onClick={onToggleFavorite}
      >
        <HeartIcon className={cn(favorite ? 'fill-current text-primary-text' : 'text-muted-foreground')} />
      </Button>
    </div>
  )
}
