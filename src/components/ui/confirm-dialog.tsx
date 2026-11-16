import { AlertDialog } from 'radix-ui'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  /** Safe choice; also used for Escape. Gets focus when the dialog opens. */
  cancelLabel: string
  /** Destructive choice. */
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

/** Centered confirmation dialog for destructive choices (Radix AlertDialog: focus trap, Escape = cancel). */
export function ConfirmDialog({ open, title, description, cancelLabel, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => (next ? undefined : onCancel())}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-popover p-6 text-popover-foreground shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-muted-foreground">{description}</AlertDialog.Description>
          <div className="mt-6 flex flex-col gap-2">
            {/* Plain buttons: Radix Cancel/Action would also fire onOpenChange, i.e. cancel after confirm. */}
            <Button autoFocus onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
