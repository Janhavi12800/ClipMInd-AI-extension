import type { ProviderType } from '../services/ai/providerFactory';

export interface AppSettings {
  aiProvider: ProviderType;
  openaiApiKey: string;
  geminiApiKey: string;
  claudeApiKey: string;
  darkMode: boolean;
  showSelectionBubble: boolean;
  enableSync: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: 'mock',
  openaiApiKey: '',
  geminiApiKey: '',
  claudeApiKey: '',
  darkMode: false,
  showSelectionBubble: true,
  enableSync: false,
};
