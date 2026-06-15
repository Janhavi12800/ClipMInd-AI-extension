import type { TechDetection, TechResult } from '../../lib/types'

interface DetectionRule {
  name: string
  category: TechDetection['category']
  patterns: Array<{ type: 'html' | 'script' | 'meta' | 'header'; regex: RegExp; version?: RegExp }>
}

const DETECTION_RULES: DetectionRule[] = [
  // CMS
  { name: 'WordPress', category: 'cms', patterns: [
    { type: 'html', regex: /wp-content|wp-includes/i },
    { type: 'meta', regex: /WordPress/i },
  ]},
  { name: 'Shopify', category: 'cms', patterns: [
    { type: 'html', regex: /cdn\.shopify\.com/i },
    { type: 'script', regex: /Shopify\./i },
  ]},
  { name: 'Drupal', category: 'cms', patterns: [
    { type: 'html', regex: /Drupal\.settings|drupal\.js/i },
    { type: 'meta', regex: /Drupal/i },
  ]},
  { name: 'Joomla', category: 'cms', patterns: [
    { type: 'html', regex: /\/media\/jui\/|Joomla!/i },
  ]},
  { name: 'Wix', category: 'cms', patterns: [
    { type: 'html', regex: /wix\.com|parastorage\.com/i },
  ]},
  { name: 'Squarespace', category: 'cms', patterns: [
    { type: 'html', regex: /squarespace\.com|static\.squarespace/i },
  ]},
  { name: 'Webflow', category: 'cms', patterns: [
    { type: 'html', regex: /webflow\.com|website-files\.com/i },
  ]},
  // Frameworks
  { name: 'React', category: 'framework', patterns: [
    { type: 'html', regex: /data-reactroot|__NEXT_DATA__|_reactRootContainer/i },
    { type: 'script', regex: /react(?:\.production|\.development)?\.min\.js/i },
  ]},
  { name: 'Vue.js', category: 'framework', patterns: [
    { type: 'html', regex: /data-v-[a-f0-9]+|__vue__/i },
    { type: 'script', regex: /vue(?:\.runtime)?(?:\.min)?\.js/i },
  ]},
  { name: 'Angular', category: 'framework', patterns: [
    { type: 'html', regex: /ng-version|ng-app/i },
    { type: 'script', regex: /angular(?:\.min)?\.js/i },
  ]},
  { name: 'Next.js', category: 'framework', patterns: [
    { type: 'html', regex: /__NEXT_DATA__|_next\/static/i },
  ]},
  { name: 'Nuxt.js', category: 'framework', patterns: [
    { type: 'html', regex: /__NUXT__|_nuxt\//i },
  ]},
  { name: 'Svelte', category: 'framework', patterns: [
    { type: 'html', regex: /svelte-[a-z0-9]+/i },
  ]},
  { name: 'jQuery', category: 'framework', patterns: [
    { type: 'script', regex: /jquery[.-]?\d/i },
    { type: 'html', regex: /jquery\.min\.js/i },
  ]},
  { name: 'Tailwind CSS', category: 'framework', patterns: [
    { type: 'html', regex: /tailwindcss/i },
  ]},
  { name: 'Bootstrap', category: 'framework', patterns: [
    { type: 'html', regex: /bootstrap(?:\.min)?\.(?:css|js)/i },
  ]},
  // Analytics
  { name: 'Google Analytics', category: 'analytics', patterns: [
    { type: 'script', regex: /google-analytics\.com|googletagmanager\.com/i },
    { type: 'html', regex: /gtag\(|GA_MEASUREMENT_ID/i },
  ]},
  { name: 'Google Tag Manager', category: 'analytics', patterns: [
    { type: 'html', regex: /googletagmanager\.com\/gtm\.js/i },
  ]},
  { name: 'Hotjar', category: 'analytics', patterns: [
    { type: 'script', regex: /hotjar\.com/i },
  ]},
  { name: 'Mixpanel', category: 'analytics', patterns: [
    { type: 'script', regex: /mixpanel\.com/i },
  ]},
  { name: 'Segment', category: 'analytics', patterns: [
    { type: 'script', regex: /segment\.com|segment\.io/i },
  ]},
  // CDN
  { name: 'Cloudflare', category: 'cdn', patterns: [
    { type: 'header', regex: /cloudflare/i },
    { type: 'html', regex: /cdnjs\.cloudflare\.com/i },
  ]},
  { name: 'AWS CloudFront', category: 'cdn', patterns: [
    { type: 'header', regex: /cloudfront/i },
  ]},
  { name: 'Fastly', category: 'cdn', patterns: [
    { type: 'header', regex: /fastly/i },
  ]},
  // Server
  { name: 'Nginx', category: 'server', patterns: [
    { type: 'header', regex: /nginx/i },
  ]},
  { name: 'Apache', category: 'server', patterns: [
    { type: 'header', regex: /apache/i },
  ]},
  { name: 'Vercel', category: 'server', patterns: [
    { type: 'header', regex: /vercel/i },
  ]},
]

interface TechScanInput {
  html: string
  scripts: string[]
  metaTags: string
  responseHeaders: string
}

export function detectTechnologies(input: TechScanInput): TechResult {
  const detected: TechDetection[] = []
  const searchContent = {
    html: input.html.slice(0, 500000),
    script: input.scripts.join('\n'),
    meta: input.metaTags,
    header: input.responseHeaders,
  }

  for (const rule of DETECTION_RULES) {
    let matchCount = 0
    let version: string | undefined

    for (const pattern of rule.patterns) {
      const content = searchContent[pattern.type === 'script' ? 'script' : pattern.type]
      if (pattern.regex.test(content)) {
        matchCount++
        if (pattern.version) {
          const versionMatch = content.match(pattern.version)
          if (versionMatch) version = versionMatch[1]
        }
      }
    }

    if (matchCount > 0) {
      detected.push({
        name: rule.name,
        category: rule.category,
        confidence: Math.min(100, 50 + matchCount * 25),
        version,
      })
    }
  }

  return {
    technologies: detected,
    cms: detected.filter((t) => t.category === 'cms'),
    frameworks: detected.filter((t) => t.category === 'framework'),
    scannedAt: new Date().toISOString(),
  }
}

export function detectCms(input: TechScanInput): TechDetection[] {
  return detectTechnologies(input).cms
}

export function detectFrameworks(input: TechScanInput): TechDetection[] {
  return detectTechnologies(input).frameworks
}
