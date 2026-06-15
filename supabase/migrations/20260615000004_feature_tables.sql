-- TechShield AI: Feature Tables (Prompts, Scans, Content, Notes)
-- Migration: 20260615000004_feature_tables

-- Prompt templates (system-wide, read-only for users)
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 255),
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  template TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_templates_category ON public.prompt_templates (category);
CREATE INDEX idx_prompt_templates_active ON public.prompt_templates (is_active) WHERE is_active = TRUE;

-- Prompt history (generated prompts)
CREATE TABLE public.prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.prompt_templates (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  prompt_input JSONB NOT NULL DEFAULT '{}',
  prompt_output TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Custom',
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  model TEXT,
  is_saved BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  pii_redacted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_history_user ON public.prompt_history (user_id, created_at DESC);
CREATE INDEX idx_prompt_history_org ON public.prompt_history (organization_id, created_at DESC);
CREATE INDEX idx_prompt_history_saved ON public.prompt_history (user_id, is_saved) WHERE is_saved = TRUE;

-- Scan history (security, SEO, phishing, malware, tech)
CREATE TABLE public.scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  scan_type public.scan_type NOT NULL,
  url TEXT NOT NULL CHECK (char_length(url) BETWEEN 1 AND 2048),
  title TEXT,
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  risk_level public.risk_level,
  results JSONB NOT NULL DEFAULT '{}',
  findings JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '{}',
  ssl_info JSONB,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_history_user ON public.scan_history (user_id, created_at DESC);
CREATE INDEX idx_scan_history_org ON public.scan_history (organization_id, created_at DESC);
CREATE INDEX idx_scan_history_type ON public.scan_history (scan_type, created_at DESC);
CREATE INDEX idx_scan_history_url ON public.scan_history USING gin (url gin_trgm_ops);

-- Saved content (AI-generated content)
CREATE TABLE public.saved_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  content_type public.content_type NOT NULL,
  content TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'Professional',
  word_count INTEGER NOT NULL DEFAULT 0 CHECK (word_count >= 0),
  status public.content_status NOT NULL DEFAULT 'draft',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  audience TEXT,
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  model TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_content_user ON public.saved_content (user_id, created_at DESC);
CREATE INDEX idx_saved_content_org ON public.saved_content (organization_id, created_at DESC);
CREATE INDEX idx_saved_content_status ON public.saved_content (user_id, status);
CREATE INDEX idx_saved_content_type ON public.saved_content (content_type);

-- Notes
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations (id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  content TEXT NOT NULL DEFAULT '',
  url TEXT,
  tags public.note_tag[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user ON public.notes (user_id, updated_at DESC);
CREATE INDEX idx_notes_org ON public.notes (organization_id, updated_at DESC);
CREATE INDEX idx_notes_pinned ON public.notes (user_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_notes_search ON public.notes USING gin (
  (title || ' ' || content) gin_trgm_ops
);
