-- TechShield AI — Complete Database Schema Reference
-- Generated from migrations 20260615000001 through 20260615000008
-- This file is for documentation; apply via supabase db reset or db push

-- ═══════════════════════════════════════════════════════════════
-- ENUM TYPES
-- ═══════════════════════════════════════════════════════════════
-- plan_tier:          free | pro | team | enterprise
-- subscription_status: active | trialing | past_due | canceled | incomplete | paused
-- scan_type:          security | seo | phishing | malware | tech
-- risk_level:         low | medium | high | critical
-- content_type:       blog | email | social | product | ad
-- content_status:     draft | completed | archived
-- analytics_event_type: page_view | feature_use | scan_completed | prompt_generated | ...
-- audit_action:       create | read | update | delete | login | logout | export | admin_action
-- member_role:        owner | admin | member | viewer
-- note_tag:           research | security | seo | meeting | idea | client | personal

-- ═══════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════

-- organizations
--   id UUID PK, name, slug UNIQUE, domain, plan, seats, sso_enabled, settings JSONB

-- profiles (extends auth.users)
--   id UUID PK FK→auth.users, organization_id FK, email, full_name, avatar_url,
--   role, department, timezone, locale, mfa_enabled, api_usage, api_limit, plan

-- organization_members
--   id UUID PK, organization_id FK, user_id FK, role, invited_by, joined_at
--   UNIQUE(organization_id, user_id)

-- user_settings
--   user_id UUID PK FK→profiles, theme, email_notifications, security_alerts,
--   weekly_digest, pii_redaction, auto_scan, compact_mode, language,
--   default_ai_model, phishing_sensitivity, preferences JSONB

-- user_devices
--   id UUID PK, user_id FK, device_name, device_type, user_agent, last_sync_at

-- ═══════════════════════════════════════════════════════════════
-- SUBSCRIPTION TABLES
-- ═══════════════════════════════════════════════════════════════

-- subscription_plans
--   id UUID PK, name UNIQUE, tier UNIQUE, description, price_monthly_cents,
--   price_yearly_cents, stripe_price_id_*, features JSONB, limits JSONB

-- user_subscriptions
--   id UUID PK, user_id FK, organization_id FK, plan_id FK, status,
--   stripe_customer_id, stripe_subscription_id UNIQUE, current_period_*

-- usage_records
--   id UUID PK, user_id FK, organization_id FK, metric, quantity,
--   period_start, period_end
--   UNIQUE(user_id, metric, period_start)

-- ═══════════════════════════════════════════════════════════════
-- FEATURE TABLES
-- ═══════════════════════════════════════════════════════════════

-- prompt_templates (system, read-only)
--   id UUID PK, title, category, description, template, variables TEXT[],
--   usage_count, is_active

-- prompt_history
--   id UUID PK, user_id FK, organization_id FK, template_id FK,
--   title, prompt_input JSONB, prompt_output TEXT, category,
--   tokens_used, model, is_saved, is_favorite, pii_redacted

-- scan_history
--   id UUID PK, user_id FK, organization_id FK, scan_type, url,
--   title, score (0-100), risk_level, results JSONB, findings JSONB,
--   metrics JSONB, ssl_info JSONB, duration_ms

-- saved_content
--   id UUID PK, user_id FK, organization_id FK, title, content_type,
--   content TEXT, tone, word_count, status, keywords TEXT[],
--   audience, tokens_used, model, metadata JSONB

-- notes
--   id UUID PK, user_id FK, organization_id FK, title, content,
--   url, tags note_tag[], is_pinned, is_archived

-- ═══════════════════════════════════════════════════════════════
-- SECURITY & OBSERVABILITY
-- ═══════════════════════════════════════════════════════════════

-- analytics_events
--   id UUID PK, user_id FK, organization_id FK, event_type, event_name,
--   properties JSONB, session_id, device_id FK, ip_hash, user_agent

-- audit_logs (IMMUTABLE — trigger blocks UPDATE/DELETE)
--   id UUID PK, organization_id FK, user_id FK, action, resource_type,
--   resource_id, old_values JSONB, new_values JSONB, metadata JSONB

-- rate_limit_buckets
--   id UUID PK, identifier, endpoint, request_count, window_start, window_end
--   UNIQUE(identifier, endpoint, window_start)

-- api_request_logs
--   id UUID PK, user_id FK, method, path, status_code, duration_ms,
--   ip_hash, user_agent, error_message, request_id

-- encrypted_secrets
--   id UUID PK, user_id FK, organization_id FK, name, secret_type,
--   encrypted_value BYTEA, key_version, last_used_at, expires_at
--   UNIQUE(user_id, name)

-- ═══════════════════════════════════════════════════════════════
-- DATABASE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- handle_new_user()         → Trigger on auth.users INSERT
-- handle_updated_at()       → Auto-update updated_at columns
-- increment_api_usage()     → Check and increment token usage
-- check_rate_limit()        → Sliding window rate limiting
-- write_audit_log()         → Insert immutable audit entry
-- get_user_org_id()         → Helper for RLS policies
-- is_org_member()           → Check org membership
-- is_org_admin()            → Check admin/owner role
-- reset_monthly_api_usage() → Cron: reset usage counters
-- cleanup_old_logs()        → Cron: purge old rate limits & API logs
-- prevent_audit_modification() → Block audit log changes

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

-- All 18 tables have RLS enabled.
-- Users can only access their own data.
-- Org members can view shared org data (read-only for non-admins).
-- Org admins can manage memberships and view org analytics/audit logs.
-- subscription_plans and prompt_templates are readable by all authenticated users.
-- rate_limit_buckets and api_request_logs are service_role only for writes.

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- 4 subscription plans: Free, Pro, Team, Enterprise
-- 6 prompt templates: Blog, Security Report, Product, Email, Code Review, SEO Meta
