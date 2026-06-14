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
  const settings = await getSettings();
  currentType = type;

  try {
    switch (type) {
      case 'openai': {
        if (!settings.openaiApiKey?.trim()) {
          currentProvider = mockProvider;
          break;
        }
        const { OpenAIProvider } = await import('./openAiProvider');
        currentProvider = new OpenAIProvider(settings.openaiApiKey);
        break;
      }
      case 'gemini': {
        if (!settings.geminiApiKey?.trim()) {
          currentProvider = mockProvider;
          break;
        }
        const { GeminiProvider } = await import('./geminiProvider');
        currentProvider = new GeminiProvider(settings.geminiApiKey);
        break;
      }
      case 'claude': {
        if (!settings.claudeApiKey?.trim()) {
          currentProvider = mockProvider;
          break;
        }
        const { ClaudeProvider } = await import('./claudeProvider');
        currentProvider = new ClaudeProvider(settings.claudeApiKey);
        break;
      }
      default:
        currentProvider = mockProvider;
        currentType = 'mock';
    }
  } catch {
    currentProvider = mockProvider;
  }
}

export async function testAIProvider(type: ProviderType): Promise<{ ok: boolean; message: string }> {
  const settings = await getSettings();
  try {
    let provider: AIProvider;
    switch (type) {
      case 'openai':
        if (!settings.openaiApiKey?.trim()) return { ok: false, message: 'API key required' };
        provider = new (await import('./openAiProvider')).OpenAIProvider(settings.openaiApiKey);
        break;
      case 'gemini':
        if (!settings.geminiApiKey?.trim()) return { ok: false, message: 'API key required' };
        provider = new (await import('./geminiProvider')).GeminiProvider(settings.geminiApiKey);
        break;
      case 'claude':
        if (!settings.claudeApiKey?.trim()) return { ok: false, message: 'API key required' };
        provider = new (await import('./claudeProvider')).ClaudeProvider(settings.claudeApiKey);
        break;
      default:
        return { ok: true, message: 'Mock provider works offline' };
    }
    const title = await provider.generateTitle('Test connection from ClipMind AI');
    return { ok: true, message: `Connected! Sample: "${title.slice(0, 40)}"` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export { mockProvider };
