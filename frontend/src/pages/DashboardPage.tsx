import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Shield,
  Sparkles,
  Search,
  FileText,
  StickyNote,
  TrendingUp,
} from 'lucide-react'
import { dashboardStats, recentActivity } from '@/data/mockData'
import { useAuthStore } from '@/store'
import { PageHeader } from '@/components/layout'
import { StatCard, ActivityFeed } from '@/components/shared'
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle, Progress } from '@/components/ui'

const quickActions = [
  {
    title: 'Generate Prompt',
    description: 'Create AI prompts from templates',
    icon: Sparkles,
    path: '/ai/prompts',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    title: 'Run Security Scan',
    description: 'Analyze website security posture',
    icon: Shield,
    path: '/security',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    title: 'SEO Audit',
    description: 'Check on-page SEO factors',
    icon: Search,
    path: '/seo',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    title: 'Create Content',
    description: 'Generate blog posts and copy',
    icon: FileText,
    path: '/ai/content',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
]

export function DashboardPage() {
  const { user } = useAuthStore()
  const usagePercent = Math.round((user.apiUsage / user.apiLimit) * 100)

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Here's an overview of your TechShield AI workspace"
        actions={
          <Link to="/ai/prompts">
            <Button>
              <Sparkles className="h-4 w-4" />
              New Prompt
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump into your most-used tools</CardDescription>
              </div>
            </CardHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="group flex items-start gap-4 rounded-lg border border-app p-4 transition-colors hover:bg-app-tertiary"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}
                  >
                    <action.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-app group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {action.title}
                    </p>
                    <p className="mt-0.5 text-xs text-app-muted">{action.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-app-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </Card>

          <ActivityFeed activities={recentActivity} limit={5} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Usage</CardTitle>
              <CardDescription>Monthly token allocation</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-app">
                    {(user.apiUsage / 1000).toFixed(1)}K
                  </p>
                  <p className="text-xs text-app-muted">
                    of {(user.apiLimit / 1000).toFixed(0)}K tokens
                  </p>
                </div>
                <Badge variant={usagePercent > 80 ? 'warning' : 'brand'}>
                  {usagePercent}% used
                </Badge>
              </div>
              <Progress value={usagePercent} variant="default" />
              {usagePercent > 80 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You're approaching your monthly limit. Consider upgrading to Team plan.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Organization threat summary</CardDescription>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-app">Protected</span>
                </div>
                <Badge variant="success" dot>Active</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-app-tertiary p-3">
                  <p className="text-xl font-bold text-app">14</p>
                  <p className="text-xs text-app-muted">Threats blocked</p>
                </div>
                <div className="rounded-lg bg-app-tertiary p-3">
                  <p className="text-xl font-bold text-app">247</p>
                  <p className="text-xs text-app-muted">Scans run</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productivity</CardTitle>
              <CardDescription>This week's highlights</CardDescription>
            </CardHeader>
            <ul className="space-y-3" role="list">
              <li className="flex items-center gap-3 text-sm">
                <StickyNote className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <span className="text-app-secondary">5 notes created</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span className="text-app-secondary">89 SEO audits completed</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Sparkles className="h-4 w-4 text-purple-500" aria-hidden="true" />
                <span className="text-app-secondary">23 prompts generated</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
