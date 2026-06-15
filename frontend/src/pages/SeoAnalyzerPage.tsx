import {
  AlertCircle,
  AlertTriangle,
  Info,
  Play,
  Clock,
  Link2,
  Image,
  Heading,
  FileText,
  Search,
} from 'lucide-react'
import { useSeoStore } from '@/store'
import { PageHeader } from '@/components/layout'
import { TabContextBar } from '@/components/shared'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Progress,
  ScoreRing,
  Tabs,
} from '@/components/ui'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useState } from 'react'

const impactFilters = [
  { id: 'all', label: 'All Issues' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

const issueIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const issueColors = {
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function SeoAnalyzerPage() {
  const {
    reports,
    activeReport,
    isScanning,
    scanUrl,
    filterImpact,
    setScanUrl,
    setFilterImpact,
    runScan,
    selectReport,
  } = useSeoStore()

  const [activeTab, setActiveTab] = useState('issues')

  const filteredIssues =
    activeReport?.issues.filter(
      (issue) => filterImpact === 'all' || issue.impact === filterImpact,
    ) ?? []

  const issueCounts = {
    high: activeReport?.issues.filter((i) => i.impact === 'high').length ?? 0,
    medium: activeReport?.issues.filter((i) => i.impact === 'medium').length ?? 0,
    low: activeReport?.issues.filter((i) => i.impact === 'low').length ?? 0,
  }

  return (
    <div>
      <PageHeader
        title="SEO Analyzer"
        description="On-page SEO audit with actionable recommendations ranked by impact"
      />

      <div className="mb-6">
        <TabContextBar />
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="URL to Analyze"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              placeholder="https://example.com/page"
              leftIcon={<Link2 className="h-4 w-4" />}
            />
          </div>
          <Button onClick={runScan} loading={isScanning} className="sm:mb-0">
            <Play className="h-4 w-4" />
            Run SEO Audit
          </Button>
        </div>
      </Card>

      {activeReport ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <Card className="flex flex-col items-center py-6">
              <ScoreRing score={activeReport.score} label="SEO Score" />
              <p className="mt-4 text-center text-sm text-app-secondary">
                {activeReport.url}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-app-muted">
                <Clock className="h-3 w-3" />
                Scanned {formatRelativeTime(activeReport.scannedAt)}
              </p>
            </Card>

            <Card>
              <CardHeader className="mb-2">
                <CardTitle className="text-sm">Issue Summary</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-app-secondary">High impact</span>
                  <Badge variant="danger">{issueCounts.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-app-secondary">Medium impact</span>
                  <Badge variant="warning">{issueCounts.medium}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-app-secondary">Low impact</span>
                  <Badge variant="info">{issueCounts.low}</Badge>
                </div>
              </div>
            </Card>

            <Card padding="none">
              <CardHeader className="border-b border-app px-4 py-3 mb-0">
                <CardTitle className="text-sm">Scan History</CardTitle>
              </CardHeader>
              <ul className="max-h-48 overflow-y-auto divide-y divide-[var(--border-default)]" role="list">
                {reports.map((report) => (
                  <li key={report.id}>
                    <button
                      type="button"
                      onClick={() => selectReport(report.id)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-3 text-left hover:bg-app-tertiary',
                        activeReport.id === report.id && 'bg-brand-600/5',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-app">
                          {new URL(report.url).hostname}
                        </p>
                        <p className="text-xs text-app-muted">
                          {formatRelativeTime(report.scannedAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          report.score >= 80 ? 'success' : report.score >= 60 ? 'warning' : 'danger'
                        }
                      >
                        {report.score}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Tabs
              tabs={[
                { id: 'issues', label: 'Issues', count: filteredIssues.length },
                { id: 'metrics', label: 'Metrics' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === 'issues' && (
              <>
                <div className="flex flex-wrap gap-2">
                  {impactFilters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterImpact(f.id as typeof filterImpact)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                        filterImpact === f.id
                          ? 'bg-brand-600 text-white'
                          : 'bg-app-tertiary text-app-secondary hover:text-app',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {filteredIssues.map((issue) => {
                    const Icon = issueIcons[issue.type]
                    return (
                      <Card key={issue.id} padding="sm">
                        <div className="flex gap-3">
                          <Icon
                            className={cn('h-5 w-5 shrink-0 mt-0.5', issueColors[issue.type])}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-app">{issue.title}</p>
                              <Badge
                                variant={
                                  issue.impact === 'high'
                                    ? 'danger'
                                    : issue.impact === 'medium'
                                      ? 'warning'
                                      : 'info'
                                }
                              >
                                {issue.impact}
                              </Badge>
                              <Badge variant="outline">{issue.category}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-app-secondary">{issue.description}</p>
                            {issue.element && (
                              <code className="mt-2 inline-block rounded bg-app-tertiary px-2 py-0.5 text-xs font-mono text-app-muted">
                                {issue.element}
                              </code>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}

            {activeTab === 'metrics' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Title Length', value: activeReport.metrics.titleLength, ideal: '50-60', icon: FileText },
                  { label: 'Meta Description', value: activeReport.metrics.metaDescriptionLength, ideal: '150-155', icon: FileText },
                  { label: 'H1 Tags', value: activeReport.metrics.h1Count, ideal: '1', icon: Heading },
                  { label: 'Missing Alt Text', value: activeReport.metrics.imageAltMissing, ideal: '0', icon: Image },
                  { label: 'Internal Links', value: activeReport.metrics.internalLinks, ideal: '10+', icon: Link2 },
                  { label: 'External Links', value: activeReport.metrics.externalLinks, ideal: '—', icon: Link2 },
                  { label: 'Word Count', value: activeReport.metrics.wordCount, ideal: '1000+', icon: FileText },
                  { label: 'Load Time', value: `${activeReport.metrics.loadTime.toFixed(1)}s`, ideal: '<2s', icon: Clock },
                ].map((metric) => (
                  <Card key={metric.label} padding="sm">
                    <div className="flex items-center gap-3">
                      <metric.icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                      <div>
                        <p className="text-xs text-app-muted">{metric.label}</p>
                        <p className="text-lg font-bold text-app">{metric.value}</p>
                        <p className="text-xs text-app-muted">Ideal: {metric.ideal}</p>
                      </div>
                    </div>
                  </Card>
                ))}

                <Card className="sm:col-span-2">
                  <CardHeader className="mb-2">
                    <CardTitle className="text-sm">Content Quality</CardTitle>
                  </CardHeader>
                  <Progress
                    value={Math.min((activeReport.metrics.wordCount / 1500) * 100, 100)}
                    showLabel
                    variant="score"
                  />
                </Card>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No SEO reports yet"
          description="Enter a URL above and run an audit to analyze on-page SEO factors."
        />
      )}
    </div>
  )
}
