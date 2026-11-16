import { XIcon } from 'lucide-react'
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useBackToClose } from '@/hooks/useBackToClose'

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
}

/**
 * Sheet that slides up from the bottom. Closes by swiping down, tapping the
 * backdrop, the close button, or the Android back button.
 */
function BottomSheet({ open, onOpenChange, title, description, footer, children }: BottomSheetProps) {
  const { t } = useTranslation()
  useBackToClose(open, () => onOpenChange(false))

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="relative pr-14 text-left md:text-left">
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          {description ? <DrawerDescription className="text-left">{description}</DrawerDescription> : null}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close')}
          >
            <XIcon />
          </Button>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
        {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
      </DrawerContent>
    </Drawer>
  )
}

export { BottomSheet }
