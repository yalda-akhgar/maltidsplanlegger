import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { registerConfirmHost, type ConfirmRequest } from '@/lib/confirm'

/** The dialog behind `askConfirm` (#194). Mounted once, next to the toaster. */
export function ConfirmHost() {
  const [pending, setPending] = useState<{ request: ConfirmRequest; resolve: (ok: boolean) => void } | null>(null)
  useEffect(() => registerConfirmHost((request, resolve) => setPending({ request, resolve })), [])
  const answer = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
  }
  return (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.request.title ?? ''}
      description={pending?.request.description ?? ''}
      cancelLabel={pending?.request.cancelLabel ?? ''}
      confirmLabel={pending?.request.confirmLabel ?? ''}
      onCancel={() => answer(false)}
      onConfirm={() => answer(true)}
    />
  )
}
