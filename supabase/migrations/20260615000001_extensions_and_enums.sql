-- TechShield AI: Extensions and Enum Types
-- Migration: 20260615000001_extensions_and_enums

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- Plan tiers
CREATE TYPE public.plan_tier AS ENUM ('free', 'pro', 'team', 'enterprise');

-- Subscription status
CREATE TYPE public.subscription_status AS ENUM (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'paused'
);

-- Scan types
CREATE TYPE public.scan_type AS ENUM ('security', 'seo', 'phishing', 'malware', 'tech');

-- Risk levels
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Content types
CREATE TYPE public.content_type AS ENUM ('blog', 'email', 'social', 'product', 'ad');

-- Content status
CREATE TYPE public.content_status AS ENUM ('draft', 'completed', 'archived');

-- Analytics event types
CREATE TYPE public.analytics_event_type AS ENUM (
  'page_view',
  'feature_use',
  'scan_completed',
  'prompt_generated',
  'content_generated',
  'login',
  'logout',
  'subscription_change',
  'api_call',
  'error'
);

-- Audit action types
CREATE TYPE public.audit_action AS ENUM (
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'export',
  'admin_action'
);

-- Organization member roles
CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Note tags
CREATE TYPE public.note_tag AS ENUM (
  'research',
  'security',
  'seo',
  'meeting',
  'idea',
  'client',
  'personal'
);
