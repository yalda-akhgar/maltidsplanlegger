import { toast as sonnerToast } from 'sonner'

type Toast = typeof sonnerToast

/** Wraps a sonner function so the previous message is removed first. */
function single<F extends (...args: never[]) => unknown>(fn: F): F {
  return ((...args: Parameters<F>) => {
    sonnerToast.dismiss()
    return fn(...args)
  }) as F
}

/**
 * The app's toast: never more than one message at a time – a new message
 * replaces the old one (#148). Use this instead of importing from 'sonner'.
 */
export const toast: Toast = Object.assign(single(sonnerToast), sonnerToast, {
  success: single(sonnerToast.success),
  info: single(sonnerToast.info),
  warning: single(sonnerToast.warning),
  error: single(sonnerToast.error),
  message: single(sonnerToast.message),
})
