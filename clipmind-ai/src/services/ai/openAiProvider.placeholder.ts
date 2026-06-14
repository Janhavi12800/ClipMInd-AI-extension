import type { AIProvider } from './aiProvider';

/**
 * Placeholder for OpenAI integration.
 * Set OPENAI_API_KEY in extension options and implement API calls here.
 */
export class OpenAIProvider implements AIProvider {
  async generateTitle(_content: string): Promise<string> {
    throw new Error('OpenAI provider not configured. Set your API key in settings.');
  }
  async summarizeClip(_content: string): Promise<string> {
    throw new Error('OpenAI provider not configured.');
  }
  async explainClip(_content: string): Promise<string> {
    throw new Error('OpenAI provider not configured.');
  }
  async generateTags(_content: string): Promise<string[]> {
    throw new Error('OpenAI provider not configured.');
  }
  async categorizeClip(_content: string, _domain?: string): Promise<string> {
    throw new Error('OpenAI provider not configured.');
  }
  async answerFromSavedClips(_question: string, _clips: import('../../types/clip').Clip[]): Promise<string> {
    throw new Error('OpenAI provider not configured.');
  }
  async toBulletPoints(_content: string): Promise<string[]> {
    throw new Error('OpenAI provider not configured.');
  }
  async toTaskList(_content: string): Promise<string[]> {
    throw new Error('OpenAI provider not configured.');
  }
}
