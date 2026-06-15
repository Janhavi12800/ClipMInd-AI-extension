import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store'
import { Button } from './Button'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, toggleTheme } = useThemeStore()

  return (
    <Button
      variant="ghost"
      size={compact ? 'icon' : 'md'}
      onClick={toggleTheme}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      {!compact && (
        <span className="hidden sm:inline">
          {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </Button>
  )
}
