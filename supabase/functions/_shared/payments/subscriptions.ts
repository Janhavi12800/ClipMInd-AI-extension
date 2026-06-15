import { type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Errors } from '../errors.ts';

export type BillingInterval = 'monthly' | 'yearly';
export type PaymentProviderName = 'stripe' | 'razorpay';

export interface PlanRow {
  id: string;
  name: string;
  tier: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  razorpay_plan_id_monthly: string | null;
  razorpay_plan_id_yearly: string | null;
  currency: string;
}

export async function getPlanByTier(
  client: SupabaseClient,
  tier: string,
): Promise<PlanRow> {
  const { data, error } = await client
    .from('subscription_plans')
    .select('*')
    .eq('tier', tier)
    .eq('is_active', true)
    .single();

  if (error || !data) throw Errors.notFound(`Plan tier: ${tier}`);
  return data as PlanRow;
}

export async function upsertUserSubscription(
  client: SupabaseClient,
  params: {
    userId: string;
    planId: string;
    planTier: string;
    provider: PaymentProviderName | 'manual';
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;
    periodStart?: string;
    periodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  const { data: existing } = await client
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    user_id: params.userId,
    plan_id: params.planId,
    status: params.status,
    payment_provider: params.provider,
    stripe_customer_id: params.stripeCustomerId ?? null,
    stripe_subscription_id: params.stripeSubscriptionId ?? null,
    razorpay_customer_id: params.razorpayCustomerId ?? null,
    razorpay_subscription_id: params.razorpaySubscriptionId ?? null,
    current_period_start: params.periodStart ?? null,
    current_period_end: params.periodEnd ?? null,
    cancel_at_period_end: params.cancelAtPeriodEnd ?? false,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await client
      .from('user_subscriptions')
      .update(row)
      .eq('id', existing.id);
    if (error) throw Errors.internal(error.message);
  } else {
    const { error } = await client.from('user_subscriptions').insert(row);
    if (error) throw Errors.internal(error.message);
  }

  await client
    .from('profiles')
    .update({ plan: params.planTier })
    .eq('id', params.userId);
}

export async function recordPaymentEvent(
  client: SupabaseClient,
  provider: PaymentProviderName,
  eventId: string,
  eventType: string,
  payload: unknown,
): Promise<boolean> {
  const { error } = await client.from('payment_events').insert({
    provider,
    event_id: eventId,
    event_type: eventType,
    payload,
    processed: false,
  });

  if (error?.code === '23505') return false;
  if (error) throw Errors.internal(error.message);
  return true;
}

export async function markPaymentEventProcessed(
  client: SupabaseClient,
  provider: PaymentProviderName,
  eventId: string,
  errorMessage?: string,
): Promise<void> {
  await client
    .from('payment_events')
    .update({ processed: true, error_message: errorMessage ?? null })
    .eq('provider', provider)
    .eq('event_id', eventId);
}

export function getPriceIdForPlan(
  plan: PlanRow,
  provider: PaymentProviderName,
  interval: BillingInterval,
): string {
  if (provider === 'stripe') {
    const id = interval === 'yearly'
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly;
    if (!id) throw Errors.badRequest(`Stripe price not configured for ${plan.tier} (${interval})`);
    return id;
  }

  const id = interval === 'yearly'
    ? plan.razorpay_plan_id_yearly
    : plan.razorpay_plan_id_monthly;
  if (!id) throw Errors.badRequest(`Razorpay plan not configured for ${plan.tier} (${interval})`);
  return id;
}

export function getAmountForPlan(plan: PlanRow, interval: BillingInterval): number {
  return interval === 'yearly' ? plan.price_yearly_cents : plan.price_monthly_cents;
}
