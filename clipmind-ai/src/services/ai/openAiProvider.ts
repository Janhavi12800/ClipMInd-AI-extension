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

const MODEL = 'gpt-4o-mini';

export class OpenAIProvider implements AIProvider {
  constructor(private apiKey: string) {
    if (!apiKey?.trim()) {
      throw new AIProviderError('OpenAI API key is required. Add it in ClipMind Settings.');
    }
  }

  private async chat(system: string, user: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    const text = await handleApiResponse(res, 'OpenAI');
    const json = JSON.parse(text);
    return json.choices?.[0]?.message?.content?.trim() || '';
  }

  async generateTitle(content: string, type = 'text'): Promise<string> {
    const result = await this.chat(
      'Generate a short, descriptive title (max 80 chars). Return only the title, no quotes.',
      `Type: ${type}\n\nContent:\n${truncateForAI(content, 1500)}`
    );
    return result.slice(0, 80) || 'Saved Clip';
  }

  async summarizeClip(content: string): Promise<string> {
    return this.chat(
      'Summarize the content in 2-3 concise sentences. Return only the summary.',
      truncateForAI(content)
    );
  }

  async explainClip(content: string): Promise<string> {
    return this.chat(
      'Explain this content clearly for someone saving it for later reference. 3-4 sentences.',
      truncateForAI(content)
    );
  }

  async generateTags(content: string): Promise<string[]> {
    const result = await this.chat(
      'Extract 3-6 relevant lowercase tags. Return comma-separated tags only.',
      truncateForAI(content, 2000)
    );
    const tags = parseTags(result);
    return tags.length > 0 ? tags : ['reference'];
  }

  async categorizeClip(content: string, domain = ''): Promise<string> {
    const result = await this.chat(
      `Pick exactly one category from: ${CATEGORIES_LIST}. Return only the category name.`,
      `Domain: ${domain}\n\n${truncateForAI(content, 2000)}`
    );
    const match = CATEGORIES_LIST.split(', ').find(
      (c) => c.toLowerCase() === result.toLowerCase().trim()
    );
    return match || categorizeByKeywords(content, domain);
  }

  async answerFromSavedClips(question: string, clips: Clip[]): Promise<string> {
    const context = clips.slice(0, 20).map((c) =>
      `[${c.title}] (${c.category}, ${c.domain})\n${c.summary || c.content?.slice(0, 200) || ''}`
    ).join('\n\n');

    return this.chat(
      'You are ClipMind AI, a personal web memory assistant. Answer based only on the saved clips provided. Be helpful and cite clip titles when relevant.',
      `Question: ${question}\n\nSaved clips:\n${context || 'No clips saved yet.'}`
    );
  }

  async toBulletPoints(content: string): Promise<string[]> {
    const result = await this.chat(
      'Convert to 4-8 concise bullet points. One per line, no bullets characters.',
      truncateForAI(content)
    );
    return parseLines(result);
  }

  async toTaskList(content: string): Promise<string[]> {
    const result = await this.chat(
      'Convert to an actionable task list. One task per line, start each with an action verb.',
      truncateForAI(content)
    );
    return parseLines(result).map((t) => `☐ ${t}`);
  }
}
