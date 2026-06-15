-- TechShield AI: Seed Data
-- Migration: 20260615000008_seed_data

INSERT INTO public.subscription_plans (name, tier, description, price_monthly_cents, price_yearly_cents, features, limits, sort_order)
VALUES
  (
    'Free',
    'free',
    'Get started with essential AI and security features',
    0,
    0,
    '["10 AI prompts/day", "Basic phishing detection", "5 security scans/day", "Basic SEO analyzer", "50 notes"]'::jsonb,
    '{"daily_prompts": 10, "daily_scans": 5, "monthly_tokens": 10000, "max_notes": 50}'::jsonb,
    1
  ),
  (
    'Pro',
    'pro',
    'Unlimited prompts and full security suite for power users',
    1900,
    15000,
    '["Unlimited prompts", "100K AI tokens/month", "Full security scanner", "SEO export", "Unlimited notes"]'::jsonb,
    '{"daily_prompts": -1, "daily_scans": -1, "monthly_tokens": 100000, "max_notes": -1}'::jsonb,
    2
  ),
  (
    'Team',
    'team',
    'Collaborative workspace with shared resources and team policies',
    3900,
    35000,
    '["Everything in Pro", "Pooled tokens", "Shared notes", "Team policies", "Priority support"]'::jsonb,
    '{"daily_prompts": -1, "daily_scans": -1, "monthly_tokens": 500000, "max_notes": -1, "min_seats": 5}'::jsonb,
    3
  ),
  (
    'Enterprise',
    'enterprise',
    'SSO, audit logs, custom policies, and dedicated support',
    0,
    0,
    '["Everything in Team", "SAML SSO", "SCIM provisioning", "Audit logs", "Custom SLA", "Dedicated support"]'::jsonb,
    '{"daily_prompts": -1, "daily_scans": -1, "monthly_tokens": -1, "max_notes": -1, "custom": true}'::jsonb,
    4
  );

INSERT INTO public.prompt_templates (title, category, description, template, variables)
VALUES
  (
    'Blog Post Outline',
    'Content Marketing',
    'Generate a structured blog post outline with SEO-optimized headings',
    'Create a comprehensive blog post outline about {{topic}} for {{audience}}. Include an engaging title, meta description (155 chars), introduction hook, {{section_count}} main sections with H2 headings, key points for each section, and a compelling CTA. Tone: {{tone}}.',
    ARRAY['topic', 'audience', 'section_count', 'tone']
  ),
  (
    'Security Incident Report',
    'Security',
    'Draft a professional security incident report for stakeholders',
    'Write a security incident report for {{incident_type}} detected on {{date}}. Include: executive summary, timeline of events, affected systems ({{systems}}), root cause analysis, remediation steps taken, and recommendations to prevent recurrence. Audience: {{audience}}.',
    ARRAY['incident_type', 'date', 'systems', 'audience']
  ),
  (
    'Product Description',
    'E-commerce',
    'Write compelling product descriptions optimized for conversion',
    'Write a product description for {{product_name}}. Key features: {{features}}. Target customer: {{customer}}. Include benefits-focused copy, technical specs section, and SEO keywords: {{keywords}}. Max {{word_count}} words.',
    ARRAY['product_name', 'features', 'customer', 'keywords', 'word_count']
  ),
  (
    'Email Campaign',
    'Marketing',
    'Create email marketing copy with subject line variants',
    'Create an email campaign for {{campaign_goal}}. Product/service: {{product}}. Write 3 subject line variants (under 50 chars), preview text, email body with {{sections}} sections, and CTA button text. Tone: {{tone}}. Personalization tokens: {{tokens}}.',
    ARRAY['campaign_goal', 'product', 'sections', 'tone', 'tokens']
  ),
  (
    'Code Review Checklist',
    'Development',
    'Generate a thorough code review checklist for pull requests',
    'Create a code review checklist for a {{language}} {{project_type}} project. Focus areas: {{focus_areas}}. Include security considerations, performance checks, testing requirements, documentation standards, and accessibility guidelines. Format as actionable checklist items.',
    ARRAY['language', 'project_type', 'focus_areas']
  ),
  (
    'SEO Meta Tags',
    'SEO',
    'Generate optimized title tags and meta descriptions',
    'Generate SEO meta tags for a page about {{topic}} on {{domain}}. Target keyword: {{keyword}}. Create: 1) Title tag (50-60 chars), 2) Meta description (150-155 chars), 3) OG title, 4) OG description, 5) 5 related long-tail keywords. Competitor reference: {{competitor}}.',
    ARRAY['topic', 'domain', 'keyword', 'competitor']
  );
