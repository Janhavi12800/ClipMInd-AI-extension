# TechShield AI

Enterprise-grade AI-powered Chrome Extension + SaaS Platform.

## Project Structure

```
├── docs/                    # Product, deployment, security, marketing docs
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SECURITY_CHECKLIST.md
│   ├── LAUNCH_CHECKLIST.md
│   ├── GROWTH_ROADMAP.md
│   ├── CHROME_WEB_STORE.md
│   ├── PRIVACY_POLICY.md
│   ├── API.md
│   └── marketing/
├── frontend/                # React + TypeScript + Tailwind + Vite + Zustand
├── extension/               # Chrome Extension (Manifest V3)
├── supabase/                # PostgreSQL + Edge Functions (API, Auth, Payments)
├── docker/                  # Docker + monitoring stack
├── tests/                   # Unit, integration, E2E, security, load tests
├── store/                   # Chrome Web Store listing assets
└── scripts/                 # Backup and ops scripts
```

## Quick Start

### Frontend
```bash
cd frontend && npm install && npm run dev
```

### Backend
```bash
cd supabase
cp .env.example .env
supabase start
supabase db reset
supabase functions serve --env-file .env
```

### Chrome Extension
```bash
cd extension
npm install
npm run build
# Load extension/dist in chrome://extensions
```

### Run All Tests
```bash
npm install
npm run test          # Unit + integration
npm run test:e2e      # Playwright E2E
npm run test:security # OWASP security scan
npm run test:load     # k6 load test
```

### Production Deployment
```bash
docker compose -f docker/docker-compose.prod.yml up -d --build
```

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for full production setup.

## Plans

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 10 prompts/day, basic security, 5 scans/day |
| **Pro** | $19/mo | Unlimited prompts, full security suite, SEO export |
| **Business** | $49/mo | Team collaboration, 25 seats, audit logs |

Payments via **Stripe** (global) and **Razorpay** (India/APAC).

## Modules

1. AI Prompt Generator
2. AI Prompt Enhancer
3. Prompt Library
4. Website Security Scanner
5. Phishing Detector
6. Malware Warning
7. SEO Analyzer
8. Meta Tag Analyzer
9. Heading Structure Analyzer
10. Website Technology Detector
11. CMS Detector
12. Framework Detector
13. Notes Manager
14. Productivity Toolkit
