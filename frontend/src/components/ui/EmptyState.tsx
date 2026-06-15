import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-app px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-app-tertiary text-app-muted">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-app">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-app-secondary">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
