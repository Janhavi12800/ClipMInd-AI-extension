/**
 * TradePrompt AI — Environment Configuration
 */

import { DEPLOY_API_URL } from './deploy-config.js';

const DEFAULT_CONFIG = {
  development: {
    apiBaseUrl: 'http://localhost:3001',
    appName: 'TradePrompt AI'
  },
  production: {
    apiBaseUrl: 'https://api.tradeprompt.ai',
    appName: 'TradePrompt AI'
  }
};

export function getConfig() {
  if (DEPLOY_API_URL) {
    return { apiBaseUrl: DEPLOY_API_URL.replace(/\/$/, ''), appName: 'TradePrompt AI' };
  }
  const isDev = !('update_url' in chrome.runtime.getManifest());
  return isDev ? DEFAULT_CONFIG.development : DEFAULT_CONFIG.production;
}

export async function getApiBaseUrl() {
  try {
    const stored = await chrome.storage.sync.get(['apiBaseUrl']);
    if (stored.apiBaseUrl) return stored.apiBaseUrl.replace(/\/$/, '');
  } catch { /* not in extension context */ }
  return getConfig().apiBaseUrl;
}
