import { useEffect, useRef } from 'react'

/**
 * Lets the Android back button (and browser back) close an open sheet or
 * dialog instead of leaving the screen.
 *
 * While `open` is true, an extra history entry is pushed. Pressing back pops
 * it and calls `onClose`. If the sheet is closed another way (swipe, button),
 * the extra entry is removed again so history stays clean.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return

    const id = Math.random().toString(36).slice(2)
    let pushed = false
    let closedByBack = false

    // Deferred so React StrictMode's mount → unmount → mount in development
    // doesn't leave stray history entries behind.
    const timer = window.setTimeout(() => {
      window.history.pushState({ ...window.history.state, __sheet: id }, '')
      pushed = true
    }, 0)

    const onPopState = () => {
      if (pushed && window.history.state?.__sheet !== id) {
        closedByBack = true
        onCloseRef.current()
      }
    }
    window.addEventListener('popstate', onPopState)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('popstate', onPopState)
      if (pushed && !closedByBack && window.history.state?.__sheet === id) {
        window.history.back()
      }
    }
  }, [open])
}
