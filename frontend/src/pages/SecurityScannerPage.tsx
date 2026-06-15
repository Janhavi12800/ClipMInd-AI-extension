import {
  Play,
  Clock,
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Cookie,
  Globe,
  FileCode,
} from 'lucide-react'
import { useSecurityStore } from '@/store'
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
  ScoreRing,
} from '@/components/ui'
import { cn, formatRelativeTime, getRiskBg } from '@/lib/utils'

const categoryFilters = [
  { id: 'all', label: 'All' },
  { id: 'headers', label: 'Headers' },
  { id: 'ssl', label: 'SSL/TLS' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'content', label: 'Content' },
]

const statusIcons = {
  pass: CheckCircle2,
  fail: XCircle,
  warn: AlertTriangle,
}

const statusColors = {
  pass: 'text-green-600 dark:text-green-400',
  fail: 'text-red-600 dark:text-red-400',
  warn: 'text-amber-600 dark:text-amber-400',
}

const categoryIcons = {
  headers: FileCode,
  ssl: Lock,
  cookies: Cookie,
  content: Globe,
  dns: Globe,
  'mixed-content': AlertTriangle,
}

export function SecurityScannerPage() {
  const {
    scans,
    activeScan,
    isScanning,
    scanUrl,
    filterCategory,
    setScanUrl,
    setFilterCategory,
    runScan,
    selectScan,
  } = useSecurityStore()

  const filteredFindings =
    activeScan?.findings.filter(
      (f) => filterCategory === 'all' || f.category === filterCategory,
    ) ?? []

  const passCount = activeScan?.findings.filter((f) => f.status === 'pass').length ?? 0
  const failCount = activeScan?.findings.filter((f) => f.status === 'fail').length ?? 0
  const warnCount = activeScan?.findings.filter((f) => f.status === 'warn').length ?? 0

  return (
    <div>
      <PageHeader
        title="Website Security Scanner"
        description="Passive security assessment covering headers, SSL, cookies, and content security"
      />

      <div className="mb-6">
        <TabContextBar />
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="URL to Scan"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              placeholder="https://example.com"
              leftIcon={<Link2 className="h-4 w-4" />}
            />
          </div>
          <Button onClick={runScan} loading={isScanning}>
            <Play className="h-4 w-4" />
            Run Security Scan
          </Button>
        </div>
      </Card>

      {activeScan ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <Card className="flex flex-col items-center py-6">
              <ScoreRing score={activeScan.score} label="Security Score" />
              <Badge className={cn('mt-4', getRiskBg(activeScan.riskLevel))}>
                {activeScan.riskLevel.toUpperCase()} RISK
              </Badge>
              <p className="mt-2 text-center text-sm text-app-secondary">{activeScan.url}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-app-muted">
                <Clock className="h-3 w-3" />
                Scanned {formatRelativeTime(activeScan.scannedAt)}
              </p>
            </Card>

            <Card>
              <CardHeader className="mb-2">
                <CardTitle className="text-sm">Findings Summary</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">{passCount}</p>
                  <p className="text-xs text-app-muted">Passed</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{warnCount}</p>
                  <p className="text-xs text-app-muted">Warnings</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{failCount}</p>
                  <p className="text-xs text-app-muted">Failed</p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader className="mb-2">
                <CardTitle className="text-sm">SSL Certificate</CardTitle>
              </CardHeader>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-app-muted">Status</dt>
                  <dd>
                    <Badge variant={activeScan.ssl.valid ? 'success' : 'danger'}>
                      {activeScan.ssl.valid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-app-muted">Issuer</dt>
                  <dd className="text-app">{activeScan.ssl.issuer}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-app-muted">Protocol</dt>
                  <dd className="text-app">{activeScan.ssl.protocol}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-app-muted">Expires</dt>
                  <dd className="text-app">
                    {new Date(activeScan.ssl.expiresAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card padding="none">
              <CardHeader className="border-b border-app px-4 py-3 mb-0">
                <CardTitle className="text-sm">Scan History</CardTitle>
              </CardHeader>
              <ul className="max-h-40 overflow-y-auto divide-y divide-[var(--border-default)]" role="list">
                {scans.map((scan) => (
                  <li key={scan.id}>
                    <button
                      type="button"
                      onClick={() => selectScan(scan.id)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-3 text-left hover:bg-app-tertiary',
                        activeScan.id === scan.id && 'bg-brand-600/5',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-app">
                          {new URL(scan.url).hostname}
                        </p>
                        <p className="text-xs text-app-muted">
                          {formatRelativeTime(scan.scannedAt)}
                        </p>
                      </div>
                      <Badge variant={scan.score >= 80 ? 'success' : scan.score >= 60 ? 'warning' : 'danger'}>
                        {scan.score}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterCategory(f.id)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    filterCategory === f.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-app-tertiary text-app-secondary hover:text-app',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredFindings.map((finding) => {
                const StatusIcon = statusIcons[finding.status]
                const CategoryIcon = categoryIcons[finding.category] ?? Globe

                return (
                  <Card key={finding.id} padding="sm">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <StatusIcon
                          className={cn('h-5 w-5', statusColors[finding.status])}
                          aria-hidden="true"
                        />
                        <CategoryIcon className="h-3.5 w-3.5 text-app-muted" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-app">{finding.title}</p>
                          <Badge
                            variant={
                              finding.status === 'pass'
                                ? 'success'
                                : finding.status === 'fail'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {finding.status}
                          </Badge>
                          <Badge variant="outline">{finding.category}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-app-secondary">{finding.description}</p>
                        <div className="mt-2 rounded-lg bg-app-tertiary p-3">
                          <p className="text-xs font-medium text-app">Recommendation</p>
                          <p className="mt-0.5 text-xs text-app-secondary">
                            {finding.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="No security scans yet"
          description="Enter a URL above and run a scan to analyze security headers, SSL, and more."
        />
      )}
    </div>
  )
}
