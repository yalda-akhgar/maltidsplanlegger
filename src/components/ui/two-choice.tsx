import { cn } from '@/lib/utils'

type TwoChoiceProps<T extends string> = {
  /** Accessible name of the group, e.g. "Milk: have or buy". */
  label: string
  options: readonly [{ value: T; label: string }, { value: T; label: string }]
  value: T
  onChange: (value: T) => void
}

/**
 * Two buttons side by side, the chosen one filled: "Have | Buy", "Have |
 * Empty", "List | Categories" (#184 point 4, #194). Never a checkbox, so it is
 * always clear what the choice means.
 */
export function TwoChoice<T extends string>({ label, options, value, onChange }: TwoChoiceProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-xl border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-11 min-w-16 rounded-lg px-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
