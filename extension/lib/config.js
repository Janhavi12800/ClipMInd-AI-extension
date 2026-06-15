/**
 * TradePrompt AI — Environment Configuration
 */

const CONFIG = {
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
  const isDev = !('update_url' in chrome.runtime.getManifest());
  return isDev ? CONFIG.development : CONFIG.production;
}

export function getApiBaseUrl() {
  return getConfig().apiBaseUrl;
}
