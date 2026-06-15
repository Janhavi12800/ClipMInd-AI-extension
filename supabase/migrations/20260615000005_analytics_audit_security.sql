-- TechShield AI: Analytics, Audit Logs, Rate Limiting, API Logging
-- Migration: 20260615000005_analytics_audit_security

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  event_type public.analytics_event_type NOT NULL,
  event_name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}',
  session_id TEXT,
  device_id UUID REFERENCES public.user_devices (id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX idx_analytics_events_org ON public.analytics_events (organization_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events (event_type, created_at DESC);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);

-- Partition-ready: analytics by month (optional future partition)
COMMENT ON TABLE public.analytics_events IS 'Analytics events. Partition by created_at monthly at scale.';

-- Immutable audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON public.audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- Prevent updates/deletes on audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_modification();

-- Rate limiting buckets (sliding window)
CREATE TABLE public.rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,
  UNIQUE (identifier, endpoint, window_start)
);

CREATE INDEX idx_rate_limit_lookup ON public.rate_limit_buckets (identifier, endpoint, window_end);

-- API request logs
CREATE TABLE public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  error_message TEXT,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_logs_user ON public.api_request_logs (user_id, created_at DESC);
CREATE INDEX idx_api_logs_path ON public.api_request_logs (path, created_at DESC);
CREATE INDEX idx_api_logs_request_id ON public.api_request_logs (request_id);
CREATE INDEX idx_api_logs_created ON public.api_request_logs (created_at DESC);

-- Encrypted secrets storage (API keys, tokens)
CREATE TABLE public.encrypted_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  secret_type TEXT NOT NULL CHECK (secret_type IN ('api_key', 'webhook', 'integration')),
  encrypted_value BYTEA NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX idx_encrypted_secrets_user ON public.encrypted_secrets (user_id) WHERE is_active = TRUE;
