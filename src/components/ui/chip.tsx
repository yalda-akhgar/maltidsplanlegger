import type * as React from 'react'
import { cn } from '@/lib/utils'

/** A selectable pill, used for filters and multiple-choice settings. */
function Chip({
  selected = false,
  className,
  ...props
}: React.ComponentProps<'button'> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-slot="chip"
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-secondary',
        className,
      )}
      {...props}
    />
  )
}

export { Chip }
