import { createServiceClient } from './auth.ts';
import { Errors } from './errors.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: { maxRequests: 100, windowSeconds: 60 },
  auth: { maxRequests: 20, windowSeconds: 60 },
  ai: { maxRequests: 30, windowSeconds: 60 },
  scan: { maxRequests: 20, windowSeconds: 60 },
  write: { maxRequests: 60, windowSeconds: 60 },
};

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  tier: keyof typeof RATE_LIMITS = 'default',
): Promise<{ remaining: number; resetAt: string }> {
  const config = RATE_LIMITS[tier] ?? RATE_LIMITS.default;
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: endpoint,
    p_max_requests: config.maxRequests,
    p_window_seconds: config.windowSeconds,
  });

  if (error) {
    console.error('Rate limit check failed:', error.message);
    return { remaining: config.maxRequests, resetAt: new Date().toISOString() };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.allowed) {
    throw Errors.rateLimited(result?.reset_at);
  }

  return {
    remaining: result.remaining ?? 0,
    resetAt: result.reset_at ?? new Date().toISOString(),
  };
}

export function rateLimitHeaders(remaining: number, resetAt: string): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': resetAt,
  };
}
