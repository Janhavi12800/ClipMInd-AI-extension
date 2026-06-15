import type {
  ActivityItem,
  ContentGeneration,
  DashboardStat,
  Note,
  Organization,
  PromptTemplate,
  SavedPrompt,
  SecurityScan,
  SeoReport,
  User,
} from '@/types'

export const currentUser: User = {
  id: 'usr_8f3k2m9x',
  email: 'sarah.chen@acmecorp.com',
  name: 'Sarah Chen',
  avatar: 'SC',
  role: 'Marketing Manager',
  department: 'Growth & Content',
  plan: 'pro',
  organization: 'Acme Corporation',
  joinedAt: '2025-03-15T09:00:00Z',
  lastActive: new Date().toISOString(),
  timezone: 'America/Los_Angeles',
  locale: 'en-US',
  mfaEnabled: true,
  apiUsage: 68420,
  apiLimit: 100000,
}

export const organization: Organization = {
  id: 'org_acme_001',
  name: 'Acme Corporation',
  domain: 'acmecorp.com',
  plan: 'team',
  seats: 25,
  seatsUsed: 18,
  ssoEnabled: true,
}

export const dashboardStats: DashboardStat[] = [
  {
    id: 'stat-scans',
    label: 'Security Scans',
    value: 247,
    change: 12.5,
    changeLabel: 'vs last week',
    icon: 'Shield',
  },
  {
    id: 'stat-ai',
    label: 'AI Tokens Used',
    value: '68.4K',
    change: -3.2,
    changeLabel: 'vs last week',
    icon: 'Sparkles',
  },
  {
    id: 'stat-seo',
    label: 'SEO Audits',
    value: 89,
    change: 24.1,
    changeLabel: 'vs last week',
    icon: 'Search',
  },
  {
    id: 'stat-threats',
    label: 'Threats Blocked',
    value: 14,
    change: 0,
    changeLabel: 'this month',
    icon: 'AlertTriangle',
  },
]

export const recentActivity: ActivityItem[] = [
  {
    id: 'act_001',
    type: 'security',
    title: 'Phishing attempt blocked',
    description: 'Suspicious login page detected at paypa1-secure.com',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    metadata: { risk: 'high', url: 'https://paypa1-secure.com/login' },
  },
  {
    id: 'act_002',
    type: 'seo',
    title: 'SEO audit completed',
    description: 'Score 82/100 for acmecorp.com/products',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    metadata: { score: '82', url: 'https://acmecorp.com/products' },
  },
  {
    id: 'act_003',
    type: 'ai',
    title: 'Content generated',
    description: 'Blog post draft: "10 Ways to Improve Web Security"',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    metadata: { words: '1247', type: 'blog' },
  },
  {
    id: 'act_004',
    type: 'note',
    title: 'Note saved',
    description: 'Competitor analysis for TechRival landing page',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    metadata: { url: 'https://techrival.io' },
  },
  {
    id: 'act_005',
    type: 'scan',
    title: 'Security scan completed',
    description: 'Score 91/100 for staging.acmecorp.com',
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    metadata: { score: '91', url: 'https://staging.acmecorp.com' },
  },
]

export const promptTemplates: PromptTemplate[] = [
  {
    id: 'tpl_001',
    title: 'Blog Post Outline',
    category: 'Content Marketing',
    description: 'Generate a structured blog post outline with SEO-optimized headings',
    template:
      'Create a comprehensive blog post outline about {{topic}} for {{audience}}. Include an engaging title, meta description (155 chars), introduction hook, {{section_count}} main sections with H2 headings, key points for each section, and a compelling CTA. Tone: {{tone}}.',
    variables: ['topic', 'audience', 'section_count', 'tone'],
    usageCount: 156,
    isFavorite: true,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl_002',
    title: 'Security Incident Report',
    category: 'Security',
    description: 'Draft a professional security incident report for stakeholders',
    template:
      'Write a security incident report for {{incident_type}} detected on {{date}}. Include: executive summary, timeline of events, affected systems ({{systems}}), root cause analysis, remediation steps taken, and recommendations to prevent recurrence. Audience: {{audience}}.',
    variables: ['incident_type', 'date', 'systems', 'audience'],
    usageCount: 43,
    isFavorite: false,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl_003',
    title: 'Product Description',
    category: 'E-commerce',
    description: 'Write compelling product descriptions optimized for conversion',
    template:
      'Write a product description for {{product_name}}. Key features: {{features}}. Target customer: {{customer}}. Include benefits-focused copy, technical specs section, and SEO keywords: {{keywords}}. Max {{word_count}} words.',
    variables: ['product_name', 'features', 'customer', 'keywords', 'word_count'],
    usageCount: 89,
    isFavorite: true,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl_004',
    title: 'Email Campaign',
    category: 'Marketing',
    description: 'Create email marketing copy with subject line variants',
    template:
      'Create an email campaign for {{campaign_goal}}. Product/service: {{product}}. Write 3 subject line variants (under 50 chars), preview text, email body with {{sections}} sections, and CTA button text. Tone: {{tone}}. Personalization tokens: {{tokens}}.',
    variables: ['campaign_goal', 'product', 'sections', 'tone', 'tokens'],
    usageCount: 67,
    isFavorite: false,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl_005',
    title: 'Code Review Checklist',
    category: 'Development',
    description: 'Generate a thorough code review checklist for pull requests',
    template:
      'Create a code review checklist for a {{language}} {{project_type}} project. Focus areas: {{focus_areas}}. Include security considerations, performance checks, testing requirements, documentation standards, and accessibility guidelines. Format as actionable checklist items.',
    variables: ['language', 'project_type', 'focus_areas'],
    usageCount: 34,
    isFavorite: false,
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'tpl_006',
    title: 'SEO Meta Tags',
    category: 'SEO',
    description: 'Generate optimized title tags and meta descriptions',
    template:
      'Generate SEO meta tags for a page about {{topic}} on {{domain}}. Target keyword: {{keyword}}. Create: 1) Title tag (50-60 chars), 2) Meta description (150-155 chars), 3) OG title, 4) OG description, 5) 5 related long-tail keywords. Competitor reference: {{competitor}}.',
    variables: ['topic', 'domain', 'keyword', 'competitor'],
    usageCount: 112,
    isFavorite: true,
    createdAt: '2025-06-01T00:00:00Z',
  },
]

export const savedPrompts: SavedPrompt[] = [
  {
    id: 'sp_001',
    title: 'Q3 Product Launch Blog',
    content:
      'Create a blog post announcing our Q3 product launch of CloudShield Pro. Highlight enterprise security features, zero-trust architecture, and 99.99% uptime SLA. Target audience: IT directors at mid-market companies.',
    category: 'Content Marketing',
    createdAt: '2026-06-10T14:30:00Z',
    updatedAt: '2026-06-12T09:15:00Z',
  },
  {
    id: 'sp_002',
    title: 'Weekly Security Digest',
    content:
      'Summarize this week\'s security events for our internal team. Include: new CVEs affecting our stack (React, Node.js, PostgreSQL), phishing trends, and recommended actions for each finding.',
    category: 'Security',
    createdAt: '2026-06-08T10:00:00Z',
    updatedAt: '2026-06-08T10:00:00Z',
  },
]

export const contentGenerations: ContentGeneration[] = [
  {
    id: 'cg_001',
    title: '10 Ways to Improve Web Security in 2026',
    type: 'blog',
    content:
      '# 10 Ways to Improve Web Security in 2026\n\nWeb security threats evolve faster than ever. With AI-powered attacks and sophisticated phishing campaigns on the rise, organizations need a proactive approach to protecting their digital assets.\n\n## 1. Implement Zero-Trust Architecture\n\nZero-trust assumes no user or device is trustworthy by default. Every access request must be verified, regardless of origin.\n\n## 2. Enable Multi-Factor Authentication Everywhere\n\nMFA blocks 99.9% of automated account compromise attacks according to Microsoft\'s 2025 security report.\n\n## 3. Regular Security Header Audits\n\nEnsure CSP, HSTS, X-Frame-Options, and X-Content-Type-Options headers are properly configured on all domains.\n\n## 4. Deploy Real-Time Phishing Protection\n\nBrowser-based phishing detection catches threats before users enter credentials on malicious pages.\n\n## 5. Automate Dependency Scanning\n\nIntegrate SCA tools into your CI/CD pipeline to catch vulnerable packages before deployment.',
    tone: 'Professional',
    wordCount: 1247,
    createdAt: '2026-06-14T16:45:00Z',
    status: 'completed',
  },
  {
    id: 'cg_002',
    title: 'Product Update Email - June 2026',
    type: 'email',
    content:
      'Subject: New in TechShield AI: Advanced SEO Analytics\n\nHi {{first_name}},\n\nWe\'re excited to announce three powerful updates to your TechShield AI workspace:\n\n• Core Web Vitals monitoring in SEO Analyzer\n• Team-shared prompt libraries\n• Enhanced phishing detection with visual DOM analysis\n\nThese features are live in your dashboard now. Log in to explore what\'s new.\n\nBest,\nThe TechShield AI Team',
    tone: 'Friendly',
    wordCount: 89,
    createdAt: '2026-06-13T11:20:00Z',
    status: 'draft',
  },
  {
    id: 'cg_003',
    title: 'LinkedIn Post - Security Awareness',
    type: 'social',
    content:
      '🔒 73% of data breaches start with a phishing email.\n\nYet most teams still rely on annual security training that employees forget within weeks.\n\nReal-time browser protection catches threats at the moment of click — not after the damage is done.\n\nWhat\'s your team doing differently in 2026?\n\n#CyberSecurity #InfoSec #Phishing',
    tone: 'Thought Leadership',
    wordCount: 58,
    createdAt: '2026-06-12T08:30:00Z',
    status: 'completed',
  },
]

export const seoReports: SeoReport[] = [
  {
    id: 'seo_001',
    url: 'https://acmecorp.com/products',
    title: 'Acme Products - Cloud Security Solutions',
    score: 82,
    issues: [
      {
        id: 'si_001',
        type: 'warning',
        category: 'Meta Tags',
        title: 'Meta description too short',
        description: 'Meta description is 98 characters. Recommended: 150-155 characters for optimal SERP display.',
        impact: 'medium',
        element: '<meta name="description">',
      },
      {
        id: 'si_002',
        type: 'error',
        category: 'Images',
        title: '3 images missing alt text',
        description: 'Images without alt attributes harm accessibility and image SEO rankings.',
        impact: 'high',
        element: 'img.hero-banner, img.feature-2, img.feature-3',
      },
      {
        id: 'si_003',
        type: 'info',
        category: 'Structure',
        title: 'Multiple H1 tags detected',
        description: 'Page contains 2 H1 elements. Best practice is a single H1 per page.',
        impact: 'low',
        element: 'h1',
      },
      {
        id: 'si_004',
        type: 'warning',
        category: 'Performance',
        title: 'Large render-blocking resources',
        description: '2 CSS files (142KB total) are blocking initial render. Consider inlining critical CSS.',
        impact: 'medium',
      },
      {
        id: 'si_005',
        type: 'info',
        category: 'Links',
        title: 'External links missing rel="noopener"',
        description: '4 external links open in new tabs without rel="noopener noreferrer" attribute.',
        impact: 'low',
      },
    ],
    metrics: {
      titleLength: 42,
      metaDescriptionLength: 98,
      h1Count: 2,
      imageAltMissing: 3,
      internalLinks: 24,
      externalLinks: 8,
      wordCount: 1856,
      loadTime: 2.3,
    },
    scannedAt: new Date(Date.now() - 3600000).toISOString(),
  },
]

export const securityScans: SecurityScan[] = [
  {
    id: 'sec_001',
    url: 'https://acmecorp.com',
    score: 91,
    riskLevel: 'low',
    findings: [
      {
        id: 'sf_001',
        category: 'headers',
        severity: 'success',
        title: 'Strict-Transport-Security',
        description: 'HSTS header present with max-age=31536000; includeSubDomains',
        recommendation: 'No action required. Configuration is optimal.',
        status: 'pass',
      },
      {
        id: 'sf_002',
        category: 'headers',
        severity: 'success',
        title: 'Content-Security-Policy',
        description: 'CSP header configured with restrictive default-src policy',
        recommendation: 'No action required.',
        status: 'pass',
      },
      {
        id: 'sf_003',
        category: 'headers',
        severity: 'warning',
        title: 'X-Frame-Options',
        description: 'X-Frame-Options header is missing. Site may be vulnerable to clickjacking.',
        recommendation: 'Add header: X-Frame-Options: DENY or SAMEORIGIN',
        status: 'warn',
      },
      {
        id: 'sf_004',
        category: 'headers',
        severity: 'error',
        title: 'Permissions-Policy',
        description: 'Permissions-Policy header not set. Browser features are not restricted.',
        recommendation: 'Add Permissions-Policy to restrict camera, microphone, geolocation access.',
        status: 'fail',
      },
      {
        id: 'sf_005',
        category: 'ssl',
        severity: 'success',
        title: 'TLS Configuration',
        description: 'TLS 1.3 enabled with strong cipher suites',
        recommendation: 'No action required.',
        status: 'pass',
      },
      {
        id: 'sf_006',
        category: 'cookies',
        severity: 'warning',
        title: 'Cookie Security Flags',
        description: 'Session cookie "_session" missing Secure and SameSite=Strict flags',
        recommendation: 'Set Secure, HttpOnly, and SameSite=Strict on all session cookies.',
        status: 'warn',
      },
      {
        id: 'sf_007',
        category: 'content',
        severity: 'success',
        title: 'Mixed Content',
        description: 'No mixed content detected. All resources loaded over HTTPS.',
        recommendation: 'No action required.',
        status: 'pass',
      },
    ],
    ssl: {
      valid: true,
      issuer: 'Let\'s Encrypt Authority X3',
      expiresAt: '2026-09-14T23:59:59Z',
      protocol: 'TLS 1.3',
    },
    scannedAt: new Date(Date.now() - 7200000).toISOString(),
  },
]

export const notes: Note[] = [
  {
    id: 'note_001',
    title: 'Competitor Landing Page Analysis',
    content:
      'TechRival.io uses React + Next.js (detected via TechShield). Their hero CTA is above fold with social proof (2,400+ customers). Pricing page has 3 tiers: $19/$49/$99. SEO score: 78. Missing structured data for products. Security: no CSP header, SSL valid.',
    url: 'https://techrival.io',
    tags: ['research', 'seo', 'client'],
    isPinned: true,
    isArchived: false,
    createdAt: '2026-06-14T10:30:00Z',
    updatedAt: '2026-06-14T14:20:00Z',
  },
  {
    id: 'note_002',
    title: 'Q3 Content Calendar Ideas',
    content:
      '1. Web security trends 2026 (blog)\n2. Phishing statistics infographic (social)\n3. SEO checklist downloadable (lead magnet)\n4. Customer case study: FinServ client\n5. Product update webinar (email campaign)',
    url: 'https://acmecorp.com/marketing',
    tags: ['idea', 'meeting'],
    isPinned: true,
    isArchived: false,
    createdAt: '2026-06-13T09:00:00Z',
    updatedAt: '2026-06-13T09:00:00Z',
  },
  {
    id: 'note_003',
    title: 'Security Audit Findings - Staging',
    content:
      'Staging environment missing X-Frame-Options and Permissions-Policy headers. Session cookies need Secure flag. SSL cert expires Sept 2026. Recommend fixing before production deploy. Ticket: SEC-2847',
    url: 'https://staging.acmecorp.com',
    tags: ['security'],
    isPinned: false,
    isArchived: false,
    createdAt: '2026-06-12T16:45:00Z',
    updatedAt: '2026-06-12T16:45:00Z',
  },
  {
    id: 'note_004',
    title: 'Client Call - Globex Corp',
    content:
      'Met with Priya (IT Director) and team. Interested in Enterprise plan with SSO via Okta. Need: audit logs, DLP, custom security policies. Follow-up demo scheduled for June 20. Send security whitepaper and SOC 2 report.',
    url: 'https://globexcorp.com',
    tags: ['meeting', 'client'],
    isPinned: false,
    isArchived: false,
    createdAt: '2026-06-11T11:00:00Z',
    updatedAt: '2026-06-11T11:30:00Z',
  },
  {
    id: 'note_005',
    title: 'React 19 Migration Notes',
    content:
      'Key changes: new compiler, Actions API, use() hook, document metadata support. Our extension MV3 service worker needs testing with React 19 concurrent features. Check CRXJS compatibility.',
    url: 'https://react.dev/blog/2024/12/05/react-19',
    tags: ['research', 'personal'],
    isPinned: false,
    isArchived: false,
    createdAt: '2026-06-10T08:15:00Z',
    updatedAt: '2026-06-10T08:15:00Z',
  },
]

export const tabContext = {
  url: 'https://acmecorp.com/products',
  title: 'Acme Products - Cloud Security Solutions',
  favicon: 'https://acmecorp.com/favicon.ico',
  domain: 'acmecorp.com',
}

export const promptCategories = [
  'All',
  'Content Marketing',
  'Security',
  'E-commerce',
  'Marketing',
  'Development',
  'SEO',
]

export const contentTypes = [
  { id: 'blog', label: 'Blog Post', description: 'Long-form articles and guides' },
  { id: 'email', label: 'Email', description: 'Marketing and transactional emails' },
  { id: 'social', label: 'Social Media', description: 'Posts for LinkedIn, Twitter, etc.' },
  { id: 'product', label: 'Product Copy', description: 'Descriptions and feature pages' },
  { id: 'ad', label: 'Ad Copy', description: 'PPC and display ad variations' },
]

export const toneOptions = [
  'Professional',
  'Friendly',
  'Thought Leadership',
  'Technical',
  'Conversational',
  'Persuasive',
]
