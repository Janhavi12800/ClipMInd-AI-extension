# TechShield AI — Chrome Web Store Listing

Complete guide for publishing the extension to the Chrome Web Store.

## Store Listing Assets

### Required files

| Asset | Size | File |
|-------|------|------|
| Extension package | .zip | `extension/dist/` → zip |
| Icon | 128×128 PNG | `extension/public/icons/icon-128.png` |
| Screenshots (min 1, max 5) | 1280×800 or 640×400 | `store/screenshots/` |
| Promotional tile (optional) | 440×280 | `store/screenshots/promo-tile.png` |
| Marquee promo (optional) | 1400×560 | `store/screenshots/marquee.png` |

### Screenshot capture guide

Capture these 5 screenshots from the side panel and popup:

1. **Dashboard Overview** — Home tab with security score and quick actions
2. **AI Prompt Generator** — Template selection with generated prompt
3. **Security Scanner** — Scan results with risk indicators
4. **SEO Analyzer** — Meta tags and heading structure analysis
5. **Billing/Plans** — Plan comparison (from web dashboard)

```bash
# Build extension first
cd extension && npm run build

# Load in Chrome → chrome://extensions → Developer mode → Load unpacked
# Open side panel on a test page → capture screenshots
```

## Listing Copy

### Name
```
TechShield AI — Security, SEO & AI Prompts
```

### Short description (132 chars max)
```
AI prompt generator, website security scanner, phishing detector, SEO analyzer, and productivity tools — all in one extension.
```

### Detailed description
See [store/listing/description.md](../store/listing/description.md)

### Category
**Productivity**

### Language
English (add Hindi, Spanish in v1.1)

## Single Purpose Description

```
TechShield AI provides AI-powered prompt generation, website security analysis, SEO auditing, and productivity tools to help professionals work safer and smarter while browsing the web.
```

## Permission Justifications

| Permission | Justification |
|------------|---------------|
| `activeTab` | Analyze the currently viewed webpage for security threats, SEO issues, and technology detection |
| `storage` | Save user prompts, notes, settings, and scan history locally |
| `alarms` | Schedule periodic security scans and Pomodoro timer |
| `sidePanel` | Display the full-featured analysis and AI tools panel |
| `tabs` | Identify the active tab URL for URL-anchored notes and scan targeting |
| `scripting` | Inject content scripts for DOM analysis on user-initiated scans |
| `notifications` | Alert users to detected phishing sites and malware warnings |
| `<all_urls>` | Required to analyze any website the user visits for security and SEO (only on user action) |

## Privacy Practices

### Data collected
- **Authentication info**: Email (if user signs in to sync)
- **Website content**: Page title, meta tags, headings (for SEO/security analysis, processed locally)
- **User activity**: Feature usage analytics (anonymized)

### Data NOT collected
- Browsing history (beyond current tab on scan)
- Passwords or form data
- Personal files
- Payment card information (handled by Stripe/Razorpay)

### Privacy Policy URL
```
https://techshield.ai/privacy
```
Host the content from [PRIVACY_POLICY.md](./PRIVACY_POLICY.md).

## Compliance Checklist

- [ ] No remotely hosted code (MV3 compliant)
- [ ] No cryptocurrency mining
- [ ] No unauthorized data collection
- [ ] Clear permission justifications provided
- [ ] Privacy policy URL accessible
- [ ] Extension functions as described
- [ ] No deceptive behavior (phishing overlays clearly branded)
- [ ] COPPA compliant (not directed at children under 13)
- [ ] GDPR data processing documented
- [ ] Limited use policy compliance (Google API if using Google OAuth)

## Submission Steps

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item** → Upload `techshield-extension.zip`
3. Fill in store listing (name, description, screenshots)
4. Set **Privacy practices** (data types collected)
5. Set **Distribution** → Public (or Unlisted for beta)
6. Submit for review (typically 1–3 business days)

## Review Tips

- Ensure extension works without requiring account sign-in (local features)
- Demo account credentials in review notes if sign-in required
- Include test URL for security scanning demo
- Respond to reviewer feedback within 24 hours

## Post-Publication

- Monitor reviews and respond within 48 hours
- Track install/uninstall ratio in Chrome Web Store analytics
- A/B test screenshots quarterly
- Update listing with each major version release
