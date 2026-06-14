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

const MODEL = 'gemini-1.5-flash';

export class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {
    if (!apiKey?.trim()) {
      throw new AIProviderError('Gemini API key is required. Add it in ClipMind Settings.');
    }
  }

  private async generate(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 600,
          temperature: 0.3,
        },
      }),
    });

    const text = await handleApiResponse(res, 'Gemini');
    const json = JSON.parse(text);
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  async generateTitle(content: string, type = 'text'): Promise<string> {
    const result = await this.generate(
      `Generate a short title (max 80 chars) for this ${type} clip. Return only the title:\n\n${truncateForAI(content, 1500)}`
    );
    return result.slice(0, 80) || 'Saved Clip';
  }

  async summarizeClip(content: string): Promise<string> {
    return this.generate(`Summarize in 2-3 sentences:\n\n${truncateForAI(content)}`);
  }

  async explainClip(content: string): Promise<string> {
    return this.generate(`Explain this content clearly in 3-4 sentences:\n\n${truncateForAI(content)}`);
  }

  async generateTags(content: string): Promise<string[]> {
    const result = await this.generate(
      `Extract 3-6 lowercase tags, comma-separated only:\n\n${truncateForAI(content, 2000)}`
    );
    const tags = parseTags(result);
    return tags.length > 0 ? tags : ['reference'];
  }

  async categorizeClip(content: string, domain = ''): Promise<string> {
    const result = await this.generate(
      `Pick one category from: ${CATEGORIES_LIST}. Return only the category.\n\nDomain: ${domain}\n${truncateForAI(content, 2000)}`
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

    return this.generate(
      `Answer this question using only these saved clips:\n\nQuestion: ${question}\n\nClips:\n${context || 'None'}`
    );
  }

  async toBulletPoints(content: string): Promise<string[]> {
    const result = await this.generate(
      `Convert to 4-8 bullet points, one per line:\n\n${truncateForAI(content)}`
    );
    return parseLines(result);
  }

  async toTaskList(content: string): Promise<string[]> {
    const result = await this.generate(
      `Convert to actionable tasks, one per line:\n\n${truncateForAI(content)}`
    );
    return parseLines(result).map((t) => `☐ ${t}`);
  }
}
