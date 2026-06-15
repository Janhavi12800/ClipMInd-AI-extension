-- TechShield AI: Row Level Security Policies
-- Migration: 20260615000007_row_level_security

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_secrets ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id));

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view org member profiles"
  ON public.profiles FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organization members
CREATE POLICY "Members can view org memberships"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(organization_id));

CREATE POLICY "Admins can manage memberships"
  ON public.organization_members FOR ALL
  USING (public.is_org_admin(organization_id));

-- User settings
CREATE POLICY "Users manage own settings"
  ON public.user_settings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User devices
CREATE POLICY "Users manage own devices"
  ON public.user_devices FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscription plans (public read)
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = TRUE);

-- User subscriptions
CREATE POLICY "Users view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins view org subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_admin(organization_id)
  );

-- Usage records
CREATE POLICY "Users view own usage"
  ON public.usage_records FOR SELECT
  USING (user_id = auth.uid());

-- Prompt templates (public read)
CREATE POLICY "Authenticated users can view templates"
  ON public.prompt_templates FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Prompt history
CREATE POLICY "Users manage own prompt history"
  ON public.prompt_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org members view org prompt history"
  ON public.prompt_history FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );

-- Scan history
CREATE POLICY "Users manage own scans"
  ON public.scan_history FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org members view org scans"
  ON public.scan_history FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );

-- Saved content
CREATE POLICY "Users manage own content"
  ON public.saved_content FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Org members view org content"
  ON public.saved_content FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(organization_id)
  );

-- Notes
CREATE POLICY "Users manage own notes"
  ON public.notes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Analytics events
CREATE POLICY "Users insert own analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users view own analytics"
  ON public.analytics_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins view org analytics"
  ON public.analytics_events FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_admin(organization_id)
  );

-- Audit logs (read-only for users, insert via service role)
CREATE POLICY "Users view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins view org audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND public.is_org_admin(organization_id)
  );

-- Rate limit buckets (service role only via edge functions)
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limit_buckets FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- API request logs
CREATE POLICY "Users view own API logs"
  ON public.api_request_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages API logs"
  ON public.api_request_logs FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Encrypted secrets
CREATE POLICY "Users manage own secrets"
  ON public.encrypted_secrets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION public.increment_api_usage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.write_audit_log TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_org_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin TO authenticated;
