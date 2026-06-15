import { KNOWN_BRANDS, SUSPICIOUS_TLDS } from './constants'
import { createLogger } from './logger'

const log = createLogger('Security')

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim().slice(0, 2048)
  if (!isValidUrl(trimmed)) return null
  return trimmed
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function isPrivateUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return true
    if (hostname.startsWith('172.')) {
      const second = parseInt(hostname.split('.')[1], 10)
      if (second >= 16 && second <= 31) return true
    }
    if (hostname.endsWith('.local')) return true
    return false
  } catch {
    return true
  }
}

export function sanitizeText(input: string, maxLength = 50000): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .slice(0, maxLength)
}

export function detectPii(text: string): Array<{ type: string; match: string }> {
  const patterns: Array<{ type: string; regex: RegExp }> = [
    { type: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { type: 'phone', regex: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
    { type: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g },
    { type: 'credit_card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
    { type: 'ip_address', regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
  ]

  const found: Array<{ type: string; match: string }> = []

  for (const { type, regex } of patterns) {
    const matches = text.match(regex)
    if (matches) {
      matches.forEach((match) => {
        found.push({ type, match: match.slice(0, 4) + '***' })
      })
    }
  }

  return found
}

export function redactPii(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REDACTED]')
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}

export function checkTyposquat(domain: string): { isSuspicious: boolean; target?: string } {
  const baseDomain = domain.split('.').slice(-2, -1)[0] ?? domain.split('.')[0]

  for (const brand of KNOWN_BRANDS) {
    if (baseDomain === brand) continue
    const distance = levenshteinDistance(baseDomain.toLowerCase(), brand)
    if (distance > 0 && distance <= 2 && baseDomain.length >= 4) {
      return { isSuspicious: true, target: brand }
    }
    if (baseDomain.includes(brand) && baseDomain !== brand) {
      return { isSuspicious: true, target: brand }
    }
  }

  return { isSuspicious: false }
}

export function hasSuspiciousTld(domain: string): boolean {
  return SUSPICIOUS_TLDS.some((tld) => domain.endsWith(tld))
}

export function validateMessageOrigin(sender: chrome.runtime.MessageSender): boolean {
  if (sender.id !== chrome.runtime.id) {
    log.warn('Message from unknown extension', sender.id)
    return false
  }
  return true
}

export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}
