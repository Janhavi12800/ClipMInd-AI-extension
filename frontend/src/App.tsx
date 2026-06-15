import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import {
  DashboardPage,
  PromptGeneratorPage,
  ContentGeneratorPage,
  SeoAnalyzerPage,
  SecurityScannerPage,
  NotesManagerPage,
  SettingsPage,
  ProfilePage,
  BillingPage,
} from '@/pages'
import { PopupView, SidebarView } from '@/views'
import { useThemeStore } from '@/store'

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore()

  useEffect(() => {
    setTheme(theme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="ai/prompts" element={<PromptGeneratorPage />} />
            <Route path="ai/content" element={<ContentGeneratorPage />} />
            <Route path="seo" element={<SeoAnalyzerPage />} />
            <Route path="security" element={<SecurityScannerPage />} />
            <Route path="notes" element={<NotesManagerPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="billing" element={<BillingPage />} />
          </Route>

          <Route
            path="popup"
            element={
              <div className="flex min-h-screen items-center justify-center bg-app-secondary p-4">
                <PopupView />
              </div>
            }
          />
          <Route
            path="sidebar"
            element={
              <div className="flex min-h-screen items-center justify-center bg-app-secondary p-4">
                <SidebarView />
              </div>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  )
}
