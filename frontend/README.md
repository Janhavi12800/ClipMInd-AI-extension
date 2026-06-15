# TechShield AI — Frontend

Enterprise-grade React frontend for the TechShield AI Chrome Extension + SaaS platform.

## Tech Stack

- **React 19** with TypeScript
- **Vite 8** for build tooling
- **Tailwind CSS 4** for styling (dark/light mode via CSS variables)
- **Zustand** for state management
- **React Router 7** for navigation
- **Lucide React** for icons

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Routes

| Route | View |
|-------|------|
| `/` | Landing Dashboard |
| `/ai/prompts` | AI Prompt Generator |
| `/ai/content` | Content Generator |
| `/seo` | SEO Analyzer |
| `/security` | Security Scanner |
| `/notes` | Notes Manager |
| `/settings` | Settings Page |
| `/profile` | User Profile |
| `/popup` | Chrome Extension Popup (380×520) |
| `/sidebar` | Chrome Extension Side Panel (400×720) |

## Folder Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Switch.tsx
│   │   │   ├── ScoreRing.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── layout/          # App shell components
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   └── MainLayout.tsx
│   │   └── shared/          # Domain-shared components
│   │       ├── StatCard.tsx
│   │       ├── ActivityFeed.tsx
│   │       └── TabContextBar.tsx
│   ├── pages/               # Dashboard route pages
│   │   ├── DashboardPage.tsx
│   │   ├── PromptGeneratorPage.tsx
│   │   ├── ContentGeneratorPage.tsx
│   │   ├── SeoAnalyzerPage.tsx
│   │   ├── SecurityScannerPage.tsx
│   │   ├── NotesManagerPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── ProfilePage.tsx
│   ├── views/               # Extension UI surfaces
│   │   ├── PopupView.tsx
│   │   └── SidebarView.tsx
│   ├── store/               # Zustand state management
│   │   ├── themeStore.ts    # Theme + UI + Settings
│   │   ├── authStore.ts     # User + Organization
│   │   ├── aiStore.ts       # Prompt Generator
│   │   ├── contentStore.ts  # Content Generator
│   │   ├── seoStore.ts      # SEO Analyzer
│   │   ├── securityStore.ts # Security Scanner
│   │   └── notesStore.ts    # Notes Manager
│   ├── data/
│   │   └── mockData.ts      # Production-quality seed data
│   ├── types/
│   │   └── index.ts         # TypeScript interfaces
│   ├── lib/
│   │   └── utils.ts         # cn(), formatters, helpers
│   ├── App.tsx              # Router configuration
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind + theme tokens
├── index.html
├── vite.config.ts
├── tsconfig.app.json
└── package.json
```

## State Management

| Store | Responsibility | Persistence |
|-------|---------------|-------------|
| `useThemeStore` | Light/dark/system theme | localStorage |
| `useSettingsStore` | User preferences | localStorage |
| `useUIStore` | Sidebar, search, navigation | Memory |
| `useAuthStore` | User profile, organization | Memory |
| `useAIStore` | Templates, prompts, generation | Memory |
| `useContentStore` | Content generation, history | Memory |
| `useSeoStore` | SEO reports, scanning | Memory |
| `useSecurityStore` | Security scans, findings | Memory |
| `useNotesStore` | Notes CRUD, filtering | localStorage |

## Component Architecture

```
App
├── MainLayout (dashboard routes)
│   ├── AppSidebar
│   ├── AppHeader
│   └── Page Content
├── PopupView (extension popup)
└── SidebarView (extension side panel)
```

## Accessibility

- Skip-to-content link
- ARIA labels on interactive elements
- `role` attributes on tabs, switches, progress bars
- Focus-visible outlines
- `prefers-reduced-motion` support
- Semantic HTML throughout

## Build

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build
```
