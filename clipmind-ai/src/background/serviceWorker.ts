import { setupContextMenus, getContextMenuId } from './contextMenus';
import { createImageClip, createTextClip, createPageClip } from '../services/clipService';
import type { ExtensionMessage } from '../types/clip';
import { extractDomain } from '../utils/domain';
import { initAIProvider } from '../services/ai/providerFactory';
import { getSettings } from '../services/settingsService';

async function initialize(): Promise<void> {
  setupContextMenus();
  await initAIProvider();
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
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {
  // sidePanel API may not be available in all contexts
});

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
  }).catch(() => {
    // Content script may not be loaded
  });
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
