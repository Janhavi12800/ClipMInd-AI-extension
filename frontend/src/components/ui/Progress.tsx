import { cn, getScoreBg } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'score'
}

export function Progress({
  value,
  max = 100,
  className,
  showLabel,
  size = 'md',
  variant = 'default',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  const barColor =
    variant === 'score'
      ? percentage >= 80
        ? 'bg-green-500'
        : percentage >= 60
          ? 'bg-amber-500'
          : 'bg-red-500'
      : 'bg-brand-600 dark:bg-brand-500'

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-app-secondary">Progress</span>
          <span className={cn('font-medium', variant === 'score' && getScoreBg(value))}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn('w-full overflow-hidden rounded-full bg-app-tertiary', heights[size])}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
