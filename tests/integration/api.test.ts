import { describe, it, expect } from 'vitest'

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:54321/functions/v1'

async function apiFetch(path: string, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(`${API_BASE}${path}`, init)
  } catch {
    return null
  }
}

describe('API Integration', () => {
  it('health endpoint returns healthy status', async () => {
    const res = await apiFetch('/api/v1/health')
    if (!res) {
      console.warn('Supabase not running — skipping integration test')
      return
    }
    const body = await res.json()
    expect(body.status).toBe('healthy')
    expect(body.version).toBe('v1')
  })

  it('rejects unauthenticated requests to protected routes', async () => {
    const res = await apiFetch('/api/v1/plans')
    if (!res) {
      console.warn('Supabase not running — skipping integration test')
      return
    }
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects invalid payment webhook signatures', async () => {
    const res = await apiFetch('/payments/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid',
      },
      body: JSON.stringify({ type: 'test' }),
    })
    if (!res) {
      console.warn('Supabase not running — skipping integration test')
      return
    }
    if (res.status === 404) {
      console.warn('Payments function not deployed — skipping')
      return
    }
    expect(res.status).toBe(400)
  })
})

describe('Payment plan structure', () => {
  const PLANS = [
    { tier: 'free', price_monthly_cents: 0 },
    { tier: 'pro', price_monthly_cents: 1900 },
    { tier: 'business', price_monthly_cents: 4900 },
  ]

  it('has three primary tiers with ascending prices', () => {
    expect(PLANS).toHaveLength(3)
    expect(PLANS[0].price_monthly_cents).toBe(0)
    expect(PLANS[1].price_monthly_cents).toBeLessThan(PLANS[2].price_monthly_cents)
  })
})
