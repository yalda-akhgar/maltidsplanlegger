import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { PantryScreen } from '@/features/pantry/PantryScreen'
import { RecipesScreen } from '@/features/recipes/RecipesScreen'
import { SettingsScreen } from '@/features/settings/SettingsScreen'
import { ShoppingScreen } from '@/features/shopping/ShoppingScreen'
import { WeekScreen } from '@/features/week/WeekScreen'
import { AppShell } from './AppShell'

const children: RouteObject[] = [
  { index: true, element: <Navigate to="/week" replace /> },
  { path: 'week', element: <WeekScreen /> },
  { path: 'shopping', element: <ShoppingScreen /> },
  { path: 'pantry', element: <PantryScreen /> },
  { path: 'recipes', element: <RecipesScreen /> },
  { path: 'settings', element: <SettingsScreen /> },
  { path: '*', element: <Navigate to="/week" replace /> },
]

// Component overview, only available while developing (npm run dev).
if (import.meta.env.DEV) {
  children.push({
    path: 'design',
    lazy: async () => ({ Component: (await import('@/features/design-preview/DesignPreview')).DesignPreview }),
  })
}

export const router = createBrowserRouter([{ path: '/', element: <AppShell />, children }])

