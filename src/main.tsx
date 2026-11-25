import { ThemeProvider } from 'next-themes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { registerSW } from 'virtual:pwa-register'
import './i18n'
import './index.css'
import { router } from './app/router'
import { ConfirmHost } from './components/ConfirmHost'
import { Toaster } from './components/ui/sonner'
import { initInstallPrompt } from './features/install/install-prompt'

initInstallPrompt()

// New versions install automatically on next launch (docs/DECISIONS.md #51).
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="mp:theme" disableTransitionOnChange>
      <RouterProvider router={router} />
      <Toaster />
      <ConfirmHost />
    </ThemeProvider>
  </StrictMode>,
)
