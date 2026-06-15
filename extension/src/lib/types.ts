export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  autoScan: boolean
  phishingSensitivity: 'low' | 'medium' | 'high'
  piiRedaction: boolean
  securityAlerts: boolean
  apiBaseUrl: string
  syncEnabled: boolean
}

export interface TabInfo {
  url: string
  title: string
  domain: string
  favicon?: string
}

export interface PromptTemplate {
  id: string
  title: string
  category: string
  description: string
  template: string
  variables: string[]
}

export interface PromptEntry {
  id: string
  title: string
  content: string
  category: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export interface SecurityFinding {
  id: string
  category: string
  severity: 'pass' | 'warn' | 'fail'
  title: string
  description: string
  recommendation: string
}

export interface SecurityScanResult {
  score: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  findings: SecurityFinding[]
  ssl?: { valid: boolean; protocol?: string }
  scannedAt: string
}

export interface PhishingResult {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  signals: Array<{ type: string; detail: string }>
  action: 'allow' | 'warn' | 'block'
}

export interface MalwareResult {
  isThreat: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  signals: Array<{ type: string; detail: string }>
}

export interface SeoIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

export interface SeoResult {
  score: number
  issues: SeoIssue[]
  meta: MetaTagAnalysis
  headings: HeadingAnalysis
  metrics: Record<string, number>
  scannedAt: string
}

export interface MetaTagAnalysis {
  title: string
  titleLength: number
  description: string
  descriptionLength: number
  canonical: string
  ogTitle: string
  ogDescription: string
  robots: string
  issues: SeoIssue[]
}

export interface HeadingAnalysis {
  h1: string[]
  h2: string[]
  h3: string[]
  h4: string[]
  h5: string[]
  h6: string[]
  issues: SeoIssue[]
}

export interface TechDetection {
  name: string
  category: 'cms' | 'framework' | 'analytics' | 'cdn' | 'server' | 'other'
  confidence: number
  version?: string
}

export interface TechResult {
  technologies: TechDetection[]
  cms: TechDetection[]
  frameworks: TechDetection[]
  scannedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  url: string
  tags: string[]
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface PageAnalysisData {
  tab: TabInfo
  security?: SecurityScanResult
  phishing?: PhishingResult
  malware?: MalwareResult
  seo?: SeoResult
  tech?: TechResult
}

// Messaging types
export type MessageType =
  | 'PING'
  | 'GET_TAB_INFO'
  | 'ANALYZE_PAGE'
  | 'RUN_SECURITY_SCAN'
  | 'RUN_SEO_ANALYSIS'
  | 'RUN_TECH_DETECTION'
  | 'CHECK_PHISHING'
  | 'CHECK_MALWARE'
  | 'GENERATE_PROMPT'
  | 'ENHANCE_PROMPT'
  | 'GET_PROMPT_LIBRARY'
  | 'SAVE_PROMPT'
  | 'DELETE_PROMPT'
  | 'GET_NOTES'
  | 'SAVE_NOTE'
  | 'DELETE_NOTE'
  | 'GET_SETTINGS'
  | 'SET_SETTINGS'
  | 'SET_AUTH_TOKEN'
  | 'SYNC_CLOUD'
  | 'GET_PRODUCTIVITY'
  | 'SET_PRODUCTIVITY'
  | 'OPEN_SIDE_PANEL'
  | 'PAGE_ANALYSIS_COMPLETE'

export interface ExtensionMessage<T = unknown> {
  type: MessageType
  payload?: T
  requestId?: string
}

export interface ExtensionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  requestId?: string
}
