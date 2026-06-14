import type { AppSettings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_KEY = 'clipmind_settings';

export async function getSettings(): Promise<AppSettings> {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const merged = { ...current, ...updates };
  await chrome.storage.local.set({ [SETTINGS_KEY]: merged });
  return merged;
}

export function onSettingsChange(callback: (settings: AppSettings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'local' && changes[SETTINGS_KEY]) {
      callback({ ...DEFAULT_SETTINGS, ...changes[SETTINGS_KEY].newValue });
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
