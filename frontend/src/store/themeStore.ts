import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, UserSettings } from '@/types'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => {
        const resolved = resolveTheme(theme)
        applyTheme(resolved)
        set({ theme, resolvedTheme: resolved })
      },

      toggleTheme: () => {
        const current = get().resolvedTheme
        const next = current === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next, resolvedTheme: next })
      },
    }),
    {
      name: 'techshield-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme)
          applyTheme(resolved)
          state.resolvedTheme = resolved
        }
      },
    },
  ),
)

interface SettingsState {
  settings: UserSettings
  updateSettings: (partial: Partial<UserSettings>) => void
  resetSettings: () => void
}

const defaultSettings: UserSettings = {
  theme: 'system',
  emailNotifications: true,
  securityAlerts: true,
  weeklyDigest: true,
  piiRedaction: true,
  autoScan: true,
  compactMode: false,
  language: 'en-US',
  defaultAiModel: 'quality',
  phishingSensitivity: 'medium',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    { name: 'techshield-settings' },
  ),
)

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeModule: string
  searchQuery: string
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveModule: (module: string) => void
  setSearchQuery: (query: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModule: 'home',
  searchQuery: '',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActiveModule: (module) => set({ activeModule: module }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
