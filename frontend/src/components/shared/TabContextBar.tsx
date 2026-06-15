import { Link } from 'react-router-dom'
import { ExternalLink, Globe, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tabContext } from '@/data/mockData'
import { Badge } from '@/components/ui'

interface TabContextBarProps {
  url?: string
  title?: string
  domain?: string
  compact?: boolean
  className?: string
}

export function TabContextBar({
  url = tabContext.url,
  title = tabContext.title,
  domain = tabContext.domain,
  compact = false,
  className,
}: TabContextBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-app bg-app-tertiary px-3 py-2',
        className,
      )}
      role="region"
      aria-label="Active tab context"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-600/10">
        <Globe className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="truncate text-xs text-app-muted">Current page</p>
        )}
        <p className="truncate text-sm font-medium text-app">{title}</p>
        <p className="truncate text-xs text-app-muted">{domain}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md p-1.5 text-app-muted hover:bg-app-elevated hover:text-app"
        aria-label={`Open ${domain} in new tab`}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

export function ExtensionBrand({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-brand-600',
          size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
        )}
      >
        <Shield
          className={cn('text-white', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')}
          aria-hidden="true"
        />
      </div>
      <div>
        <p className={cn('font-bold text-app', size === 'sm' ? 'text-xs' : 'text-sm')}>
          TechShield AI
        </p>
        {size === 'md' && (
          <Badge variant="brand" className="text-[9px]">
            PRO
          </Badge>
        )}
      </div>
    </Link>
  )
}
