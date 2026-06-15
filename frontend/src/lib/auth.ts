const AUTH_BASE = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'techshield_auth_token';
const REFRESH_KEY = 'techshield_refresh_token';

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
}

export interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  plan: string;
  timezone: string | null;
  locale: string | null;
  avatar_url: string | null;
  created_at: string;
  organizations?: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    plan: string;
    seats: number;
    sso_enabled: boolean;
  } | null;
  user_settings?: Record<string, unknown> | null;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredSession(session: AuthSession): void {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(REFRESH_KEY, session.refresh_token);
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${AUTH_BASE}/auth-session${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Auth request failed (${res.status})`);
  }

  return body.data as T;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const data = await authRequest<{
      user: AuthUser;
      session: AuthSession;
    }>('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.session?.access_token) setStoredSession(data.session);
    return data;
  },

  register: async (email: string, password: string, full_name: string) => {
    const data = await authRequest<{
      user: AuthUser;
      session: AuthSession | null;
      message?: string;
    }>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
    if (data.session?.access_token) setStoredSession(data.session);
    return data;
  },

  logout: async () => {
    try {
      await authRequest('/logout', { method: 'POST', body: '{}' });
    } finally {
      clearStoredSession();
    }
  },

  me: () => authRequest<{ user: AuthUser; profile: ProfileData }>('/me'),

  refresh: async () => {
    const refresh_token = getStoredRefreshToken();
    if (!refresh_token) throw new Error('No refresh token');
    const data = await authRequest<{ session: AuthSession }>('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });
    if (data.session?.access_token) setStoredSession(data.session);
    return data;
  },

  resetPassword: (email: string) =>
    authRequest<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getGoogleUrl: () => authRequest<{ url: string }>('/google'),
};

export const DEMO_PLANS = [
  {
    id: 'demo-free',
    name: 'Free',
    tier: 'free' as const,
    description: 'Get started with essential AI and security features',
    price_monthly_cents: 0,
    price_yearly_cents: 0,
    currency: 'USD',
    features: ['10 AI prompts/day', 'Basic phishing detection', '5 security scans/day', 'Basic SEO analyzer', '50 notes'],
    limits: { daily_prompts: 10, daily_scans: 5, monthly_tokens: 10000, max_notes: 50 } as Record<string, number>,
  },
  {
    id: 'demo-pro',
    name: 'Pro',
    tier: 'pro' as const,
    description: 'Unlimited prompts and full security suite for power users',
    price_monthly_cents: 1900,
    price_yearly_cents: 15000,
    currency: 'USD',
    features: ['Unlimited prompts', '100K AI tokens/month', 'Full security scanner', 'SEO export', 'Unlimited notes'],
    limits: { daily_prompts: -1, daily_scans: -1, monthly_tokens: 100000, max_notes: -1 } as Record<string, number>,
  },
  {
    id: 'demo-business',
    name: 'Business',
    tier: 'business' as const,
    description: 'Collaborative workspace with shared resources and team policies',
    price_monthly_cents: 4900,
    price_yearly_cents: 47000,
    currency: 'USD',
    features: ['Everything in Pro', 'Up to 25 seats', 'Pooled tokens', 'Shared notes', 'Team policies', 'Priority support'],
    limits: { daily_prompts: -1, daily_scans: -1, monthly_tokens: 500000, max_notes: -1, max_seats: 25 } as Record<string, number>,
  },
];
