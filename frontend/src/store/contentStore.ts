import { create } from 'zustand'
import { contentGenerations, contentTypes, toneOptions } from '@/data/mockData'
import { generateId } from '@/lib/utils'
import type { ContentGeneration } from '@/types'

interface ContentState {
  generations: ContentGeneration[]
  activeGeneration: ContentGeneration | null
  isGenerating: boolean
  formData: {
    type: ContentGeneration['type']
    topic: string
    tone: string
    audience: string
    keywords: string
    wordCount: number
  }
  contentTypes: typeof contentTypes
  toneOptions: typeof toneOptions

  setFormField: <K extends keyof ContentState['formData']>(
    key: K,
    value: ContentState['formData'][K],
  ) => void
  generateContent: () => void
  selectGeneration: (id: string | null) => void
  updateContent: (content: string) => void
  deleteGeneration: (id: string) => void
  setStatus: (id: string, status: ContentGeneration['status']) => void
}

const sampleContent: Record<ContentGeneration['type'], string> = {
  blog: `# ${'{topic}'}

In today's rapidly evolving digital landscape, organizations face unprecedented challenges in ${'{topic}'}. This comprehensive guide explores proven strategies that leading companies are implementing to stay ahead.

## Understanding the Fundamentals

The foundation of effective ${'{topic}'} begins with a clear understanding of your audience: ${'{audience}'}. By aligning your approach with their specific needs and pain points, you can create content that resonates and drives meaningful engagement.

## Key Strategies for Success

1. **Data-Driven Decision Making** — Leverage analytics to identify what works and optimize continuously.
2. **Cross-Functional Collaboration** — Break down silos between teams to ensure consistent messaging.
3. **Automation & AI Integration** — Use intelligent tools to scale efforts without sacrificing quality.

## Implementation Roadmap

Start with a pilot program targeting your highest-impact areas. Measure results against clear KPIs, iterate based on feedback, and expand successful initiatives across the organization.

## Conclusion

${'{topic}'} is not a one-time project but an ongoing commitment to excellence. With the right strategy, tools, and team alignment, your organization can achieve sustainable growth and competitive advantage.`,

  email: `Subject: Discover How ${'{topic}'} Can Transform Your Workflow

Hi there,

We know that ${'{audience}'} are constantly looking for ways to work smarter. That's why we've developed a solution specifically designed to address your biggest challenges in ${'{topic}'}.

Here's what you can expect:
• 40% reduction in manual tasks
• Real-time insights and analytics
• Seamless integration with your existing tools

Ready to see it in action? Click below to schedule a personalized demo.

Best regards,
The TechShield AI Team`,

  social: `🚀 ${'{topic}'} is changing how ${'{audience}'} work.

3 things we learned this quarter:
→ Automation saves 12+ hours/week
→ Security + productivity belong together
→ AI works best with human oversight

What's your biggest challenge with ${'{topic}'}? Drop a comment below 👇

#TechShield #AI #Productivity #Security`,

  product: `## ${'{topic}'}

Built for ${'{audience}'} who demand excellence.

**Key Features:**
• Enterprise-grade security with zero-trust architecture
• AI-powered insights that adapt to your workflow
• Seamless browser integration — no context switching
• SOC 2 compliant with SSO and audit logging

**Why ${'{topic}'}?**
Unlike traditional solutions, we combine security scanning, AI content generation, and productivity tools in a single platform. Save time, reduce risk, and ship better content — all from your browser.

**Get Started Today**
Join 250,000+ professionals who trust TechShield AI.`,

  ad: `Headline: ${'{topic}'} — Built for ${'{audience}'}

Description: Stop juggling 10 different tools. TechShield AI combines security scanning, AI writing, and SEO analysis in one Chrome extension. Try free today.

CTA: Start Free Trial →`,
}

export const useContentStore = create<ContentState>((set, get) => ({
  generations: contentGenerations,
  activeGeneration: null,
  isGenerating: false,
  formData: {
    type: 'blog',
    topic: '',
    tone: 'Professional',
    audience: 'IT professionals and security teams',
    keywords: '',
    wordCount: 1000,
  },
  contentTypes,
  toneOptions,

  setFormField: (key, value) =>
    set((state) => ({
      formData: { ...state.formData, [key]: value },
    })),

  generateContent: () => {
    const { formData } = get()
    if (!formData.topic.trim()) return

    set({ isGenerating: true, activeGeneration: null })

    const template = sampleContent[formData.type]
    let content = template
      .replace(/\{topic\}/g, formData.topic)
      .replace(/\{audience\}/g, formData.audience)

    const title =
      formData.type === 'blog'
        ? formData.topic
        : formData.type === 'email'
          ? `Email: ${formData.topic}`
          : formData.type === 'social'
            ? `Social: ${formData.topic}`
            : formData.type === 'product'
              ? `Product: ${formData.topic}`
              : `Ad: ${formData.topic}`

    let index = 0
    const interval = setInterval(() => {
      index += 8
      if (index >= content.length) {
        const generation: ContentGeneration = {
          id: generateId(),
          title,
          type: formData.type,
          content,
          tone: formData.tone,
          wordCount: content.split(/\s+/).length,
          createdAt: new Date().toISOString(),
          status: 'completed',
        }
        set((state) => ({
          generations: [generation, ...state.generations],
          activeGeneration: generation,
          isGenerating: false,
        }))
        clearInterval(interval)
      } else {
        const partial: ContentGeneration = {
          id: 'generating',
          title,
          type: formData.type,
          content: content.slice(0, index),
          tone: formData.tone,
          wordCount: 0,
          createdAt: new Date().toISOString(),
          status: 'draft',
        }
        set({ activeGeneration: partial })
      }
    }, 30)
  },

  selectGeneration: (id) => {
    if (!id) {
      set({ activeGeneration: null })
      return
    }
    const gen = get().generations.find((g) => g.id === id)
    set({ activeGeneration: gen ?? null })
  },

  updateContent: (content) =>
    set((state) => {
      if (!state.activeGeneration) return state
      const updated = {
        ...state.activeGeneration,
        content,
        wordCount: content.split(/\s+/).length,
      }
      return {
        activeGeneration: updated,
        generations: state.generations.map((g) =>
          g.id === updated.id ? updated : g,
        ),
      }
    }),

  deleteGeneration: (id) =>
    set((state) => ({
      generations: state.generations.filter((g) => g.id !== id),
      activeGeneration:
        state.activeGeneration?.id === id ? null : state.activeGeneration,
    })),

  setStatus: (id, status) =>
    set((state) => ({
      generations: state.generations.map((g) =>
        g.id === id ? { ...g, status } : g,
      ),
    })),
}))
