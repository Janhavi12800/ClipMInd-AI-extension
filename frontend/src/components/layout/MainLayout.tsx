import { Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

interface MainLayoutProps {
  title?: string
  description?: string
  headerActions?: React.ReactNode
  hideHeader?: boolean
}

export function MainLayout({
  title,
  description,
  headerActions,
  hideHeader,
}: MainLayoutProps) {
  const { sidebarCollapsed, sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-app">
      <AppSidebar />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
        )}
      >
        {!hideHeader && (
          <AppHeader title={title} description={description} actions={headerActions} />
        )}
        <main className="flex-1 p-4 sm:p-6" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
