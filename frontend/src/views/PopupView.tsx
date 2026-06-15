import { Link } from 'react-router-dom'
import {
  Shield,
  Sparkles,
  Search,
  FileText,
  StickyNote,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { tabContext } from '@/data/mockData'
import { useAuthStore, useSecurityStore } from '@/store'
import { ExtensionBrand } from '@/components/shared'
import { Badge, Button, Progress, ThemeToggle } from '@/components/ui'
import { cn, getScoreBg } from '@/lib/utils'

const quickLinks = [
  { icon: Sparkles, label: 'Prompts', path: '/ai/prompts', color: 'text-purple-600 dark:text-purple-400' },
  { icon: FileText, label: 'Content', path: '/ai/content', color: 'text-blue-600 dark:text-blue-400' },
  { icon: Search, label: 'SEO', path: '/seo', color: 'text-green-600 dark:text-green-400' },
  { icon: Shield, label: 'Security', path: '/security', color: 'text-red-600 dark:text-red-400' },
  { icon: StickyNote, label: 'Notes', path: '/notes', color: 'text-amber-600 dark:text-amber-400' },
]

export function PopupView() {
  const { user } = useAuthStore()
  const { activeScan } = useSecurityStore()
  const usagePercent = Math.round((user.apiUsage / user.apiLimit) * 100)

  const securityScore = activeScan?.score ?? 91
  const riskLevel = activeScan?.riskLevel ?? 'low'

  return (
    <div className="mx-auto w-[380px] min-h-[520px] bg-app border border-app shadow-app-lg">
      <header className="flex items-center justify-between border-b border-app px-4 py-3">
        <ExtensionBrand size="sm" />
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <Link to="/sidebar">
            <Button variant="ghost" size="icon" aria-label="Open sidebar">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="border-b border-app bg-app-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600/10">
            <Shield className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-app">{tabContext.title}</p>
            <p className="truncate text-[10px] text-app-muted">{tabContext.domain}</p>
          </div>
          <Badge className={cn('text-[10px]', getScoreBg(securityScore))}>
            {securityScore}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-app bg-app-elevated p-3 text-center">
            <p className="text-2xl font-bold text-app">{securityScore}</p>
            <p className="text-[10px] text-app-muted">Security</p>
            <Badge className={cn('mt-1 text-[9px]', getScoreBg(securityScore))} variant="outline">
              {riskLevel}
            </Badge>
          </div>
          <div className="rounded-lg border border-app bg-app-elevated p-3 text-center">
            <p className="text-2xl font-bold text-app">82</p>
            <p className="text-[10px] text-app-muted">SEO Score</p>
            <Badge variant="success" className="mt-1 text-[9px]">Good</Badge>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                2 warnings detected
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">
                Missing X-Frame-Options header and cookie security flags
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-app-secondary uppercase tracking-wider">
            Quick Access
          </p>
          <div className="grid grid-cols-5 gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex flex-col items-center gap-1 rounded-lg border border-app p-2 transition-colors hover:bg-app-tertiary"
              >
                <link.icon className={cn('h-4 w-4', link.color)} />
                <span className="text-[10px] font-medium text-app-secondary">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-app-muted">AI Tokens</span>
            <span className="font-medium text-app">{usagePercent}%</span>
          </div>
          <Progress value={usagePercent} size="sm" />
        </div>
      </div>

      <footer className="border-t border-app px-4 py-3">
        <Link to="/sidebar" className="block">
          <Button variant="outline" fullWidth size="sm">
            Open Full Panel
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </footer>
    </div>
  )
}
