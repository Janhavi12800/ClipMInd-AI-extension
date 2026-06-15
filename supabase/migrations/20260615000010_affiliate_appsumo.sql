-- TechShield AI: Affiliate & AppSumo License Tables
-- Migration: 20260615000010_affiliate_appsumo.sql

CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'partner' CHECK (tier IN ('partner', 'pro_partner', 'elite_partner')),
  commission_rate DECIMAL(4, 2) NOT NULL DEFAULT 0.30 CHECK (commission_rate > 0 AND commission_rate <= 1),
  total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliates_code ON public.affiliates (code);
CREATE INDEX idx_affiliates_user ON public.affiliates (user_id);

CREATE TABLE public.affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates (id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.user_subscriptions (id) ON DELETE SET NULL,
  commission_cents INTEGER NOT NULL DEFAULT 0 CHECK (commission_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'clawed_back')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_conversions_affiliate ON public.affiliate_conversions (affiliate_id);

CREATE TABLE public.appsumo_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('pro', 'business', 'business_plus')),
  redeemed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appsumo_licenses_code ON public.appsumo_licenses (code);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appsumo_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY affiliates_read_own ON public.affiliates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY affiliate_conversions_read_own ON public.affiliate_conversions
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY appsumo_licenses_read_own ON public.appsumo_licenses
  FOR SELECT USING (auth.uid() = redeemed_by);

CREATE TRIGGER set_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed demo AppSumo codes (staging only)
INSERT INTO public.appsumo_licenses (code, tier)
VALUES
  ('APPSUMO-PRO-DEMO-001', 'pro'),
  ('APPSUMO-BIZ-DEMO-001', 'business')
ON CONFLICT (code) DO NOTHING;
