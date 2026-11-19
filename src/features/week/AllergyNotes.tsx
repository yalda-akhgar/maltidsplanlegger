import { CircleMinusIcon, HelpCircleIcon, ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AllergyNoteTexts = { withText?: string; conflicts: string[]; omitted?: string[]; unknown?: string }

/**
 * Allergy labels on a dish (#180, #181), always text + icon, never colour alone:
 * red "Contains gluten – not for Noah", yellow "Allergens not stated",
 * neutral "With gluten-free pasta" and "Without black pepper for Yalda".
 */
export function AllergyNotes({ notes, className }: { notes: AllergyNoteTexts; className?: string }) {
  const label = 'inline-flex items-start gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold [&_svg]:mt-px [&_svg]:size-3.5 [&_svg]:shrink-0'
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {notes.conflicts.map((text) => (
        <span key={text} className={cn(label, 'bg-destructive/10 text-destructive')}>
          <TriangleAlertIcon aria-hidden />
          {text}
        </span>
      ))}
      {notes.unknown ? (
        <span className={cn(label, 'bg-warning text-warning-foreground')}>
          <HelpCircleIcon aria-hidden />
          {notes.unknown}
        </span>
      ) : null}
      {notes.withText ? (
        <span className={cn(label, 'bg-secondary text-secondary-foreground')}>
          <ShieldCheckIcon aria-hidden />
          {notes.withText}
        </span>
      ) : null}
      {notes.omitted?.map((text) => (
        <span key={text} className={cn(label, 'bg-secondary text-secondary-foreground')}>
          <CircleMinusIcon aria-hidden />
          {text}
        </span>
      ))}
    </div>
  )
}
