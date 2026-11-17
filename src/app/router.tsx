import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AppShell } from './AppShell'

/**
 * Every screen is loaded when it is first opened (route-level code splitting,
 * #94, #175), so the first visit downloads only the shell and one screen.
 */
const screen = (load: () => Promise<{ default: React.ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load()).default }),
})
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  screen(async () => ({ default: (await load())[name] }))

const settings = () => import('@/features/settings/FamilySettings')
const appSettings = () => import('@/features/settings/AppSettings')

const children: RouteObject[] = [
  { index: true, element: <Navigate to="/week" replace /> },
  { path: 'week', ...named(() => import('@/features/week/WeekScreen'), 'WeekScreen') },
  { path: 'shopping', ...named(() => import('@/features/shopping/ShoppingScreen'), 'ShoppingScreen') },
  { path: 'pantry', ...named(() => import('@/features/pantry/PantryScreen'), 'PantryScreen') },
  { path: 'recipes', ...named(() => import('@/features/recipes/RecipesScreen'), 'RecipesScreen') },
  { path: 'recipes/new', ...named(() => import('@/features/recipes/RecipeFormScreen'), 'RecipeFormScreen') },
  { path: 'recipes/:id/edit', ...named(() => import('@/features/recipes/RecipeFormScreen'), 'RecipeFormScreen') },
  { path: 'settings', ...named(() => import('@/features/settings/SettingsScreen'), 'SettingsScreen') },
  { path: 'settings/profile', ...named(settings, 'ProfileSettings') },
  { path: 'settings/household', ...named(settings, 'HouseholdSettingsPage') },
  { path: 'settings/food-week', ...named(settings, 'FoodWeekSettings') },
  { path: 'settings/auto-plan', ...named(appSettings, 'AutoPlanSettings') },
  { path: 'settings/split', ...named(settings, 'SplitSettings') },
  { path: 'settings/language', ...named(appSettings, 'LanguageSettings') },
  { path: 'settings/appearance', ...named(appSettings, 'AppearanceSettings') },
  { path: 'settings/install', ...named(appSettings, 'InstallSettings') },
  { path: '*', element: <Navigate to="/week" replace /> },
]

// Component overview, only available while developing (npm run dev).
if (import.meta.env.DEV) {
  children.push({ path: 'design', ...named(() => import('@/features/design-preview/DesignPreview'), 'DesignPreview') })
}

// Nothing to show while the first screen loads; the page background is already there.
const HydrateFallback = () => null

// The onboarding wizard is full-screen, outside the app shell (#158).
export const router = createBrowserRouter([
  { path: '/welcome', HydrateFallback, ...named(() => import('@/features/onboarding/OnboardingScreen'), 'OnboardingScreen') },
  { path: '/', element: <AppShell />, HydrateFallback, children },
])
