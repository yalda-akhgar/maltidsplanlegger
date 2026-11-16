import { useSyncExternalStore } from 'react'

/**
 * Tracks whether and how the app can be installed on this device.
 *
 * - Android / Chromium browsers fire `beforeinstallprompt`, which we keep so
 *   our own "Install" button can trigger the native install dialog.
 * - iPhone/iPad never fire it; users install via Share → "Add to Home Screen".
 * - Other browsers get manual instructions.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallMode = 'installed' | 'prompt' | 'ios' | 'manual'

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installedNow = false
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Must run early (before React renders) so the event isn't missed. */
export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installedNow = true
    emit()
  })
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true
}

function isIos(): boolean {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac, but has touch.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

function getMode(): InstallMode {
  if (installedNow || isStandalone()) return 'installed'
  if (deferredPrompt) return 'prompt'
  if (isIos()) return 'ios'
  return 'manual'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, getMode, getMode)
}

/** Opens the native install dialog. Returns true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  const event = deferredPrompt
  deferredPrompt = null
  emit()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted'
}
