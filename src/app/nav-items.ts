import { BookOpenIcon, CalendarDaysIcon, RefrigeratorIcon, SettingsIcon, ShoppingCartIcon, type LucideIcon } from 'lucide-react'

export type NavItem = {
  path: string
  labelKey: string
  icon: LucideIcon
}

// Icons: see docs/DECISIONS.md #47.
export const NAV_ITEMS: NavItem[] = [
  { path: '/week', labelKey: 'nav.week', icon: CalendarDaysIcon },
  { path: '/shopping', labelKey: 'nav.shopping', icon: ShoppingCartIcon },
  { path: '/pantry', labelKey: 'nav.pantry', icon: RefrigeratorIcon },
  { path: '/recipes', labelKey: 'nav.recipes', icon: BookOpenIcon },
  { path: '/settings', labelKey: 'nav.settings', icon: SettingsIcon },
]
