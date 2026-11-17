import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { PantryScreen } from '@/features/pantry/PantryScreen'
import { RecipeFormScreen } from '@/features/recipes/RecipeFormScreen'
import { RecipesScreen } from '@/features/recipes/RecipesScreen'
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen'
import { AppearanceSettings, AutoPlanSettings, InstallSettings, LanguageSettings } from '@/features/settings/AppSettings'
import { FoodWeekSettings, HouseholdSettingsPage, ProfileSettings, SplitSettings } from '@/features/settings/FamilySettings'
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
  { path: 'recipes/new', element: <RecipeFormScreen /> },
  { path: 'recipes/:id/edit', element: <RecipeFormScreen /> },
  { path: 'settings', element: <SettingsScreen /> },
  { path: 'settings/profile', element: <ProfileSettings /> },
  { path: 'settings/household', element: <HouseholdSettingsPage /> },
  { path: 'settings/food-week', element: <FoodWeekSettings /> },
  { path: 'settings/auto-plan', element: <AutoPlanSettings /> },
  { path: 'settings/split', element: <SplitSettings /> },
  { path: 'settings/language', element: <LanguageSettings /> },
  { path: 'settings/appearance', element: <AppearanceSettings /> },
  { path: 'settings/install', element: <InstallSettings /> },
  { path: '*', element: <Navigate to="/week" replace /> },
]

// Component overview, only available while developing (npm run dev).
if (import.meta.env.DEV) {
  children.push({
    path: 'design',
    lazy: async () => ({ Component: (await import('@/features/design-preview/DesignPreview')).DesignPreview }),
  })
}

// The onboarding wizard is full-screen, outside the app shell (#158).
export const router = createBrowserRouter([
  { path: '/welcome', element: <OnboardingScreen /> },
  { path: '/', element: <AppShell />, children },
])

