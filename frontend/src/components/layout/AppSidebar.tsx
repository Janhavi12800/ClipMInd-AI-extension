import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Search,
  Shield,
  StickyNote,
  Settings,
  User,
  PanelRight,
  AppWindow,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'
import { Badge } from '@/components/ui'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ai/prompts', label: 'Prompt Generator', icon: Sparkles },
  { path: '/ai/content', label: 'Content Generator', icon: FileText },
  { path: '/seo', label: 'SEO Analyzer', icon: Search },
  { path: '/security', label: 'Security Scanner', icon: Shield },
  { path: '/notes', label: 'Notes Manager', icon: StickyNote },
]

const bottomNav = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'Profile', icon: User },
]

const extensionViews = [
  { path: '/popup', label: 'Popup', icon: AppWindow },
  { path: '/sidebar', label: 'Sidebar', icon: PanelRight },
]

export function AppSidebar() {
  const location = useLocation()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-app bg-app-secondary transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-64',
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center gap-3 border-b border-app px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <Shield className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-app">TechShield AI</p>
            <p className="truncate text-xs text-app-muted">Enterprise Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        <ul className="space-y-1" role="list">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive =
              path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path)

            return (
              <li key={path}>
                <NavLink
                  to={path}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-600/10 text-brand-700 dark:text-brand-400'
                      : 'text-app-secondary hover:bg-app-tertiary hover:text-app',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>

        {!sidebarCollapsed && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-app-muted">
              Extension Views
            </p>
            <ul className="space-y-1" role="list">
              {extensionViews.map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-app-tertiary text-app'
                          : 'text-app-muted hover:bg-app-tertiary hover:text-app-secondary',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      Ext
                    </Badge>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-app px-3 py-4">
        <ul className="space-y-1" role="list">
          {bottomNav.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-600/10 text-brand-700 dark:text-brand-400'
                      : 'text-app-secondary hover:bg-app-tertiary hover:text-app',
                  )
                }
                title={sidebarCollapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mt-3 flex w-full items-center justify-center rounded-lg py-2 text-app-muted hover:bg-app-tertiary hover:text-app"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
