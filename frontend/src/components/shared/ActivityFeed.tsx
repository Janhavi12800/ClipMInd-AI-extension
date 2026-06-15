import {
  Shield,
  Sparkles,
  Search,
  StickyNote,
  Scan,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { ActivityItem } from '@/types'
import { Card, CardHeader, CardTitle } from '@/components/ui'

const typeConfig = {
  scan: { icon: Scan, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  ai: { icon: Sparkles, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  note: { icon: StickyNote, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  security: { icon: Shield, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  seo: { icon: Search, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  limit?: number
}

export function ActivityFeed({ activities, limit }: ActivityFeedProps) {
  const items = limit ? activities.slice(0, limit) : activities

  return (
    <Card padding="none">
      <CardHeader className="border-b border-app px-6 py-4 mb-0">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <ul className="divide-y divide-[var(--border-default)]" role="list">
        {items.map((activity) => {
          const config = typeConfig[activity.type]
          const Icon = config.icon

          return (
            <li key={activity.id} className="flex gap-4 px-6 py-4">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  config.bg,
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-app">{activity.title}</p>
                <p className="mt-0.5 truncate text-sm text-app-secondary">
                  {activity.description}
                </p>
                <p className="mt-1 text-xs text-app-muted">
                  <time dateTime={activity.timestamp}>
                    {formatRelativeTime(activity.timestamp)}
                  </time>
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
