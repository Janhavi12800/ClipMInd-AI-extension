import type { PromptTemplate } from '../../lib/types'

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'tpl_blog',
    title: 'Blog Post Outline',
    category: 'Content Marketing',
    description: 'Structured blog outline with SEO headings',
    template: 'Create a comprehensive blog post outline about {{topic}} for {{audience}}. Include an engaging title, meta description (155 chars), introduction hook, {{section_count}} main sections with H2 headings, key points, and a CTA. Tone: {{tone}}.',
    variables: ['topic', 'audience', 'section_count', 'tone'],
  },
  {
    id: 'tpl_security',
    title: 'Security Incident Report',
    category: 'Security',
    description: 'Professional security incident report',
    template: 'Write a security incident report for {{incident_type}} detected on {{date}}. Include: executive summary, timeline, affected systems ({{systems}}), root cause, remediation, and recommendations. Audience: {{audience}}.',
    variables: ['incident_type', 'date', 'systems', 'audience'],
  },
  {
    id: 'tpl_product',
    title: 'Product Description',
    category: 'E-commerce',
    description: 'Conversion-optimized product copy',
    template: 'Write a product description for {{product_name}}. Features: {{features}}. Target: {{customer}}. Include benefits, specs, and SEO keywords: {{keywords}}. Max {{word_count}} words.',
    variables: ['product_name', 'features', 'customer', 'keywords', 'word_count'],
  },
  {
    id: 'tpl_email',
    title: 'Email Campaign',
    category: 'Marketing',
    description: 'Email copy with subject line variants',
    template: 'Create an email campaign for {{campaign_goal}}. Product: {{product}}. Write 3 subject lines, preview text, body with {{sections}} sections, and CTA. Tone: {{tone}}.',
    variables: ['campaign_goal', 'product', 'sections', 'tone'],
  },
  {
    id: 'tpl_code',
    title: 'Code Review Checklist',
    category: 'Development',
    description: 'Thorough PR review checklist',
    template: 'Create a code review checklist for {{language}} {{project_type}}. Focus: {{focus_areas}}. Include security, performance, testing, docs, and accessibility.',
    variables: ['language', 'project_type', 'focus_areas'],
  },
  {
    id: 'tpl_seo',
    title: 'SEO Meta Tags',
    category: 'SEO',
    description: 'Optimized title and meta descriptions',
    template: 'Generate SEO meta tags for {{topic}} on {{domain}}. Keyword: {{keyword}}. Create title tag (50-60 chars), meta description (150-155 chars), OG tags, and 5 long-tail keywords.',
    variables: ['topic', 'domain', 'keyword'],
  },
]

export const PROMPT_CATEGORIES = [
  'All', 'Content Marketing', 'Security', 'E-commerce', 'Marketing', 'Development', 'SEO',
]
