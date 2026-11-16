import { CheckIcon } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * A selectable pill, used for filters and multiple-choice settings.
 * The selected state is shown with a check mark as well as colour
 * (WCAG 1.4.1: colour is never the only signal) and exposed via aria-pressed.
 */
function Chip({
  selected = false,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-slot="chip"
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
        selected
          ? 'border-primary bg-primary pl-3 text-primary-foreground'
          : 'border-input bg-card text-foreground hover:bg-secondary',
        className,
      )}
      {...props}
    >
      {selected ? <CheckIcon aria-hidden /> : null}
      {children}
    </button>
  )
}

export { Chip }
