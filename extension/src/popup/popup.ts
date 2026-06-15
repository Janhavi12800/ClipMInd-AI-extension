import { sendToBackground } from '../lib/messaging'
import { applyTheme, scoreColor } from '../ui/helpers'

interface AnalysisResult {
  security?: { score: number; riskLevel: string }
  seo?: { score: number }
  phishing?: { riskScore: number; action: string; signals: Array<{ detail: string }> }
  tab?: { url: string; title: string }
}

async function init(): Promise<void> {
  await applyTheme()

  document.getElementById('btn-theme')?.addEventListener('click', async () => {
    const isDark = document.documentElement.classList.toggle('dark')
    await sendToBackground('SET_SETTINGS', { theme: isDark ? 'dark' : 'light' })
  })

  document.getElementById('btn-sidepanel')?.addEventListener('click', () => {
    sendToBackground('OPEN_SIDE_PANEL').then(() => window.close())
  })

  document.getElementById('btn-options')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  document.querySelectorAll('.quick-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await sendToBackground('OPEN_SIDE_PANEL')
      window.close()
    })
  })

  try {
    const tab = await sendToBackground<undefined, { url: string; title: string; domain: string }>('GET_TAB_INFO')
    document.getElementById('current-url')!.textContent = tab.domain
    document.getElementById('current-title')!.textContent = tab.title

    const analysis = await sendToBackground<undefined, AnalysisResult>('ANALYZE_PAGE')
    renderScores(analysis)

    if (analysis.phishing?.action === 'warn' || analysis.phishing?.action === 'block') {
      const banner = document.getElementById('alert-banner')!
      banner.hidden = false
      banner.textContent = `⚠️ Phishing risk detected: ${analysis.phishing.signals.map((s) => s.detail).join('. ')}`
    }
  } catch (err) {
    document.getElementById('current-url')!.textContent = 'Unable to analyze this page'
    console.error(err)
  }
}

function renderScores(data: AnalysisResult): void {
  if (data.security) {
    const el = document.getElementById('sec-score-val')!
    el.textContent = String(data.security.score)
    el.style.color = scoreColor(data.security.score)
  }
  if (data.seo) {
    const el = document.getElementById('seo-score-val')!
    el.textContent = String(data.seo.score)
    el.style.color = scoreColor(data.seo.score)
  }
  if (data.phishing) {
    const el = document.getElementById('phish-score-val')!
    const display = 100 - data.phishing.riskScore
    el.textContent = String(display)
    el.style.color = scoreColor(display)
  }
}

init()
