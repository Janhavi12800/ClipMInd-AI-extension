import type { AIProvider } from './aiProvider';
import { mockProvider } from './mockProvider';

export type ProviderType = 'mock' | 'openai' | 'gemini';

let currentProvider: AIProvider = mockProvider;

export function getAIProvider(): AIProvider {
  return currentProvider;
}

export async function setAIProvider(type: ProviderType): Promise<void> {
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
    default:
      currentProvider = mockProvider;
  }
}

export { mockProvider };
