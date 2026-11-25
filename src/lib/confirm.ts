/**
 * Asking for confirmation from anywhere – also from a toast button, outside
 * any screen (#194). The dialog itself is `ConfirmHost`, mounted once in
 * `main.tsx`.
 */
export interface ConfirmRequest {
  title: string
  description: string
  cancelLabel: string
  confirmLabel: string
}

type Show = (request: ConfirmRequest, resolve: (ok: boolean) => void) => void
let show: Show | null = null

/** Registers the dialog host (returns the unregister function). */
export function registerConfirmHost(host: Show): () => void {
  show = host
  return () => {
    if (show === host) show = null
  }
}

/** Shows the confirmation dialog; resolves true for "confirm", false for cancel (or when no host is mounted). */
export function askConfirm(request: ConfirmRequest): Promise<boolean> {
  return new Promise((resolve) => (show ? show(request, resolve) : resolve(false)))
}
