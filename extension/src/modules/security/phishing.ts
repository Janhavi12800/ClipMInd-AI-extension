import type { PhishingResult } from '../../lib/types'
import { checkTyposquat, hasSuspiciousTld, extractDomain } from '../../lib/security'

interface PhishingContext {
  url: string
  title: string
  hasPasswordField: boolean
  hasLoginForm: boolean
  linkCount: number
  sensitivity: 'low' | 'medium' | 'high'
}

const PHISHING_KEYWORDS = [
  'verify your account', 'confirm your identity', 'suspended', 'unusual activity',
  'click here immediately', 'act now', 'limited time', 'account locked',
  'update your payment', 'security alert', 'unauthorized access',
]

export function detectPhishing(ctx: PhishingContext): PhishingResult {
  const signals: Array<{ type: string; detail: string }> = []
  let riskScore = 0
  const domain = extractDomain(ctx.url)

  const typosquat = checkTyposquat(domain)
  if (typosquat.isSuspicious) {
    signals.push({ type: 'typosquat', detail: `Domain similar to "${typosquat.target}"` })
    riskScore += 35
  }

  if (hasSuspiciousTld(domain)) {
    signals.push({ type: 'suspicious_tld', detail: `Suspicious TLD in ${domain}` })
    riskScore += 20
  }

  const titleLower = ctx.title.toLowerCase()
  for (const keyword of PHISHING_KEYWORDS) {
    if (titleLower.includes(keyword)) {
      signals.push({ type: 'phishing_keyword', detail: `Page title contains "${keyword}"` })
      riskScore += 10
      break
    }
  }

  if (ctx.hasPasswordField && typosquat.isSuspicious) {
    signals.push({ type: 'credential_harvest', detail: 'Password field on suspicious domain' })
    riskScore += 30
  }

  if (ctx.hasLoginForm && domain.split('.').length > 3) {
    signals.push({ type: 'deep_subdomain', detail: 'Login form on deeply nested subdomain' })
    riskScore += 15
  }

  const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
  if (ipPattern.test(domain)) {
    signals.push({ type: 'ip_url', detail: 'Page uses IP address instead of domain' })
    riskScore += 25
  }

  if (domain.includes('login') && !KNOWN_LOGIN_DOMAINS.some((d) => domain.endsWith(d))) {
    if (typosquat.isSuspicious) {
      signals.push({ type: 'fake_login', detail: 'Login page on non-brand domain' })
      riskScore += 20
    }
  }

  const thresholds = { low: 60, medium: 45, high: 30 }
  const threshold = thresholds[ctx.sensitivity]

  riskScore = Math.min(100, riskScore)

  let action: PhishingResult['action'] = 'allow'
  if (riskScore >= 70) action = 'block'
  else if (riskScore >= threshold) action = 'warn'

  return {
    riskScore,
    riskLevel: riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
    signals,
    action,
  }
}

const KNOWN_LOGIN_DOMAINS = [
  'google.com', 'microsoft.com', 'apple.com', 'github.com', 'amazon.com',
  'paypal.com', 'facebook.com', 'linkedin.com', 'twitter.com',
]
