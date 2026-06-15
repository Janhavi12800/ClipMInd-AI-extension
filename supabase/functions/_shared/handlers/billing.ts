import { type AuthContext } from '../auth.ts';
import { Errors } from '../errors.ts';
import { parseBody, requiredEnum, requiredUrl } from '../validation.ts';
import {
  getPlanByTier,
  getPriceIdForPlan,
  getAmountForPlan,
  upsertUserSubscription,
  type BillingInterval,
  type PaymentProviderName,
} from '../payments/subscriptions.ts';
import {
  createStripeCheckoutSession,
  createStripeCustomer,
  createBillingPortalSession,
  cancelStripeSubscription,
} from '../payments/stripe.ts';
import {
  createRazorpayCustomer,
  createRazorpaySubscription,
  cancelRazorpaySubscription,
} from '../payments/razorpay.ts';

const PLAN_TIERS = ['free', 'pro', 'business'] as const;
const PROVIDERS = ['stripe', 'razorpay'] as const;
const INTERVALS = ['monthly', 'yearly'] as const;

export async function handleCheckout(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'POST') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const body = await parseBody<{
    plan_tier: string;
    provider: PaymentProviderName;
    interval: BillingInterval;
    success_url: string;
    cancel_url: string;
  }>(req);

  const planTier = requiredEnum(body.plan_tier, 'plan_tier', PLAN_TIERS);
  const provider = requiredEnum(body.provider, 'provider', PROVIDERS);
  const interval = requiredEnum(body.interval, 'interval', INTERVALS);
  const successUrl = requiredUrl(body.success_url, 'success_url');
  const cancelUrl = requiredUrl(body.cancel_url, 'cancel_url');

  if (planTier === 'free') throw Errors.badRequest('Free plan does not require checkout');

  const plan = await getPlanByTier(auth.serviceClient, planTier);
  const amount = getAmountForPlan(plan, interval);

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', auth.user.id)
    .single();

  const email = profile?.email ?? auth.user.email ?? '';
  const name = profile?.full_name ?? email;

  const { data: existingSub } = await auth.serviceClient
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let checkoutUrl = '';
  let providerSessionId = '';

  if (provider === 'stripe') {
    const priceId = getPriceIdForPlan(plan, 'stripe', interval);
    let customerId = existingSub?.stripe_customer_id as string | undefined;

    if (!customerId) {
      customerId = await createStripeCustomer(email, name, auth.user.id);
    }

    const session = await createStripeCheckoutSession({
      customerId,
      customerEmail: email,
      priceId,
      successUrl,
      cancelUrl,
      metadata: { user_id: auth.user.id, plan_tier: planTier },
    });

    checkoutUrl = session.url;
    providerSessionId = session.id;
  } else {
    const razorpayPlanId = getPriceIdForPlan(plan, 'razorpay', interval);
    let customerId = existingSub?.razorpay_customer_id as string | undefined;

    if (!customerId) {
      customerId = await createRazorpayCustomer(name, email, auth.user.id);
    }

    const totalCount = interval === 'yearly' ? 1 : 12;
    const subscription = await createRazorpaySubscription({
      planId: razorpayPlanId,
      customerId,
      totalCount,
      notes: { user_id: auth.user.id, plan_tier: planTier },
    });

    checkoutUrl = subscription.short_url;
    providerSessionId = subscription.id;
  }

  const { data: session, error } = await auth.serviceClient
    .from('checkout_sessions')
    .insert({
      user_id: auth.user.id,
      plan_id: plan.id,
      provider,
      provider_session_id: providerSessionId,
      status: 'pending',
      billing_interval: interval,
      amount_cents: amount,
      currency: plan.currency ?? 'USD',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { plan_tier: planTier },
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw Errors.internal(error.message);

  await auth.serviceClient.rpc('write_audit_log', {
    p_action: 'create',
    p_resource_type: 'checkout_session',
    p_resource_id: session.id,
    p_new_values: { plan_tier: planTier, provider, interval },
  });

  return jsonOk({ checkout_url: checkoutUrl, session_id: session.id }, requestId);
}

export async function handleBillingPortal(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'POST') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const body = await parseBody<{ return_url: string }>(req);
  const returnUrl = requiredUrl(body.return_url, 'return_url');

  const { data: sub } = await auth.supabase
    .from('user_subscriptions')
    .select('stripe_customer_id, payment_provider')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    throw Errors.badRequest('No Stripe customer found. Use Razorpay dashboard or contact support.');
  }

  const portal = await createBillingPortalSession(sub.stripe_customer_id, returnUrl);
  return jsonOk({ portal_url: portal.url }, requestId);
}

export async function handleCancelSubscription(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'POST') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const { data: sub } = await auth.supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) throw Errors.notFound('Subscription');

  if (sub.payment_provider === 'stripe' && sub.stripe_subscription_id) {
    await cancelStripeSubscription(sub.stripe_subscription_id);
  } else if (sub.payment_provider === 'razorpay' && sub.razorpay_subscription_id) {
    await cancelRazorpaySubscription(sub.razorpay_subscription_id);
  } else {
    throw Errors.badRequest('No active paid subscription to cancel');
  }

  await auth.serviceClient
    .from('user_subscriptions')
    .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
    .eq('id', sub.id);

  await auth.serviceClient.rpc('write_audit_log', {
    p_action: 'update',
    p_resource_type: 'subscription',
    p_resource_id: sub.id,
    p_new_values: { cancel_at_period_end: true },
  });

  return jsonOk({ canceled: true, cancel_at_period_end: true }, requestId);
}

export async function handleActivateFreePlan(
  req: Request,
  auth: AuthContext,
  requestId: string,
): Promise<Response> {
  if (req.method !== 'POST') throw Errors.badRequest(`Method ${req.method} not allowed`);

  const plan = await getPlanByTier(auth.serviceClient, 'free');

  await upsertUserSubscription(auth.serviceClient, {
    userId: auth.user.id,
    planId: plan.id,
    planTier: 'free',
    provider: 'manual',
    status: 'active',
  });

  return jsonOk({ plan: 'free', activated: true }, requestId);
}

function jsonOk(data: unknown, requestId: string): Response {
  return new Response(JSON.stringify({ data, request_id: requestId }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-Request-Id': requestId,
    },
  });
}
