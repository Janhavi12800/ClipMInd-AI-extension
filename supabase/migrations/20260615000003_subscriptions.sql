-- TechShield AI: Subscription Plans
-- Migration: 20260615000003_subscriptions

CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tier public.plan_tier NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price_monthly_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_monthly_cents >= 0),
  price_yearly_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_yearly_cents >= 0),
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans (id),
  status public.subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_org ON public.user_subscriptions (organization_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions (status);
CREATE INDEX idx_user_subscriptions_stripe ON public.user_subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Usage metering per billing period
CREATE TABLE public.usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  metric TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_records_user_period ON public.usage_records (user_id, period_start, metric);
CREATE UNIQUE INDEX idx_usage_records_unique ON public.usage_records (user_id, metric, period_start);
