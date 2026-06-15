# TechShield AI

Enterprise-grade AI-powered Chrome Extension + SaaS Platform.

## Project Structure

```
├── docs/                    # Product specification & API documentation
│   ├── TECHSHIELD_AI_PRODUCT_SPEC.md
│   └── API.md
├── frontend/                # React + TypeScript + Tailwind + Vite + Zustand
│   └── README.md
├── supabase/                # Supabase backend (PostgreSQL + Edge Functions)
│   ├── migrations/          # Database schema (8 migrations)
│   ├── functions/         # Edge Functions (api, auth-session)
│   └── README.md
└── README.md
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

## Modules

1. AI Prompt Generator
2. AI Prompt Enhancer
3. AI Content Generator
4. Website Security Scanner
5. Phishing Detector
6. Malware Detection
7. SEO Analyzer
8. Website Technology Detector
9. Notes Manager
10. Productivity Toolkit
