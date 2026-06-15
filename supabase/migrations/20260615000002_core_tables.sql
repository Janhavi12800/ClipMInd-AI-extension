-- TechShield AI: Core Tables (Organizations, Profiles, Settings)
-- Migration: 20260615000002_core_tables

-- Organizations (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  domain TEXT,
  plan public.plan_tier NOT NULL DEFAULT 'free',
  seats INTEGER NOT NULL DEFAULT 1 CHECK (seats >= 1),
  sso_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON public.organizations (slug);
CREATE INDEX idx_organizations_plan ON public.organizations (plan);

-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'Member',
  department TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  locale TEXT NOT NULL DEFAULT 'en-US',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  api_usage INTEGER NOT NULL DEFAULT 0 CHECK (api_usage >= 0),
  api_limit INTEGER NOT NULL DEFAULT 10000 CHECK (api_limit > 0),
  plan public.plan_tier NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_organization ON public.profiles (organization_id);
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_plan ON public.profiles (plan);
CREATE INDEX idx_profiles_last_active ON public.profiles (last_active_at DESC);

-- Organization memberships
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.member_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members (user_id);
CREATE INDEX idx_org_members_org ON public.organization_members (organization_id);

-- User settings
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
  pii_redaction BOOLEAN NOT NULL DEFAULT TRUE,
  auto_scan BOOLEAN NOT NULL DEFAULT TRUE,
  compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
  language TEXT NOT NULL DEFAULT 'en-US',
  default_ai_model TEXT NOT NULL DEFAULT 'quality' CHECK (default_ai_model IN ('fast', 'quality')),
  phishing_sensitivity TEXT NOT NULL DEFAULT 'medium' CHECK (phishing_sensitivity IN ('low', 'medium', 'high')),
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extension device registrations
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  device_name TEXT NOT NULL DEFAULT 'Chrome Extension',
  device_type TEXT NOT NULL DEFAULT 'extension' CHECK (device_type IN ('extension', 'web', 'mobile')),
  user_agent TEXT,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_devices_user ON public.user_devices (user_id);
