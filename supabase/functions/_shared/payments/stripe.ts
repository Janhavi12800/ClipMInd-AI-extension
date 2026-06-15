const STRIPE_API = 'https://api.stripe.com/v1';

function getStripeKey(): string {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  return key;
}

async function stripeRequest<T>(
  method: string,
  path: string,
  body?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getStripeKey()}`,
  };

  let requestBody: string | undefined;
  if (body) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    requestBody = new URLSearchParams(body).toString();
  }

  const res = await fetch(`${STRIPE_API}${path}`, { method, headers, body: requestBody });
  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message ?? `Stripe API error (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string;
}

export async function createStripeCheckoutSession(params: {
  customerId?: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  const body: Record<string, string> = {
    mode: 'subscription',
    'line_items[0][price]': params.priceId,
    'line_items[0][quantity]': '1',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    'subscription_data[metadata][user_id]': params.metadata.user_id,
    'subscription_data[metadata][plan_tier]': params.metadata.plan_tier,
    'metadata[user_id]': params.metadata.user_id,
    'metadata[plan_tier]': params.metadata.plan_tier,
  };

  if (params.customerId) {
    delete body.customer_email;
    body.customer = params.customerId;
  }

  return stripeRequest<StripeCheckoutSession>('POST', '/checkout/sessions', body);
}

export async function createStripeCustomer(email: string, name: string, userId: string): Promise<string> {
  const data = await stripeRequest<{ id: string }>('POST', '/customers', {
    email,
    name,
    'metadata[user_id]': userId,
  });
  return data.id;
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<{ url: string }> {
  return stripeRequest<{ url: string }>('POST', '/billing_portal/sessions', {
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  await stripeRequest('POST', `/subscriptions/${subscriptionId}`, {
    cancel_at_period_end: 'true',
  });
}

export async function verifyStripeWebhook(
  payload: string,
  signature: string,
): Promise<boolean> {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) return false;

  const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const hash = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const computed = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computed === expectedSig;
}
