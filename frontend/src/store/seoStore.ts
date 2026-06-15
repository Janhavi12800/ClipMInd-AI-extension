import { create } from 'zustand'
import { seoReports } from '@/data/mockData'
import { generateId } from '@/lib/utils'
import type { SeoReport } from '@/types'

interface SeoState {
  reports: SeoReport[]
  activeReport: SeoReport | null
  isScanning: boolean
  scanUrl: string
  filterImpact: 'all' | 'high' | 'medium' | 'low'

  setScanUrl: (url: string) => void
  setFilterImpact: (filter: SeoState['filterImpact']) => void
  runScan: () => void
  selectReport: (id: string | null) => void
}

export const useSeoStore = create<SeoState>((set, get) => ({
  reports: seoReports,
  activeReport: seoReports[0] ?? null,
  isScanning: false,
  scanUrl: 'https://acmecorp.com/products',
  filterImpact: 'all',

  setScanUrl: (url) => set({ scanUrl: url }),

  setFilterImpact: (filter) => set({ filterImpact: filter }),

  runScan: () => {
    const { scanUrl } = get()
    if (!scanUrl.trim()) return

    set({ isScanning: true })

    setTimeout(() => {
      const report: SeoReport = {
        id: generateId(),
        url: scanUrl,
        title: `SEO Report — ${new URL(scanUrl).hostname}`,
        score: Math.floor(Math.random() * 25) + 70,
        issues: [
          {
            id: generateId(),
            type: 'warning',
            category: 'Meta Tags',
            title: 'Meta description length suboptimal',
            description:
              'Meta description should be between 150-155 characters for optimal search engine display.',
            impact: 'medium',
            element: '<meta name="description">',
          },
          {
            id: generateId(),
            type: 'error',
            category: 'Images',
            title: 'Images missing alt attributes',
            description:
              'Found images without alt text. This impacts accessibility scores and image search rankings.',
            impact: 'high',
          },
          {
            id: generateId(),
            type: 'info',
            category: 'Structure',
            title: 'Heading hierarchy review recommended',
            description:
              'Verify H1-H6 tags follow a logical hierarchy without skipped levels.',
            impact: 'low',
          },
        ],
        metrics: {
          titleLength: 48,
          metaDescriptionLength: 112,
          h1Count: 1,
          imageAltMissing: 2,
          internalLinks: 18,
          externalLinks: 6,
          wordCount: 1420,
          loadTime: 1.8 + Math.random() * 1.5,
        },
        scannedAt: new Date().toISOString(),
      }

      set((state) => ({
        reports: [report, ...state.reports],
        activeReport: report,
        isScanning: false,
      }))
    }, 2000)
  },

  selectReport: (id) => {
    if (!id) {
      set({ activeReport: null })
      return
    }
    const report = get().reports.find((r) => r.id === id)
    set({ activeReport: report ?? null })
  },
}))
