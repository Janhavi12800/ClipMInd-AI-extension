import { createMessageHandler } from '../lib/messaging'
import { createLogger } from '../lib/logger'
import { extractPageData, showPhishingWarning, showMalwareWarning } from './page-extractor'
import { analyzeDomSecurity } from '../modules/security/scanner'
import { detectPhishing } from '../modules/security/phishing'
import { detectMalware } from '../modules/security/malware'
import { analyzeSeo } from '../modules/seo/analyzer'
import { detectTechnologies } from '../modules/tech/detector'
import type { ExtensionMessage } from '../lib/types'

const log = createLogger('ContentScript')

const handler = createMessageHandler({
  PING: async () => ({ status: 'ok', url: window.location.href }),

  GET_TAB_INFO: async () => ({
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    favicon: document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href,
  }),

  ANALYZE_PAGE: async () => {
    const extract = extractPageData()
    const security = analyzeDomSecurity({
      url: extract.url,
      isHttps: extract.isHttps,
      hasPasswordField: extract.hasPasswordField,
      hasLoginForm: extract.hasLoginForm,
      externalScripts: extract.externalScripts,
      mixedContent: extract.mixedContent,
      insecureForms: extract.insecureForms,
      cookies: document.cookie ? 'present' : 'none',
      metaCsp: extract.metaCsp,
      iframeCount: extract.iframeCount,
      externalLinkCount: extract.externalLinkCount,
    })
    const seo = analyzeSeo(extract.seo)
    const tech = detectTechnologies({
      html: extract.html,
      scripts: extract.externalScripts,
      metaTags: extract.metaTagsHtml,
      responseHeaders: '',
    })
    const phishing = detectPhishing({
      url: extract.url,
      title: extract.title,
      hasPasswordField: extract.hasPasswordField,
      hasLoginForm: extract.hasLoginForm,
      linkCount: extract.allLinks.length,
      sensitivity: 'medium',
    })
    const malware = detectMalware({
      url: extract.url,
      scripts: extract.externalScripts,
      links: extract.allLinks,
      iframes: extract.iframeSrcs,
    })

    return { security, seo, tech, phishing, malware, tab: { url: extract.url, title: extract.title, domain: extract.domain } }
  },

  RUN_SECURITY_SCAN: async () => {
    const extract = extractPageData()
    return analyzeDomSecurity({
      url: extract.url,
      isHttps: extract.isHttps,
      hasPasswordField: extract.hasPasswordField,
      hasLoginForm: extract.hasLoginForm,
      externalScripts: extract.externalScripts,
      mixedContent: extract.mixedContent,
      insecureForms: extract.insecureForms,
      cookies: document.cookie ? 'present' : 'none',
      metaCsp: extract.metaCsp,
      iframeCount: extract.iframeCount,
      externalLinkCount: extract.externalLinkCount,
    })
  },

  RUN_SEO_ANALYSIS: async () => {
    const extract = extractPageData()
    return analyzeSeo(extract.seo)
  },

  RUN_TECH_DETECTION: async () => {
    const extract = extractPageData()
    return detectTechnologies({
      html: extract.html,
      scripts: extract.externalScripts,
      metaTags: extract.metaTagsHtml,
      responseHeaders: '',
    })
  },

  CHECK_PHISHING: async (payload) => {
    const extract = extractPageData()
    const sensitivity = (payload as { sensitivity?: string })?.sensitivity ?? 'medium'
    const result = detectPhishing({
      url: extract.url,
      title: extract.title,
      hasPasswordField: extract.hasPasswordField,
      hasLoginForm: extract.hasLoginForm,
      linkCount: extract.allLinks.length,
      sensitivity: sensitivity as 'low' | 'medium' | 'high',
    })
    if (result.action === 'warn' || result.action === 'block') {
      showPhishingWarning(result.signals)
    }
    return result
  },

  CHECK_MALWARE: async () => {
    const extract = extractPageData()
    const result = detectMalware({
      url: extract.url,
      scripts: extract.externalScripts,
      links: extract.allLinks,
      iframes: extract.iframeSrcs,
    })
    if (result.isThreat) {
      showMalwareWarning(result.signals.map((s) => s.detail).join('. '))
    }
    return result
  },
})

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => handler(message, _sender, sendResponse),
)

log.info('Content script loaded', window.location.href)

export {}
