/**
 * TradePrompt AI — Background Service Worker
 */

import { LicenseManager, LICENSE_STATUS } from '../lib/license.js';
import { getApiBaseUrl } from '../lib/config.js';

const licenseManager = new LicenseManager();

chrome.runtime.onInstalled.addListener(async (details) => {
  await licenseManager.initialize();

  if (details.reason === 'install') {
    chrome.storage.local.set({
      tp_onboardingComplete: true,
      tp_market: 'india',
      tp_riskPercent: 1,
      tp_capital: 100000
    });
  }

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

chrome.alarms.create('licenseCheck', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'licenseCheck') {
    const status = await licenseManager.getStatus();
    if (status.status === LICENSE_STATUS.EXPIRED) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else if (status.status === LICENSE_STATUS.TRIAL) {
      chrome.action.setBadgeText({ text: String(status.daysRemaining) });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    sendResponse({ error: err.message });
  });
  return true;
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case 'GET_LICENSE_STATUS':
      return await licenseManager.getStatus();

    case 'CHECK_FEATURE_ACCESS':
      return await licenseManager.canUseFeature(message.feature);

    case 'INCREMENT_USAGE':
      await licenseManager.incrementUsage();
      return { success: true };

    case 'ACTIVATE_SUBSCRIPTION':
      await licenseManager.activateSubscription(message.data);
      return { success: true };

    case 'START_SUBSCRIPTION':
      return await licenseManager.startSubscription(message.email);

    case 'ACTIVATE_LICENSE_KEY':
      return await licenseManager.activateWithKey(message.licenseKey);

    case 'GET_CHECKOUT_URL':
      return { url: await licenseManager.getCheckoutUrl(message.email || '') };

    case 'GET_API_URL':
      return { apiBaseUrl: await getApiBaseUrl() };

    case 'OPEN_SIDE_PANEL':
      await chrome.sidePanel.open({ windowId: sender.tab?.windowId });
      return { success: true };

    case 'CAPTURE_CHART':
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab');
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 90 });
      return { screenshot: dataUrl };

    case 'GET_CHART_CONTEXT':
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab?.id) return null;
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => window.__tradePromptContext || null
      });
      return results[0]?.result || null;

    case 'GET_SETTINGS':
      return await chrome.storage.sync.get([
        'aiProvider', 'apiKey', 'tp_market', 'tp_riskPercent', 'tp_capital', 'tp_minRR', 'apiBaseUrl'
      ]);

    case 'SAVE_SETTINGS':
      await chrome.storage.sync.set(message.settings);
      if (message.settings.local) {
        await chrome.storage.local.set(message.settings.local);
      }
      return { success: true };

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === 'ACTIVATE_SUBSCRIPTION' && message.data?.licenseKey) {
    licenseManager.activateSubscription(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
