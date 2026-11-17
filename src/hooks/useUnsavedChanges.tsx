import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

/**
 * Warns before unsaved changes are lost (#93): in-app navigation, Android
 * back, reload/close. Call `allowLeave()` right before navigating after saving.
 */
export function useUnsavedChanges(dirty: boolean) {
  const { t } = useTranslation()
  const leaving = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const dialog = (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title={t('recipes.form.unsaved.title')}
      description={t('recipes.form.unsaved.description')}
      cancelLabel={t('recipes.form.unsaved.keepEditing')}
      confirmLabel={t('recipes.form.unsaved.discard')}
      onCancel={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
    />
  )
  return {
    dialog,
    allowLeave: () => {
      leaving.current = true
    },
  }
}
