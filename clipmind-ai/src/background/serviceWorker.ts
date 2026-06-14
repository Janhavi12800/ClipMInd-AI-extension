import { setupContextMenus, getContextMenuId } from './contextMenus';
import { createImageClip, createTextClip, createPageClip } from '../services/clipService';
import type { ExtensionMessage } from '../types/clip';
import { extractDomain } from '../utils/domain';
import { initAIProvider, testAIProvider } from '../services/ai/providerFactory';
import type { ProviderType } from '../services/ai/providerFactory';
import { getSettings } from '../services/settingsService';
import { syncFromCloud } from '../services/syncService';

async function initialize(): Promise<void> {
  setupContextMenus();
  await initAIProvider();
  const settings = await getSettings();
  if (settings.enableSync) {
    syncFromCloud().catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initialize();
});

chrome.runtime.onStartup.addListener(() => {
  initialize();
});

initialize();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.clipmind_settings) {
    initAIProvider();
    const newSettings = changes.clipmind_settings.newValue;
    if (newSettings?.enableSync) {
      syncFromCloud().catch(() => {});
    }
  }
  if (area === 'sync' && changes.clipmind_sync_meta) {
    syncFromCloud().catch(() => {});
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || tab.url.startsWith('chrome://')) return;

  switch (command) {
    case 'save-selection': {
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString().trim() || '',
        });
        const text = result as string;
        if (!text) {
          notifyTab(tab.id, { status: 'error', message: 'No text selected' });
          return;
        }
        const saveResult = await createTextClip({
          text,
          pageUrl: tab.url,
          pageTitle: tab.title || tab.url,
          summarize: true,
        });
        notifyTab(tab.id, saveResult);
      } catch {
        notifyTab(tab.id, { status: 'error', message: 'Failed to save selection' });
      }
      break;
    }
    case 'save-page': {
      const result = await createPageClip({
        pageUrl: tab.url,
        pageTitle: tab.title || tab.url,
        favicon: tab.favIconUrl,
      });
      notifyTab(tab.id, result);
      break;
    }
    case 'open-dashboard': {
      if (tab.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
          chrome.tabs.create({ url: chrome.runtime.getURL('src/sidepanel/index.html') });
        });
      }
      break;
    }
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== getContextMenuId() || !tab?.url) return;

  const imageUrl = info.srcUrl;
  if (!imageUrl) return;

  const result = await createImageClip({
    imageUrl,
    imageAlt: (info as chrome.contextMenus.OnClickData & { altText?: string }).altText,
    pageUrl: tab.url,
    pageTitle: tab.title || tab.url,
  });

  if (tab.id) notifyTab(tab.id, result);
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender.tab?.id).then(sendResponse);
  return true;
});

async function handleMessage(
  message: ExtensionMessage,
  tabId?: number
): Promise<Record<string, unknown>> {
  try {
    switch (message.type) {
      case 'SAVE_TEXT_CLIP':
      case 'SAVE_TEXT_CLIP_SUMMARIZE': {
        const payload = message.payload as {
          text: string;
          pageUrl: string;
          pageTitle: string;
          projectId?: string;
          force?: boolean;
        };
        const result = await createTextClip({
          text: payload.text,
          pageUrl: payload.pageUrl,
          pageTitle: payload.pageTitle,
          summarize: message.type === 'SAVE_TEXT_CLIP_SUMMARIZE',
          projectId: payload.projectId,
          force: payload.force,
        });
        if (tabId) notifyTab(tabId, result);
        return result;
      }

      case 'EXPLAIN_SELECTION': {
        const payload = message.payload as {
          text: string;
          pageUrl: string;
          pageTitle: string;
          force?: boolean;
        };
        const result = await createTextClip({
          text: payload.text,
          pageUrl: payload.pageUrl,
          pageTitle: payload.pageTitle,
          explain: true,
          force: payload.force,
        });
        if (tabId) notifyTab(tabId, result);
        return result;
      }

      case 'SAVE_TO_PROJECT': {
        const payload = message.payload as {
          text: string;
          pageUrl: string;
          pageTitle: string;
          projectId: string;
          force?: boolean;
        };
        const result = await createTextClip({
          text: payload.text,
          pageUrl: payload.pageUrl,
          pageTitle: payload.pageTitle,
          projectId: payload.projectId,
          force: payload.force,
        });
        if (tabId) notifyTab(tabId, result);
        return result;
      }

      case 'SAVE_IMAGE_CLIP': {
        const payload = message.payload as {
          imageUrl: string;
          imageAlt?: string;
          pageUrl: string;
          pageTitle: string;
          force?: boolean;
        };
        const result = await createImageClip(payload);
        if (tabId) notifyTab(tabId, result);
        return result;
      }

      case 'SAVE_PAGE_CLIP': {
        const payload = message.payload as {
          pageUrl: string;
          pageTitle: string;
          favicon?: string;
          userNote?: string;
          force?: boolean;
        };
        const result = await createPageClip(payload);
        return result;
      }

      case 'GET_SETTINGS': {
        return { settings: await getSettings() };
      }

      case 'TEST_AI_PROVIDER': {
        const payload = message.payload as { provider: ProviderType };
        return testAIProvider(payload.provider);
      }

      case 'SYNC_NOW': {
        const result = await syncFromCloud();
        return { status: 'ok', ...result };
      }

      default:
        return { status: 'error', message: 'Unknown message type' };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function notifyTab(
  tabId: number,
  result: { status: string; clip?: unknown; message?: string }
): void {
  const type =
    result.status === 'saved'
      ? 'CLIP_SAVED'
      : result.status === 'duplicate'
        ? 'CLIP_DUPLICATE'
        : 'CLIP_ERROR';

  chrome.tabs.sendMessage(tabId, {
    type,
    payload: result,
  }).catch(() => {});
}

export async function getActiveTabInfo(): Promise<{
  url: string;
  title: string;
  domain: string;
  favicon?: string;
} | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || tab.url.startsWith('chrome://')) return null;
    return {
      url: tab.url,
      title: tab.title || tab.url,
      domain: extractDomain(tab.url),
      favicon: tab.favIconUrl,
    };
  } catch {
    return null;
  }
}
