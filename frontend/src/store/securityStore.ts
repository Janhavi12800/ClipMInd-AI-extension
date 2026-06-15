import { create } from 'zustand'
import { securityScans } from '@/data/mockData'
import { generateId } from '@/lib/utils'
import type { RiskLevel, SecurityScan } from '@/types'

interface SecurityState {
  scans: SecurityScan[]
  activeScan: SecurityScan | null
  isScanning: boolean
  scanUrl: string
  filterCategory: string

  setScanUrl: (url: string) => void
  setFilterCategory: (category: string) => void
  runScan: () => void
  selectScan: (id: string | null) => void
}

function scoreToRisk(score: number): RiskLevel {
  if (score >= 90) return 'low'
  if (score >= 70) return 'medium'
  if (score >= 50) return 'high'
  return 'critical'
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  scans: securityScans,
  activeScan: securityScans[0] ?? null,
  isScanning: false,
  scanUrl: 'https://acmecorp.com',
  filterCategory: 'all',

  setScanUrl: (url) => set({ scanUrl: url }),

  setFilterCategory: (category) => set({ filterCategory: category }),

  runScan: () => {
    const { scanUrl } = get()
    if (!scanUrl.trim()) return

    set({ isScanning: true })

    setTimeout(() => {
      const score = Math.floor(Math.random() * 20) + 75
      const scan: SecurityScan = {
        id: generateId(),
        url: scanUrl,
        score,
        riskLevel: scoreToRisk(score),
        findings: [
          {
            id: generateId(),
            category: 'headers',
            severity: 'success',
            title: 'Strict-Transport-Security',
            description: 'HSTS header present with appropriate max-age directive.',
            recommendation: 'No action required.',
            status: 'pass',
          },
          {
            id: generateId(),
            category: 'headers',
            severity: score < 85 ? 'warning' : 'success',
            title: 'Content-Security-Policy',
            description:
              score < 85
                ? 'CSP header is present but allows unsafe-inline scripts.'
                : 'CSP header configured with restrictive policy.',
            recommendation:
              score < 85
                ? 'Remove unsafe-inline and use nonces or hashes for inline scripts.'
                : 'No action required.',
            status: score < 85 ? 'warn' : 'pass',
          },
          {
            id: generateId(),
            category: 'ssl',
            severity: 'success',
            title: 'TLS Configuration',
            description: 'TLS 1.3 enabled with strong cipher suites.',
            recommendation: 'No action required.',
            status: 'pass',
          },
          {
            id: generateId(),
            category: 'cookies',
            severity: 'warning',
            title: 'Cookie Security Flags',
            description: 'One or more cookies missing Secure or SameSite attributes.',
            recommendation:
              'Set Secure, HttpOnly, and SameSite=Strict on all authentication cookies.',
            status: 'warn',
          },
        ],
        ssl: {
          valid: true,
          issuer: "Let's Encrypt Authority X3",
          expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
          protocol: 'TLS 1.3',
        },
        scannedAt: new Date().toISOString(),
      }

      set((state) => ({
        scans: [scan, ...state.scans],
        activeScan: scan,
        isScanning: false,
      }))
    }, 2500)
  },

  selectScan: (id) => {
    if (!id) {
      set({ activeScan: null })
      return
    }
    const scan = get().scans.find((s) => s.id === id)
    set({ activeScan: scan ?? null })
  },
}))
