import { describe, it, expect } from 'vitest'

function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function validatePlanTier(tier: string): boolean {
  return ['free', 'pro', 'business'].includes(tier)
}

function calculateYearlySavings(monthlyCents: number, yearlyCents: number): number {
  if (monthlyCents <= 0) return 0
  return Math.round((1 - yearlyCents / (monthlyCents * 12)) * 100)
}

describe('Billing utilities', () => {
  it('formats USD prices correctly', () => {
    expect(formatPrice(1900)).toBe('$19')
    expect(formatPrice(4900)).toBe('$49')
    expect(formatPrice(0)).toBe('$0')
  })

  it('validates plan tiers', () => {
    expect(validatePlanTier('free')).toBe(true)
    expect(validatePlanTier('pro')).toBe(true)
    expect(validatePlanTier('business')).toBe(true)
    expect(validatePlanTier('enterprise')).toBe(false)
    expect(validatePlanTier('invalid')).toBe(false)
  })

  it('calculates yearly savings', () => {
    expect(calculateYearlySavings(1900, 15000)).toBe(34)
    expect(calculateYearlySavings(4900, 47000)).toBe(20)
    expect(calculateYearlySavings(0, 0)).toBe(0)
  })
})

describe('Security validation', () => {
  function isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  function sanitizeInput(input: string, maxLen = 2048): string {
    return input.trim().slice(0, maxLen)
  }

  it('rejects non-HTTP URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
    expect(isValidUrl('not-a-url')).toBe(false)
  })

  it('sanitizes user input', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
    expect(sanitizeInput('a'.repeat(3000), 100).length).toBe(100)
  })
})

describe('Phishing detection patterns', () => {
  const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz']

  function hasSuspiciousTld(hostname: string): boolean {
    return SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld))
  }

  function hasTyposquat(hostname: string, brand: string): boolean {
    const normalized = hostname.replace(/^www\./, '')
    const distance = levenshtein(normalized, brand)
    return distance > 0 && distance <= 2
  }

  function levenshtein(a: string, b: string): number {
    const matrix: number[][] = []
    for (let i = 0; i <= b.length; i++) matrix[i] = [i]
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1
      }
    }
    return matrix[b.length][a.length]
  }

  it('detects suspicious TLDs', () => {
    expect(hasSuspiciousTld('login-secure.tk')).toBe(true)
    expect(hasSuspiciousTld('google.com')).toBe(false)
  })

  it('detects typosquatting', () => {
    expect(hasTyposquat('gooogle.com', 'google.com')).toBe(true)
    expect(hasTyposquat('google.com', 'google.com')).toBe(false)
  })
})
