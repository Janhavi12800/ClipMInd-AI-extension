const API_BASE = import.meta.env.VITE_API_URL ?? '';
const PAYMENTS_BASE = import.meta.env.VITE_PAYMENTS_URL ?? API_BASE;

export class ApiError extends Error {
  code: string
  status: number
  requestId?: string

  constructor(code: string, message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('techshield_auth_token');
}

async function request<T>(
  base: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      body?.error?.code ?? 'REQUEST_FAILED',
      body?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      body?.error?.request_id,
    );
  }

  return body.data as T;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'free' | 'pro' | 'business';
  description: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  currency: string;
  features: string[];
  limits: Record<string, number>;
}

export interface UserSubscription {
  id: string;
  status: string;
  payment_provider: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  subscription_plans: SubscriptionPlan;
}

export interface NoteRecord {
  id: string;
  title: string;
  content: string;
  url: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export const api = {
  getPlans: () => request<SubscriptionPlan[]>(API_BASE, '/api/v1/plans'),
  getSubscription: () => request<UserSubscription | null>(API_BASE, '/api/v1/subscription'),
  getProfile: () => request<Record<string, unknown>>(API_BASE, '/api/v1/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    request(API_BASE, '/api/v1/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  getSettings: () => request<Record<string, unknown>>(API_BASE, '/api/v1/settings'),
  updateSettings: (data: Record<string, unknown>) =>
    request(API_BASE, '/api/v1/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  getNotes: (page = 1) => request<{ items: NoteRecord[]; total: number }>(API_BASE, `/api/v1/notes?page=${page}`),
  createNote: (data: Record<string, unknown>) =>
    request<NoteRecord>(API_BASE, '/api/v1/notes', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: string, data: Record<string, unknown>) =>
    request<NoteRecord>(API_BASE, `/api/v1/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteNote: (id: string) =>
    request(API_BASE, `/api/v1/notes/${id}`, { method: 'DELETE' }),
  getScans: (page = 1) => request<{ items: unknown[]; total: number }>(API_BASE, `/api/v1/scans?page=${page}`),
  createScan: (data: Record<string, unknown>) =>
    request(API_BASE, '/api/v1/scans', { method: 'POST', body: JSON.stringify(data) }),
  getPromptTemplates: () => request<unknown[]>(API_BASE, '/api/v1/prompts/templates'),
  getPrompts: (page = 1) => request<{ items: unknown[]; total: number }>(API_BASE, `/api/v1/prompts?page=${page}`),
  redeemAppSumo: (code: string) =>
    request(API_BASE, '/api/v1/licenses/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  trackAffiliate: (code: string) =>
    request(API_BASE, '/api/v1/affiliates/track', { method: 'POST', body: JSON.stringify({ code }) }),
};

export const payments = {
  checkout: (params: {
    plan_tier: string;
    provider: 'stripe' | 'razorpay';
    interval: 'monthly' | 'yearly';
    success_url: string;
    cancel_url: string;
  }) =>
    request<{ checkout_url: string; session_id: string }>(
      PAYMENTS_BASE,
      '/payments/checkout',
      { method: 'POST', body: JSON.stringify(params) },
    ),

  portal: (returnUrl: string) =>
    request<{ portal_url: string }>(PAYMENTS_BASE, '/payments/portal', {
      method: 'POST',
      body: JSON.stringify({ return_url: returnUrl }),
    }),

  cancel: () =>
    request<{ canceled: boolean }>(PAYMENTS_BASE, '/payments/cancel', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  activateFree: () =>
    request<{ plan: string }>(PAYMENTS_BASE, '/payments/activate-free', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
};

export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
