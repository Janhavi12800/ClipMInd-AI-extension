const RAZORPAY_API = 'https://api.razorpay.com/v1';

function getRazorpayAuth(): string {
  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured');
  return btoa(`${keyId}:${keySecret}`);
}

async function razorpayRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Basic ${getRazorpayAuth()}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(`${RAZORPAY_API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.description ?? `Razorpay API error (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export interface RazorpaySubscription {
  id: string;
  short_url: string;
  status: string;
}

export async function createRazorpayCustomer(
  name: string,
  email: string,
  userId: string,
): Promise<string> {
  const data = await razorpayRequest<{ id: string }>('POST', '/customers', {
    name,
    email,
    notes: { user_id: userId },
  });
  return data.id;
}

export async function createRazorpaySubscription(params: {
  planId: string;
  customerId: string;
  totalCount: number;
  notes: Record<string, string>;
}): Promise<RazorpaySubscription> {
  return razorpayRequest<RazorpaySubscription>('POST', '/subscriptions', {
    plan_id: params.planId,
    customer_id: params.customerId,
    total_count: params.totalCount,
    quantity: 1,
    customer_notify: 1,
    notes: params.notes,
  });
}

export async function cancelRazorpaySubscription(subscriptionId: string): Promise<void> {
  await razorpayRequest('POST', `/subscriptions/${subscriptionId}/cancel`, {
    cancel_at_cycle_end: 1,
  });
}

export async function verifyRazorpayWebhookSignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return expected === signature;
}
