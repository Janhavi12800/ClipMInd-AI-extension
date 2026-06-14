import type { AIProvider } from './aiProvider';
import { mockProvider } from './mockProvider';
import { getSettings } from '../settingsService';

export type ProviderType = 'mock' | 'openai' | 'gemini' | 'claude';

let currentProvider: AIProvider = mockProvider;
let currentType: ProviderType = 'mock';

export function getAIProvider(): AIProvider {
  return currentProvider;
}

export function getCurrentProviderType(): ProviderType {
  return currentType;
}

export async function initAIProvider(): Promise<void> {
  const settings = await getSettings();
  await setAIProvider(settings.aiProvider);
}

export async function setAIProvider(type: ProviderType): Promise<void> {
  currentType = type;
  switch (type) {
    case 'openai': {
      const { OpenAIProvider } = await import('./openAiProvider.placeholder');
      currentProvider = new OpenAIProvider();
      break;
    }
    case 'gemini': {
      const { GeminiProvider } = await import('./geminiProvider.placeholder');
      currentProvider = new GeminiProvider();
      break;
    }
    case 'claude': {
      const { ClaudeProvider } = await import('./claudeProvider.placeholder');
      currentProvider = new ClaudeProvider();
      break;
    }
    default:
      currentProvider = mockProvider;
      currentType = 'mock';
  }
}

export { mockProvider };
