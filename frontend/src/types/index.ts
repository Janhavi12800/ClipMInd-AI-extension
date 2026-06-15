export type Theme = 'light' | 'dark' | 'system'

export type Plan = 'free' | 'pro' | 'business' | 'team' | 'enterprise'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type Severity = 'info' | 'warning' | 'error' | 'success'

export type NoteTag =
  | 'research'
  | 'security'
  | 'seo'
  | 'meeting'
  | 'idea'
  | 'client'
  | 'personal'

export interface User {
  id: string
  email: string
  name: string
  avatar: string
  role: string
  department: string
  plan: Plan
  organization: string
  joinedAt: string
  lastActive: string
  timezone: string
  locale: string
  mfaEnabled: boolean
  apiUsage: number
  apiLimit: number
}

export interface Organization {
  id: string
  name: string
  domain: string
  plan: Plan
  seats: number
  seatsUsed: number
  ssoEnabled: boolean
}

export interface PromptTemplate {
  id: string
  title: string
  category: string
  description: string
  template: string
  variables: string[]
  usageCount: number
  isFavorite: boolean
  createdAt: string
}

export interface SavedPrompt {
  id: string
  title: string
  content: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface ContentGeneration {
  id: string
  title: string
  type: 'blog' | 'email' | 'social' | 'product' | 'ad'
  content: string
  tone: string
  wordCount: number
  createdAt: string
  status: 'draft' | 'completed' | 'archived'
}

export interface SeoIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  element?: string
}

export interface SeoReport {
  id: string
  url: string
  title: string
  score: number
  issues: SeoIssue[]
  metrics: {
    titleLength: number
    metaDescriptionLength: number
    h1Count: number
    imageAltMissing: number
    internalLinks: number
    externalLinks: number
    wordCount: number
    loadTime: number
  }
  scannedAt: string
}

export interface SecurityFinding {
  id: string
  category: 'headers' | 'ssl' | 'cookies' | 'content' | 'dns' | 'mixed-content'
  severity: Severity
  title: string
  description: string
  recommendation: string
  status: 'pass' | 'fail' | 'warn'
}

export interface SecurityScan {
  id: string
  url: string
  score: number
  riskLevel: RiskLevel
  findings: SecurityFinding[]
  ssl: {
    valid: boolean
    issuer: string
    expiresAt: string
    protocol: string
  }
  scannedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  url: string
  tags: NoteTag[]
  isPinned: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface ActivityItem {
  id: string
  type: 'scan' | 'ai' | 'note' | 'security' | 'seo'
  title: string
  description: string
  timestamp: string
  metadata?: Record<string, string>
}

export interface DashboardStat {
  id: string
  label: string
  value: string | number
  change: number
  changeLabel: string
  icon: string
}

export interface NavItem {
  id: string
  label: string
  path: string
  icon: string
  badge?: string | number
  children?: NavItem[]
}

export interface UserSettings {
  theme: Theme
  emailNotifications: boolean
  securityAlerts: boolean
  weeklyDigest: boolean
  piiRedaction: boolean
  autoScan: boolean
  compactMode: boolean
  language: string
  defaultAiModel: 'fast' | 'quality'
  phishingSensitivity: 'low' | 'medium' | 'high'
}

export interface TabContext {
  url: string
  title: string
  favicon: string
  domain: string
}

export type ViewMode = 'dashboard' | 'popup' | 'sidebar'

export type SidebarModule =
  | 'home'
  | 'prompts'
  | 'content'
  | 'seo'
  | 'security'
  | 'notes'
  | 'settings'
