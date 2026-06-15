import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  const switchId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label htmlFor={switchId} className="text-sm font-medium text-app cursor-pointer">
              {label}
            </label>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-app-muted">{description}</p>
          )}
        </div>
      )}
      <button
        id={switchId}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-surface-300 dark:bg-surface-600',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-app-sm',
            'transform transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
