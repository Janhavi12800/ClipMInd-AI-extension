import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useUIStore } from '@/store'
import { Avatar, Button, ThemeToggle } from '@/components/ui'
import { Badge } from '@/components/ui'

interface AppHeaderProps {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function AppHeader({ title, description, actions }: AppHeaderProps) {
  const { user } = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-app bg-app/80 px-4 backdrop-blur-xl sm:px-6',
        sidebarCollapsed ? 'left-[72px]' : 'left-64',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        {title && (
          <div>
            <h1 className="truncate text-lg font-semibold text-app">{title}</h1>
            {description && (
              <p className="hidden truncate text-sm text-app-muted sm:block">{description}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
              <input
                type="search"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9 w-48 rounded-lg border border-app bg-app-elevated pl-9 pr-3 text-sm sm:w-64"
                aria-label="Search"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchOpen(false)
                setSearchValue('')
              }}
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="hidden sm:flex"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        {actions}

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <span className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </span>
        </Button>

        <ThemeToggle compact />

        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-app-tertiary"
          aria-label="View profile"
        >
          <Avatar name={user.name} size="sm" />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-app">{user.name}</p>
            <Badge variant="brand" className="text-[10px]">
              {user.plan.toUpperCase()}
            </Badge>
          </div>
        </Link>
      </div>
    </header>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-app">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-app-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
