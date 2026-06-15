export const EXTENSION_NAME = 'TechShield AI'
export const EXTENSION_VERSION = '1.0.0'
export const STORAGE_KEYS = {
  SETTINGS: 'ts_settings',
  PROMPT_LIBRARY: 'ts_prompt_library',
  NOTES: 'ts_notes',
  SCAN_CACHE: 'ts_scan_cache',
  AUTH_TOKEN: 'ts_auth_token',
  BLOCKLIST: 'ts_blocklist',
  PRODUCTIVITY: 'ts_productivity',
} as const

export const DEFAULT_SETTINGS = {
  theme: 'system' as 'light' | 'dark' | 'system',
  autoScan: true,
  phishingSensitivity: 'medium' as 'low' | 'medium' | 'high',
  piiRedaction: true,
  securityAlerts: true,
  apiBaseUrl: '',
  syncEnabled: true,
}

export const MESSAGE_TIMEOUT_MS = 15000
export const SCAN_CACHE_TTL_MS = 15 * 60 * 1000
export const BADGE_COLORS = {
  safe: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  neutral: '#64748b',
} as const

export const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.club', '.work', '.click', '.link', '.gq', '.ml', '.cf', '.tk',
]

export const KNOWN_BRANDS = [
  'google', 'microsoft', 'apple', 'amazon', 'paypal', 'facebook', 'meta',
  'netflix', 'chase', 'wellsfargo', 'bankofamerica', 'linkedin', 'twitter',
  'instagram', 'dropbox', 'adobe', 'github', 'stripe',
]
