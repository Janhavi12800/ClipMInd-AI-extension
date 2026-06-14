import type { AIProvider } from './aiProvider';
import type { Clip } from '../../types/clip';
import {
  truncateForAI,
  handleApiResponse,
  parseTags,
  parseLines,
  CATEGORIES_LIST,
  AIProviderError,
} from './aiClient';
import { categorizeByKeywords } from '../../utils/category';

const MODEL = 'claude-3-5-haiku-latest';

export class ClaudeProvider implements AIProvider {
  constructor(private apiKey: string) {
    if (!apiKey?.trim()) {
      throw new AIProviderError('Claude API key is required. Add it in ClipMind Settings.');
    }
  }

  private async message(system: string, user: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    const text = await handleApiResponse(res, 'Claude');
    const json = JSON.parse(text);
    const block = json.content?.find((b: { type: string }) => b.type === 'text');
    return block?.text?.trim() || '';
  }

  async generateTitle(content: string, type = 'text'): Promise<string> {
    const result = await this.message(
      'Generate a short title (max 80 chars). Return only the title.',
      `Type: ${type}\n\n${truncateForAI(content, 1500)}`
    );
    return result.slice(0, 80) || 'Saved Clip';
  }

  async summarizeClip(content: string): Promise<string> {
    return this.message(
      'Summarize in 2-3 concise sentences.',
      truncateForAI(content)
    );
  }

  async explainClip(content: string): Promise<string> {
    return this.message(
      'Explain this content clearly for future reference. 3-4 sentences.',
      truncateForAI(content)
    );
  }

  async generateTags(content: string): Promise<string[]> {
    const result = await this.message(
      'Extract 3-6 lowercase tags. Comma-separated only.',
      truncateForAI(content, 2000)
    );
    const tags = parseTags(result);
    return tags.length > 0 ? tags : ['reference'];
  }

  async categorizeClip(content: string, domain = ''): Promise<string> {
    const result = await this.message(
      `Pick one category: ${CATEGORIES_LIST}. Return only the category name.`,
      `Domain: ${domain}\n\n${truncateForAI(content, 2000)}`
    );
    const match = CATEGORIES_LIST.split(', ').find(
      (c) => c.toLowerCase() === result.toLowerCase().trim()
    );
    return match || categorizeByKeywords(content, domain);
  }

  async answerFromSavedClips(question: string, clips: Clip[]): Promise<string> {
    const context = clips.slice(0, 20).map((c) =>
      `[${c.title}] (${c.category}): ${c.summary || c.content?.slice(0, 200) || ''}`
    ).join('\n');

    return this.message(
      'You are ClipMind AI. Answer based only on the saved clips. Cite titles when relevant.',
      `Question: ${question}\n\nClips:\n${context || 'No clips yet.'}`
    );
  }

  async toBulletPoints(content: string): Promise<string[]> {
    const result = await this.message(
      'Convert to 4-8 bullet points. One per line, no bullet characters.',
      truncateForAI(content)
    );
    return parseLines(result);
  }

  async toTaskList(content: string): Promise<string[]> {
    const result = await this.message(
      'Convert to actionable tasks. One per line, action verbs.',
      truncateForAI(content)
    );
    return parseLines(result).map((t) => `☐ ${t}`);
  }
}
