import {
  Shield,
  Sparkles,
  Search,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStat } from '@/types'
import { Card } from '@/components/ui'

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Sparkles,
  Search,
  AlertTriangle,
}

interface StatCardProps {
  stat: DashboardStat
}

export function StatCard({ stat }: StatCardProps) {
  const Icon = iconMap[stat.icon] ?? Shield
  const isPositive = stat.change >= 0

  return (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-app-secondary">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold text-app">{stat.value}</p>
          <p className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={cn(
                'font-medium',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
              )}
            >
              {isPositive ? '+' : ''}
              {stat.change}%
            </span>
            <span className="text-app-muted">{stat.changeLabel}</span>
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10">
          <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
        </div>
      </div>
    </Card>
  )
}
