-- TechShield AI: Database Functions and Triggers
-- Migration: 20260615000006_functions_triggers

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prompt_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.saved_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.encrypted_secrets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create profile, settings, and default org on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  org_slug TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  org_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'))
    || '-' || substr(NEW.id::text, 1, 8);

  INSERT INTO public.organizations (name, slug, plan)
  VALUES (user_name || '''s Workspace', org_slug, 'free')
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (
    id, organization_id, email, full_name, avatar_url, plan, last_active_at
  ) VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    user_name,
    NEW.raw_user_meta_data ->> 'avatar_url',
    'free',
    NOW()
  );

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  INSERT INTO public.audit_logs (user_id, organization_id, action, resource_type, resource_id, new_values)
  VALUES (NEW.id, new_org_id, 'create', 'profile', NEW.id::text, jsonb_build_object('email', NEW.email));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update last_active on profile access
CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET last_active_at = NOW() WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

-- Increment API usage
CREATE OR REPLACE FUNCTION public.increment_api_usage(
  p_user_id UUID,
  p_tokens INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  SELECT api_usage, api_limit INTO current_usage, usage_limit
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF current_usage + p_tokens > usage_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET api_usage = api_usage + p_tokens, last_active_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Check rate limit (sliding window)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  v_window_start := NOW();
  v_window_end := NOW() + (p_window_seconds || ' seconds')::INTERVAL;

  -- Clean expired buckets
  DELETE FROM public.rate_limit_buckets WHERE window_end < NOW();

  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM public.rate_limit_buckets
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_end > NOW();

  IF v_count >= p_max_requests THEN
  RETURN QUERY SELECT FALSE, 0, (
    SELECT MIN(window_end) FROM public.rate_limit_buckets
    WHERE identifier = p_identifier AND endpoint = p_endpoint AND window_end > NOW()
  );
    RETURN;
  END IF;

  INSERT INTO public.rate_limit_buckets (identifier, endpoint, request_count, window_start, window_end)
  VALUES (p_identifier, p_endpoint, 1, v_window_start, v_window_end)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET request_count = rate_limit_buckets.request_count + 1;

  RETURN QUERY SELECT TRUE, (p_max_requests - v_count - 1)::INTEGER, v_window_end;
END;
$$;

-- Write audit log helper
CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_action public.audit_action,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.audit_logs (
    user_id, organization_id, action, resource_type, resource_id,
    old_values, new_values, metadata
  ) VALUES (
    auth.uid(), v_org_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Hash IP for privacy
CREATE OR REPLACE FUNCTION public.hash_ip(p_ip TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(extensions.digest(COALESCE(p_ip, '') || current_setting('app.ip_salt', true), 'sha256'), 'hex');
$$;

-- Get user's organization ID (for RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- Check org admin/owner
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

-- Reset monthly API usage (run via cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_api_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.profiles SET api_usage = 0;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

-- Cleanup old rate limit buckets and API logs (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_buckets WHERE window_end < NOW() - INTERVAL '1 hour';
  DELETE FROM public.api_request_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
