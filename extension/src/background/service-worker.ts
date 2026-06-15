import { createMessageHandler } from '../lib/messaging'
import { createLogger } from '../lib/logger'
import { storage } from '../lib/storage'
import { BADGE_COLORS } from '../lib/constants'
import { validateMessageOrigin, sanitizeUrl } from '../lib/security'
import { sendToTab } from '../lib/messaging'
import { fetchSecurityHeaders, mergeScanResults } from '../modules/security/scanner'
import { generatePrompt, enhancePrompt, getLibrary, saveToLibrary, deleteFromLibrary, toggleFavorite, getTemplates } from '../modules/ai/prompts'
import { getNotes, saveNote, deleteNote, togglePin, searchNotes } from '../modules/notes/manager'
import { getProductivity, saveSnippet, deleteSnippet, addTask, toggleTask, startPomodoro, stopPomodoro } from '../modules/productivity/toolkit'
import type { ExtensionMessage } from '../lib/types'

const log = createLogger('ServiceWorker')

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab')
  return tab
}

function updateBadge(score: number | null, risk?: string): void {
  if (score === null) {
    chrome.action.setBadgeText({ text: '' })
    return
  }
  chrome.action.setBadgeText({ text: String(score) })
  const color = score >= 80 ? BADGE_COLORS.safe : score >= 60 ? BADGE_COLORS.warning : BADGE_COLORS.danger
  chrome.action.setBadgeBackgroundColor({ color })
}

async function analyzeActiveTab(): Promise<void> {
  try {
    const tab = await getActiveTab()
    if (!tab.id || !tab.url?.startsWith('http')) return

    const settings = await storage.getSettings()
    if (!settings.autoScan) return

    const analysis = await sendToTab(tab.id, 'ANALYZE_PAGE')
    const data = analysis as { security?: { score: number }; phishing?: { riskScore: number; action: string } }

    if (data.security) updateBadge(data.security.score)
    if (data.phishing?.action === 'block' && settings.securityAlerts) {
      chrome.notifications.create(`phishing_${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'TechShield AI — Phishing Detected',
        message: `Suspicious page detected: ${tab.url}`,
        priority: 2,
      })
    }

    await storage.setScanCache(tab.url, analysis)
  } catch (err) {
    log.debug('Auto-scan skipped', String(err))
  }
}

const messageHandler = createMessageHandler({
  PING: async () => ({ status: 'ok', version: '1.0.0' }),

  GET_TAB_INFO: async () => {
    const tab = await getActiveTab()
    return { url: tab.url, title: tab.title, domain: new URL(tab.url!).hostname }
  },

  ANALYZE_PAGE: async () => {
    const tab = await getActiveTab()
    if (!tab.id) throw new Error('No tab')
    const domAnalysis = await sendToTab(tab.id, 'ANALYZE_PAGE')

    if (tab.url) {
      const headerFindings = await fetchSecurityHeaders(tab.url)
      const data = domAnalysis as { security: ReturnType<typeof mergeScanResults> extends infer R ? R : never }
      if (data.security) {
        data.security = mergeScanResults(data.security, headerFindings)
      }
      await storage.setScanCache(tab.url, domAnalysis)
    }

    return domAnalysis
  },

  RUN_SECURITY_SCAN: async () => {
    const tab = await getActiveTab()
    if (!tab.id || !tab.url) throw new Error('No tab')
    const domResult = await sendToTab(tab.id, 'RUN_SECURITY_SCAN')
    const headerFindings = await fetchSecurityHeaders(tab.url)
    return mergeScanResults(domResult as Parameters<typeof mergeScanResults>[0], headerFindings)
  },

  RUN_SEO_ANALYSIS: async (_payload, sender) => {
    const tabId = sender.tab?.id ?? (await getActiveTab()).id
    if (!tabId) throw new Error('No tab')
    return sendToTab(tabId, 'RUN_SEO_ANALYSIS')
  },

  RUN_TECH_DETECTION: async (_payload, sender) => {
    const tabId = sender.tab?.id ?? (await getActiveTab()).id
    if (!tabId) throw new Error('No tab')
    return sendToTab(tabId, 'RUN_TECH_DETECTION')
  },

  CHECK_PHISHING: async (payload) => {
    const tab = await getActiveTab()
    if (!tab.id) throw new Error('No tab')
    const settings = await storage.getSettings()
    return sendToTab(tab.id, 'CHECK_PHISHING', { sensitivity: settings.phishingSensitivity, ...payload as object })
  },

  CHECK_MALWARE: async () => {
    const tab = await getActiveTab()
    if (!tab.id) throw new Error('No tab')
    return sendToTab(tab.id, 'CHECK_MALWARE')
  },

  GENERATE_PROMPT: async (payload) => {
    const data = payload as { templateId: string; variables: Record<string, string> }
    const settings = await storage.getSettings()
    const templates = getTemplates()
    const template = templates.find((t) => t.id === data.templateId)
    if (!template) throw new Error('Template not found')
    return generatePrompt(template, data.variables, settings.piiRedaction)
  },

  ENHANCE_PROMPT: async (payload) => {
    const data = payload as { input: string; tone?: string; audience?: string; length?: string }
    const settings = await storage.getSettings()
    return enhancePrompt(data.input, data, settings.piiRedaction)
  },

  GET_PROMPT_LIBRARY: async () => getLibrary(),

  SAVE_PROMPT: async (payload) => {
    const data = payload as { title: string; content: string; category: string; isFavorite?: boolean }
    return saveToLibrary({ ...data, isFavorite: data.isFavorite ?? false })
  },

  DELETE_PROMPT: async (payload) => {
    await deleteFromLibrary((payload as { id: string }).id)
    return { deleted: true }
  },

  GET_NOTES: async (payload) => getNotes((payload as { url?: string })?.url),

  SAVE_NOTE: async (payload) => saveNote(payload as Parameters<typeof saveNote>[0]),

  DELETE_NOTE: async (payload) => {
    await deleteNote((payload as { id: string }).id)
    return { deleted: true }
  },

  GET_SETTINGS: async () => storage.getSettings(),

  SET_SETTINGS: async (payload) => storage.setSettings(payload as Record<string, unknown>),

  GET_PRODUCTIVITY: async () => getProductivity(),

  SET_PRODUCTIVITY: async (payload) => {
    const action = payload as { action: string; data?: Record<string, unknown> }
    switch (action.action) {
      case 'save_snippet': return saveSnippet(action.data!.trigger as string, action.data!.content as string)
      case 'delete_snippet': return deleteSnippet(action.data!.id as string)
      case 'add_task': return addTask(action.data!.text as string, action.data!.dueDate as string)
      case 'toggle_task': return toggleTask(action.data!.id as string)
      case 'start_pomodoro': return startPomodoro(action.data?.minutes as number)
      case 'stop_pomodoro': return stopPomodoro()
      default: throw new Error(`Unknown productivity action: ${action.action}`)
    }
  },

  OPEN_SIDE_PANEL: async (_payload, sender) => {
    if (sender.tab?.windowId) {
      await chrome.sidePanel.open({ windowId: sender.tab.windowId })
    }
    return { opened: true }
  },
})

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (!validateMessageOrigin(sender)) {
    sendResponse({ success: false, error: 'Invalid sender' })
    return false
  }
  return messageHandler(message, sender, sendResponse)
})

chrome.runtime.onInstalled.addListener(async (details) => {
  log.info('Extension installed', details.reason)
  await storage.setSettings({})
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
})

chrome.tabs.onActivated.addListener(() => analyzeActiveTab())
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && sanitizeUrl(tab.url)) {
    analyzeActiveTab()
  }
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pomodoro_end') {
    chrome.notifications.create('pomodoro_done', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'TechShield AI — Focus Timer',
      message: 'Pomodoro session complete! Time for a break.',
    })
    await stopPomodoro()
  }
})

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId })
  }
})

log.info('Service worker started')

export {}
