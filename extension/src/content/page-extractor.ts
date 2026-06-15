/**
 * Extracts page data from DOM for security, SEO, and tech analysis.
 */

export interface DomSeoData {
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

export interface PageExtract {
  url: string
  title: string
  domain: string
  isHttps: boolean
  hasPasswordField: boolean
  hasLoginForm: boolean
  externalScripts: string[]
  mixedContent: string[]
  insecureForms: number
  metaCsp: string
  iframeCount: number
  iframeSrcs: string[]
  externalLinkCount: number
  allLinks: string[]
  seo: DomSeoData
  html: string
  metaTagsHtml: string
}

export function extractPageData(): PageExtract {
  const url = window.location.href
  const domain = window.location.hostname
  const isHttps = window.location.protocol === 'https:'

  const passwordFields = document.querySelectorAll('input[type="password"]')
  const loginForms = document.querySelectorAll('form[action*="login"], form[action*="signin"], form#login')

  const scripts = Array.from(document.querySelectorAll('script[src]'))
    .map((s) => (s as HTMLScriptElement).src)
    .filter(Boolean)

  const mixedContent: string[] = []
  if (isHttps) {
    document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]').forEach((el) => {
      const src = (el as HTMLImageElement).src || (el as HTMLScriptElement).src || (el as HTMLLinkElement).href
      if (src) mixedContent.push(src)
    })
  }

  let insecureForms = 0
  document.querySelectorAll('form[action]').forEach((form) => {
    const action = (form as HTMLFormElement).action
    if (action.startsWith('http://')) insecureForms++
  })

  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
  const iframes = Array.from(document.querySelectorAll('iframe[src]'))
  const iframeSrcs = iframes.map((f) => (f as HTMLIFrameElement).src).filter(Boolean)

  const links = Array.from(document.querySelectorAll('a[href]'))
    .map((a) => (a as HTMLAnchorElement).href)
    .filter((h) => h.startsWith('http'))

  const externalLinks = links.filter((h) => {
    try { return new URL(h).hostname !== domain } catch { return false }
  })

  const getMeta = (name: string) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ??
    document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ?? ''

  const getHeadings = (tag: string) =>
    Array.from(document.querySelectorAll(tag)).map((el) => el.textContent?.trim() ?? '').filter(Boolean)

  const bodyText = document.body?.innerText ?? ''
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length

  const images = Array.from(document.querySelectorAll('img')).map((img) => ({
    src: img.src,
    alt: img.alt ?? '',
  }))

  const internalLinks = links.filter((h) => {
    try { return new URL(h).hostname === domain } catch { return false }
  }).length

  const metaTags = Array.from(document.querySelectorAll('meta'))
    .map((m) => m.outerHTML)
    .join('\n')

  return {
    url,
    title: document.title,
    domain,
    isHttps,
    hasPasswordField: passwordFields.length > 0,
    hasLoginForm: loginForms.length > 0,
    externalScripts: scripts.filter((s) => { try { return new URL(s).hostname !== domain } catch { return true } }),
    mixedContent,
    insecureForms,
    metaCsp: cspMeta?.getAttribute('content') ?? '',
    iframeCount: iframes.length,
    iframeSrcs,
    externalLinkCount: externalLinks.length,
    allLinks: links,
    seo: {
      title: document.title,
      metaDescription: getMeta('description'),
      metaKeywords: getMeta('keywords'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
      ogTitle: getMeta('og:title'),
      ogDescription: getMeta('og:description'),
      robots: getMeta('robots'),
      h1: getHeadings('h1'),
      h2: getHeadings('h2'),
      h3: getHeadings('h3'),
      h4: getHeadings('h4'),
      h5: getHeadings('h5'),
      h6: getHeadings('h6'),
      images,
      internalLinks,
      externalLinks: externalLinks.length,
      wordCount,
    },
    html: document.documentElement.outerHTML.slice(0, 500000),
    metaTagsHtml: metaTags,
  }
}

export function showPhishingWarning(signals: Array<{ type: string; detail: string }>): void {
  const existing = document.getElementById('techshield-phishing-warning')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'techshield-phishing-warning'
  overlay.setAttribute('role', 'alert')
  overlay.innerHTML = `
    <div style="position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#7f1d1d;color:#fff;padding:16px 24px;font-family:system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:16px;">
      <div style="font-size:24px;">⚠️</div>
      <div style="flex:1;">
        <strong style="font-size:16px;">TechShield AI — Phishing Warning</strong>
        <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">This page may be a phishing attempt. ${signals.map((s) => s.detail).join('. ')}</p>
      </div>
      <button id="techshield-dismiss-warning" style="background:#fff;color:#7f1d1d;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Dismiss</button>
    </div>
  `
  document.body.appendChild(overlay)
  document.getElementById('techshield-dismiss-warning')?.addEventListener('click', () => overlay.remove())
}

export function showMalwareWarning(detail: string): void {
  const existing = document.getElementById('techshield-malware-warning')
  if (existing) existing.remove()

  const banner = document.createElement('div')
  banner.id = 'techshield-malware-warning'
  banner.setAttribute('role', 'alert')
  banner.innerHTML = `
    <div style="position:fixed;bottom:0;left:0;right:0;z-index:2147483646;background:#92400e;color:#fff;padding:12px 24px;font-family:system-ui,sans-serif;display:flex;align-items:center;gap:12px;">
      <strong>🛡️ Malware Warning:</strong>
      <span style="flex:1;font-size:13px;">${detail}</span>
      <button id="techshield-dismiss-malware" style="background:transparent;color:#fff;border:1px solid #fff;padding:4px 12px;border-radius:4px;cursor:pointer;">Dismiss</button>
    </div>
  `
  document.body.appendChild(banner)
  document.getElementById('techshield-dismiss-malware')?.addEventListener('click', () => banner.remove())
}
