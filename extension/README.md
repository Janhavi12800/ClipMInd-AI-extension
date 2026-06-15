# TechShield AI — Chrome Extension

Manifest V3 Chrome extension with AI prompts, security scanning, SEO analysis, technology detection, notes, and productivity tools.

## Features

### AI Module
- **Prompt Generator** — 6 enterprise templates with variable substitution
- **Prompt Enhancer** — Improve rough prompts with tone/audience controls
- **Prompt Library** — Save, manage, and reuse generated prompts

### Security Module
- **Website Security Scanner** — DOM + HTTP header analysis
- **Phishing Detector** — Typosquatting, suspicious TLDs, credential harvesting
- **Malware Warning** — Suspicious scripts, downloads, and URL patterns

### SEO Module
- **SEO Analyzer** — Overall page SEO scoring
- **Meta Tag Analyzer** — Title, description, canonical, OG tags
- **Heading Structure Analyzer** — H1-H6 hierarchy validation

### Technology Module
- **Website Technology Detector** — 30+ detection rules
- **CMS Detector** — WordPress, Shopify, Drupal, etc.
- **Framework Detector** — React, Vue, Angular, Next.js, etc.

### Productivity
- **Notes Manager** — URL-anchored notes with tags
- **Productivity Toolkit** — Snippets, tasks, Pomodoro timer

## Structure

```
extension/
├── public/icons/           # Extension icons (16-128px)
├── scripts/                # Build scripts
├── src/
│   ├── manifest.ts         # MV3 manifest definition
│   ├── background/
│   │   └── service-worker.ts   # Service worker (background)
│   ├── content/
│   │   ├── content-script.ts   # Content script + messaging
│   │   └── page-extractor.ts   # DOM data extraction
│   ├── modules/
│   │   ├── ai/             # Prompt generator, enhancer, library
│   │   ├── security/       # Scanner, phishing, malware
│   │   ├── seo/            # SEO, meta, headings
│   │   ├── tech/           # Technology detection
│   │   ├── notes/          # Notes manager
│   │   └── productivity/   # Snippets, tasks, timer
│   ├── lib/                # Messaging, storage, logger, security
│   ├── ui/                 # Shared CSS and helpers
│   ├── popup/              # Extension popup (360px)
│   ├── sidepanel/          # Full side panel UI
│   └── options/            # Settings page
├── vite.config.ts
└── package.json
```

## Messaging System

```
Popup / Sidepanel / Options
        │
        ▼ chrome.runtime.sendMessage
   Service Worker
        │
        ├── chrome.tabs.sendMessage → Content Script (DOM analysis)
        ├── chrome.storage.local (persistence)
        └── chrome.notifications (alerts)
```

## Development

```bash
cd extension
npm install
npm run dev
```

Load unpacked extension from `extension/dist` in `chrome://extensions`.

## Build

```bash
npm run build
```

Output in `dist/` ready for Chrome Web Store submission.

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab on user action |
| `storage` | Save settings, notes, prompts |
| `alarms` | Pomodoro timer |
| `sidePanel` | Side panel UI |
| `tabs` | Tab info and badge updates |
| `scripting` | Dynamic content script injection |
| `notifications` | Security and timer alerts |
| `<all_urls>` | Analyze any webpage (host permission) |
