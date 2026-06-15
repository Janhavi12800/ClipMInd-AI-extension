# SEO Strategy

## Goals

| Timeframe | Organic Traffic | Keywords Top 10 | Domain Authority |
|-----------|----------------|-----------------|------------------|
| 3 months | 10,000/mo | 15 | 20 |
| 6 months | 50,000/mo | 40 | 30 |
| 12 months | 150,000/mo | 100 | 40 |

## Site Architecture

```
techshield.ai/
├── /                          # Landing page (primary conversion)
├── /features/
│   ├── /ai-prompt-generator   # Target: "AI prompt generator"
│   ├── /security-scanner      # Target: "website security scanner"
│   ├── /phishing-detector     # Target: "phishing detector chrome"
│   ├── /seo-analyzer          # Target: "SEO analyzer extension"
│   └── /technology-detector   # Target: "website technology detector"
├── /pricing                   # Target: "AI security extension pricing"
├── /blog/                     # Content hub
├── /chrome-extension          # Extension download page
├── /privacy                   # Privacy policy
└── /docs/                     # Documentation (developer SEO)
```

## Keyword Strategy

### Tier 1: High-intent (landing pages)

| Keyword | Volume | Page | Priority |
|---------|--------|------|----------|
| chrome security extension | 2,400 | /chrome-extension | P0 |
| AI prompt generator | 18,100 | /features/ai-prompt-generator | P0 |
| website security scanner online | 8,100 | /features/security-scanner | P0 |
| SEO analyzer tool | 6,600 | /features/seo-analyzer | P0 |
| phishing website checker | 4,400 | /features/phishing-detector | P1 |

### Tier 2: Informational (blog content)

| Keyword | Volume | Content Type |
|---------|--------|-------------|
| how to detect phishing websites | 3,600 | Guide (2,500 words) |
| best chrome extensions for security | 2,900 | Listicle |
| AI prompts for marketing | 5,400 | Template gallery |
| SEO meta tags best practices | 8,100 | Tutorial |
| how to check website technology | 1,900 | Guide |

### Tier 3: Long-tail (blog + docs)

| Keyword | Volume | Content Type |
|---------|--------|-------------|
| chrome extension to analyze website security | 480 | Feature page |
| free AI prompt generator for business | 1,300 | Landing page variant |
| detect wordpress version chrome extension | 320 | Blog post |

## On-Page SEO Checklist

Every page must include:
- [ ] Unique title tag (50–60 chars, primary keyword first)
- [ ] Meta description (150–155 chars, include CTA)
- [ ] H1 with primary keyword
- [ ] Structured data (JSON-LD: SoftwareApplication, FAQPage)
- [ ] Internal links to 3+ related pages
- [ ] Optimized images with alt text
- [ ] Mobile-responsive design
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

## Content Calendar (First 90 Days)

### Month 1
| Week | Post | Target Keyword |
|------|------|---------------|
| 1 | "10 Signs a Website Is a Phishing Site" | phishing website signs |
| 1 | "How to Write AI Prompts That Actually Work" | AI prompt tips |
| 2 | "Complete Guide to Website Security Scanning" | website security scan |
| 2 | "SEO Meta Tags Checklist for 2026" | SEO meta tags |
| 3 | "Best Chrome Extensions for Cybersecurity Pros" | security chrome extensions |
| 3 | "TechShield AI vs [Competitor] Comparison" | brand comparison |
| 4 | "How to Detect Website Technology Stack" | website technology checker |
| 4 | "AI Prompt Templates for Content Marketers" | marketing AI prompts |

### Month 2–3
- 2 posts per week (alternating security and AI topics)
- 1 comparison page per week
- 1 case study every 2 weeks

## Technical SEO

- XML sitemap auto-generated
- robots.txt allowing all public pages
- Canonical URLs on all pages
- hreflang tags for international (en, hi, es in v2)
- Schema markup for SoftwareApplication:
  ```json
  {
    "@type": "SoftwareApplication",
    "name": "TechShield AI",
    "applicationCategory": "BrowserApplication",
    "operatingSystem": "Chrome",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  }
  ```

## Link Building

| Tactic | Target | Timeline |
|--------|--------|----------|
| Product Hunt launch | DR 91 backlink | Month 1 |
| Chrome Web Store listing | DR 99 backlink | Month 1 |
| Guest posts on security blogs | 5 links (DR 40+) | Month 2–3 |
| HARO responses | 3 links (DR 50+) | Ongoing |
| Tool directories (AlternativeTo, SaaSHub) | 10 listings | Month 1 |
| Open-source security rules repo | GitHub stars + links | Month 2 |

## Measurement

Track in Google Search Console + Plausible/PostHog:
- Organic impressions and clicks by page
- Keyword rankings (Ahrefs/Semrush)
- Organic conversion rate (install, signup)
- Bounce rate by landing page
- Core Web Vitals in CrUX report

## Monthly SEO Review

1. Review top 20 performing pages
2. Identify keyword gaps vs. competitors
3. Update underperforming content
4. Build 5 new internal links
5. Publish 8 new content pieces
