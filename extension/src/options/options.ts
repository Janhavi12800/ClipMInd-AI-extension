import { sendToBackground } from '../lib/messaging'
import { applyTheme } from '../ui/helpers'
import { DEFAULT_SETTINGS } from '../lib/constants'

interface Settings {
  theme: string
  autoScan: boolean
  phishingSensitivity: string
  piiRedaction: boolean
  securityAlerts: boolean
  apiBaseUrl: string
  syncEnabled: boolean
}

async function loadSettings(): Promise<void> {
  await applyTheme()
  const settings = await sendToBackground<undefined, Settings>('GET_SETTINGS')

  ;(document.getElementById('theme') as HTMLSelectElement).value = settings.theme
  ;(document.getElementById('phishing-sensitivity') as HTMLSelectElement).value = settings.phishingSensitivity
  ;(document.getElementById('auto-scan') as HTMLInputElement).checked = settings.autoScan
  ;(document.getElementById('security-alerts') as HTMLInputElement).checked = settings.securityAlerts
  ;(document.getElementById('pii-redaction') as HTMLInputElement).checked = settings.piiRedaction
  ;(document.getElementById('api-url') as HTMLInputElement).value = settings.apiBaseUrl
  ;(document.getElementById('sync-enabled') as HTMLInputElement).checked = settings.syncEnabled
}

async function saveSettings(): Promise<void> {
  const token = (document.getElementById('auth-token') as HTMLInputElement).value.trim()

  const settings: Partial<Settings> = {
    theme: (document.getElementById('theme') as HTMLSelectElement).value,
    phishingSensitivity: (document.getElementById('phishing-sensitivity') as HTMLSelectElement).value,
    autoScan: (document.getElementById('auto-scan') as HTMLInputElement).checked,
    securityAlerts: (document.getElementById('security-alerts') as HTMLInputElement).checked,
    piiRedaction: (document.getElementById('pii-redaction') as HTMLInputElement).checked,
    apiBaseUrl: (document.getElementById('api-url') as HTMLInputElement).value,
    syncEnabled: (document.getElementById('sync-enabled') as HTMLInputElement).checked,
  }

  await sendToBackground('SET_SETTINGS', settings)

  if (token) {
    await sendToBackground('SET_AUTH_TOKEN', { token })
  }

  await applyTheme()

  const status = document.getElementById('save-status')!
  status.textContent = '✓ Saved'
  setTimeout(() => { status.textContent = '' }, 2000)
}

document.getElementById('btn-save')!.addEventListener('click', saveSettings)

document.getElementById('btn-reset')!.addEventListener('click', async () => {
  await sendToBackground('SET_SETTINGS', DEFAULT_SETTINGS)
  await sendToBackground('SET_AUTH_TOKEN', { token: null })
  await loadSettings()
  document.getElementById('save-status')!.textContent = '✓ Reset to defaults'
})

document.getElementById('btn-verify')!.addEventListener('click', async () => {
  const token = (document.getElementById('auth-token') as HTMLInputElement).value.trim()
  const status = document.getElementById('sync-status')!
  if (!token) {
    status.textContent = 'Enter a token first'
    return
  }
  const result = await sendToBackground<{ token: string }, { valid: boolean }>('SET_AUTH_TOKEN', { token })
  status.textContent = result.valid ? '✓ Token valid' : '✗ Invalid token'
})

document.getElementById('btn-sync')!.addEventListener('click', async () => {
  const status = document.getElementById('sync-status')!
  status.textContent = 'Syncing...'
  const result = await sendToBackground<undefined, { synced: boolean; notes: number }>('SYNC_CLOUD')
  status.textContent = `✓ Synced ${result.notes} notes`
})

loadSettings()
