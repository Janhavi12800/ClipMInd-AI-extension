-- TechShield AI: Production Payments (Stripe + Razorpay + Business Plan)
-- Migration: 20260615000009_payments_production

ALTER TYPE public.plan_tier ADD VALUE IF NOT EXISTS 'business';

CREATE TYPE public.payment_provider AS ENUM ('stripe', 'razorpay', 'manual');

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS razorpay_plan_id_monthly TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_plan_id_yearly TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider public.payment_provider NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay
  ON public.user_subscriptions (razorpay_subscription_id)
  WHERE razorpay_subscription_id IS NOT NULL;

CREATE TABLE public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans (id),
  provider public.payment_provider NOT NULL,
  provider_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'expired', 'failed')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  success_url TEXT NOT NULL,
  cancel_url TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checkout_sessions_user ON public.checkout_sessions (user_id);
CREATE INDEX idx_checkout_sessions_provider ON public.checkout_sessions (provider_session_id)
  WHERE provider_session_id IS NOT NULL;

CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, event_id)
);

CREATE INDEX idx_payment_events_unprocessed ON public.payment_events (created_at)
  WHERE processed = FALSE;

-- Business plan (primary paid tier for teams)
INSERT INTO public.subscription_plans (
  name, tier, description, price_monthly_cents, price_yearly_cents,
  currency, features, limits, sort_order, is_active
)
VALUES (
  'Business',
  'business',
  'Collaborative workspace with shared resources, team policies, and priority support',
  4900,
  47000,
  'USD',
  '["Everything in Pro", "Up to 25 seats", "Pooled tokens", "Shared notes", "Team policies", "Priority support", "Audit logs"]'::jsonb,
  '{"daily_prompts": -1, "daily_scans": -1, "monthly_tokens": 500000, "max_notes": -1, "max_seats": 25}'::jsonb,
  3,
  TRUE
)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  price_yearly_cents = EXCLUDED.price_yearly_cents,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  is_active = EXCLUDED.is_active;

-- Deactivate legacy Team tier in favor of Business
UPDATE public.subscription_plans SET is_active = FALSE WHERE tier = 'team';

CREATE TRIGGER set_checkout_sessions_updated_at
  BEFORE UPDATE ON public.checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY checkout_sessions_select_own ON public.checkout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY checkout_sessions_insert_own ON public.checkout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY payment_events_service_only ON public.payment_events
  FOR ALL USING (FALSE);
