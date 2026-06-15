import type { SeoResult, SeoIssue, MetaTagAnalysis, HeadingAnalysis } from '../../lib/types'

interface DomSeoData {
  title: string
  metaDescription: string
  metaKeywords: string
  canonical: string
  ogTitle: string
  ogDescription: string
  robots: string
  h1: string[]
  h2: string[]
  h3: string[]
  h4: string[]
  h5: string[]
  h6: string[]
  images: Array<{ src: string; alt: string }>
  internalLinks: number
  externalLinks: number
  wordCount: number
}

export function analyzeMetaTags(data: DomSeoData): MetaTagAnalysis {
  const issues: SeoIssue[] = []

  const titleLength = data.title.length
  if (!data.title) {
    issues.push({ type: 'error', category: 'Meta', title: 'Missing Title Tag', description: 'Page has no title element.', impact: 'high' })
  } else if (titleLength < 30) {
    issues.push({ type: 'warning', category: 'Meta', title: 'Title Too Short', description: `Title is ${titleLength} chars. Recommended: 50-60.`, impact: 'medium' })
  } else if (titleLength > 60) {
    issues.push({ type: 'warning', category: 'Meta', title: 'Title Too Long', description: `Title is ${titleLength} chars. May be truncated in SERPs.`, impact: 'medium' })
  }

  const descLength = data.metaDescription.length
  if (!data.metaDescription) {
    issues.push({ type: 'error', category: 'Meta', title: 'Missing Meta Description', description: 'No meta description found.', impact: 'high' })
  } else if (descLength < 120) {
    issues.push({ type: 'warning', category: 'Meta', title: 'Meta Description Too Short', description: `Description is ${descLength} chars. Recommended: 150-155.`, impact: 'medium' })
  } else if (descLength > 160) {
    issues.push({ type: 'warning', category: 'Meta', title: 'Meta Description Too Long', description: `Description is ${descLength} chars. May be truncated.`, impact: 'low' })
  }

  if (!data.canonical) {
    issues.push({ type: 'info', category: 'Meta', title: 'No Canonical URL', description: 'Canonical link tag not found.', impact: 'low' })
  }

  if (!data.ogTitle) {
    issues.push({ type: 'info', category: 'Meta', title: 'Missing OG Title', description: 'Open Graph title not set for social sharing.', impact: 'low' })
  }

  if (data.robots.includes('noindex')) {
    issues.push({ type: 'warning', category: 'Meta', title: 'Page Set to Noindex', description: 'Robots meta tag blocks search engine indexing.', impact: 'high' })
  }

  return {
    title: data.title,
    titleLength,
    description: data.metaDescription,
    descriptionLength: descLength,
    canonical: data.canonical,
    ogTitle: data.ogTitle,
    ogDescription: data.ogDescription,
    robots: data.robots,
    issues,
  }
}

export function analyzeHeadings(data: DomSeoData): HeadingAnalysis {
  const issues: SeoIssue[] = []

  if (data.h1.length === 0) {
    issues.push({ type: 'error', category: 'Headings', title: 'Missing H1', description: 'Page has no H1 heading.', impact: 'high' })
  } else if (data.h1.length > 1) {
    issues.push({ type: 'warning', category: 'Headings', title: 'Multiple H1 Tags', description: `${data.h1.length} H1 elements found. Use one per page.`, impact: 'medium' })
  }

  if (data.h2.length === 0 && data.wordCount > 300) {
    issues.push({ type: 'warning', category: 'Headings', title: 'No H2 Headings', description: 'Long content without H2 subheadings.', impact: 'medium' })
  }

  const levels = [data.h1, data.h2, data.h3, data.h4, data.h5, data.h6]
  let prevLevel = 0
  for (let i = 0; i < levels.length; i++) {
    if (levels[i].length > 0) {
      if (prevLevel > 0 && i - prevLevel > 1) {
        issues.push({ type: 'info', category: 'Headings', title: 'Skipped Heading Level', description: `Heading hierarchy skips from H${prevLevel + 1} to H${i + 1}.`, impact: 'low' })
      }
      prevLevel = i
    }
  }

  return { h1: data.h1, h2: data.h2, h3: data.h3, h4: data.h4, h5: data.h5, h6: data.h6, issues }
}

export function analyzeSeo(data: DomSeoData): SeoResult {
  const meta = analyzeMetaTags(data)
  const headings = analyzeHeadings(data)
  const issues: SeoIssue[] = [...meta.issues, ...headings.issues]

  const missingAlt = data.images.filter((img) => !img.alt?.trim()).length
  if (missingAlt > 0) {
    issues.push({
      type: 'error', category: 'Images', title: 'Images Missing Alt Text',
      description: `${missingAlt} of ${data.images.length} images lack alt attributes.`, impact: 'high',
    })
  }

  if (data.wordCount < 300) {
    issues.push({ type: 'warning', category: 'Content', title: 'Thin Content', description: `Only ${data.wordCount} words on page.`, impact: 'medium' })
  }

  const highIssues = issues.filter((i) => i.impact === 'high').length
  const medIssues = issues.filter((i) => i.impact === 'medium').length
  const score = Math.max(0, 100 - highIssues * 15 - medIssues * 8 - issues.filter((i) => i.impact === 'low').length * 3)

  return {
    score,
    issues,
    meta,
    headings,
    metrics: {
      titleLength: meta.titleLength,
      metaDescriptionLength: meta.descriptionLength,
      h1Count: data.h1.length,
      imageAltMissing: missingAlt,
      internalLinks: data.internalLinks,
      externalLinks: data.externalLinks,
      wordCount: data.wordCount,
    },
    scannedAt: new Date().toISOString(),
  }
}
