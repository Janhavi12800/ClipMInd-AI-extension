import type { SecurityFinding, SecurityScanResult } from '../../lib/types'

interface DomSecurityData {
  url: string
  isHttps: boolean
  hasPasswordField: boolean
  hasLoginForm: boolean
  externalScripts: string[]
  mixedContent: string[]
  insecureForms: number
  cookies: string
  metaCsp: string
  iframeCount: number
  externalLinkCount: number
}

export function analyzeDomSecurity(data: DomSecurityData): SecurityScanResult {
  const findings: SecurityFinding[] = []
  let score = 100

  if (!data.isHttps) {
    findings.push({
      id: 'sec_https',
      category: 'ssl',
      severity: 'fail',
      title: 'Not using HTTPS',
      description: 'Page is served over insecure HTTP connection.',
      recommendation: 'Migrate to HTTPS with valid TLS certificate.',
    })
    score -= 30
  } else {
    findings.push({
      id: 'sec_https_ok',
      category: 'ssl',
      severity: 'pass',
      title: 'HTTPS Enabled',
      description: 'Page is served over secure HTTPS.',
      recommendation: 'No action required.',
    })
  }

  if (data.mixedContent.length > 0) {
    findings.push({
      id: 'sec_mixed',
      category: 'content',
      severity: 'warn',
      title: 'Mixed Content Detected',
      description: `${data.mixedContent.length} resource(s) loaded over HTTP on HTTPS page.`,
      recommendation: 'Update all resource URLs to use HTTPS.',
    })
    score -= Math.min(15, data.mixedContent.length * 5)
  }

  if (data.hasPasswordField && !data.isHttps) {
    findings.push({
      id: 'sec_pwd_http',
      category: 'content',
      severity: 'fail',
      title: 'Password Field on HTTP Page',
      description: 'Login credentials may be transmitted in cleartext.',
      recommendation: 'Never enter passwords on non-HTTPS pages.',
    })
    score -= 25
  }

  if (data.externalScripts.length > 10) {
    findings.push({
      id: 'sec_scripts',
      category: 'content',
      severity: 'warn',
      title: 'Many External Scripts',
      description: `${data.externalScripts.length} external scripts loaded.`,
      recommendation: 'Review third-party scripts and use Subresource Integrity.',
    })
    score -= 5
  }

  if (!data.metaCsp) {
    findings.push({
      id: 'sec_csp',
      category: 'headers',
      severity: 'warn',
      title: 'No Content-Security-Policy Meta Tag',
      description: 'CSP meta tag not found. HTTP CSP header check requires server response.',
      recommendation: 'Implement Content-Security-Policy header.',
    })
    score -= 10
  }

  if (data.iframeCount > 3) {
    findings.push({
      id: 'sec_iframes',
      category: 'content',
      severity: 'warn',
      title: 'Multiple Iframes',
      description: `${data.iframeCount} iframes detected. Potential clickjacking vector.`,
      recommendation: 'Set X-Frame-Options or CSP frame-ancestors header.',
    })
    score -= 5
  }

  if (data.insecureForms > 0) {
    findings.push({
      id: 'sec_forms',
      category: 'content',
      severity: 'fail',
      title: 'Insecure Form Submission',
      description: `${data.insecureForms} form(s) submit to HTTP endpoints.`,
      recommendation: 'Ensure all forms submit to HTTPS URLs.',
    })
    score -= 15
  }

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    riskLevel: score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical',
    findings,
    ssl: { valid: data.isHttps, protocol: data.isHttps ? 'HTTPS' : 'HTTP' },
    scannedAt: new Date().toISOString(),
  }
}

export async function fetchSecurityHeaders(url: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = []

  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const headers = response.headers

    const securityHeaders = [
      { name: 'strict-transport-security', title: 'HSTS', critical: true },
      { name: 'content-security-policy', title: 'Content-Security-Policy', critical: true },
      { name: 'x-frame-options', title: 'X-Frame-Options', critical: false },
      { name: 'x-content-type-options', title: 'X-Content-Type-Options', critical: false },
      { name: 'referrer-policy', title: 'Referrer-Policy', critical: false },
      { name: 'permissions-policy', title: 'Permissions-Policy', critical: false },
    ]

    for (const header of securityHeaders) {
      const value = headers.get(header.name)
      if (value) {
        findings.push({
          id: `hdr_${header.name}`,
          category: 'headers',
          severity: 'pass',
          title: `${header.title} Present`,
          description: `${header.name}: ${value.slice(0, 100)}`,
          recommendation: 'No action required.',
        })
      } else {
        findings.push({
          id: `hdr_${header.name}_missing`,
          category: 'headers',
          severity: header.critical ? 'fail' : 'warn',
          title: `${header.title} Missing`,
          description: `The ${header.name} response header is not set.`,
          recommendation: `Add ${header.name} header to server configuration.`,
        })
      }
    }
  } catch {
    findings.push({
      id: 'hdr_fetch_fail',
      category: 'headers',
      severity: 'warn',
      title: 'Could Not Fetch Headers',
      description: 'Unable to retrieve HTTP response headers (CORS or network restriction).',
      recommendation: 'DOM-based analysis results are still available.',
    })
  }

  return findings
}

export function mergeScanResults(
  domResult: SecurityScanResult,
  headerFindings: SecurityFinding[],
): SecurityScanResult {
  const allFindings = [...domResult.findings, ...headerFindings]
  const failCount = allFindings.filter((f) => f.severity === 'fail').length
  const warnCount = allFindings.filter((f) => f.severity === 'warn').length
  const score = Math.max(0, 100 - failCount * 15 - warnCount * 5)

  return {
    ...domResult,
    score,
    riskLevel: score >= 80 ? 'low' : score >= 60 ? 'medium' : score >= 40 ? 'high' : 'critical',
    findings: allFindings,
    scannedAt: new Date().toISOString(),
  }
}
