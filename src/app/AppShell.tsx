import { UtensilsIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from './nav-items'

const THEME_COLORS = { light: '#faf9fc', dark: '#14121b' } as const

/**
 * App layout: bottom navigation on mobile, side navigation from 1024 px
 * (docs/DECISIONS.md #48). Respects iPhone/Android safe areas.
 */
export function AppShell() {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()

  // Colour the phone's status bar to match the current theme.
  useEffect(() => {
    const color = resolvedTheme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [resolvedTheme])

  return (
    <div className="min-h-dvh">
      {/* Side navigation (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsIcon className="size-5" aria-hidden />
          </div>
          <span className="font-bold">{t('app.name')}</span>
        </div>
        <nav aria-label={t('nav.label')} className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                )
              }
            >
              <Icon className="size-5" aria-hidden />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main
        className="pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-10 lg:pl-64"
      >
        <div className="mx-auto w-full max-w-3xl py-6 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))] sm:px-6 lg:py-10">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation (mobile + tablet) */}
      <nav
        aria-label={t('nav.label')}
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] leading-tight font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-accent',
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="max-w-full truncate">{t(labelKey)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
