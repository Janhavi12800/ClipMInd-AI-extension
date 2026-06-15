# Screenshots Directory

Place Chrome Web Store screenshots here before submission.

## Required Screenshots (5)

| # | Filename | Content | Size |
|---|----------|---------|------|
| 1 | `01-dashboard.png` | Side panel home with security score | 1280×800 |
| 2 | `02-ai-prompts.png` | Prompt generator with template output | 1280×800 |
| 3 | `03-security-scan.png` | Security scanner results | 1280×800 |
| 4 | `04-seo-analyzer.png` | SEO analysis with meta tags | 1280×800 |
| 5 | `05-billing-plans.png` | Plan comparison (web dashboard) | 1280×800 |

## Optional Promotional Images

| Filename | Size | Usage |
|----------|------|-------|
| `promo-tile.png` | 440×280 | Small promo tile |
| `marquee.png` | 1400×560 | Marquee promotion |

## Capture Instructions

```bash
# 1. Build and load extension
cd extension && npm run build
# Load extension/dist in chrome://extensions

# 2. Open test pages
# - https://example.com (for security/SEO scans)
# - Side panel → each tab for UI screenshots

# 3. Capture using Chrome DevTools or OS screenshot tool
# Ensure 1280×800 resolution (use DevTools device mode)

# 4. Optional: use Playwright for automated captures
npx playwright screenshot --viewport-size=1280,800 http://localhost:5173/billing 05-billing-plans.png
```

## Design Guidelines

- Use light mode for consistency (or provide both themes)
- No personal/sensitive data visible in screenshots
- Include TechShield AI branding visible in each shot
- Add subtle annotations if helpful (arrows, highlights)
