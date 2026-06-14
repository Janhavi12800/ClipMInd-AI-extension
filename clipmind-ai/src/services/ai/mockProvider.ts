import type { AIProvider } from './aiProvider';
import type { Clip } from '../../types/clip';
import { categorizeByKeywords } from '../../utils/category';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
  'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'we',
  'our', 'you', 'your', 'he', 'she', 'his', 'her', 'as', 'if', 'not',
]);

function extractKeywords(text: string, limit = 5): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]?/);
  return match ? match[0].trim() : text.slice(0, 120).trim();
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '…';
}

function scoreClipRelevance(clip: Clip, queryWords: string[]): number {
  const haystack = [
    clip.title,
    clip.content,
    clip.summary,
    clip.domain,
    clip.category,
    ...clip.tags,
    clip.userNote,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return queryWords.reduce((score, word) => {
    if (haystack.includes(word)) return score + 1;
    return score;
  }, 0);
}

export class MockAIProvider implements AIProvider {
  async generateTitle(content: string, type = 'text'): Promise<string> {
    await this.simulateDelay();

    if (type === 'image') {
      return 'Saved Image Reference';
    }
    if (type === 'page') {
      return content.slice(0, 60) || 'Saved Page';
    }

    const sentence = firstSentence(content);
    if (sentence.length <= 80) return sentence;
    const keywords = extractKeywords(content, 3);
    return keywords.length > 0
      ? keywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' · ')
      : truncate(sentence, 80);
  }

  async summarizeClip(content: string): Promise<string> {
    await this.simulateDelay();
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    if (sentences.length === 0) return truncate(content, 150);
    if (sentences.length === 1) return sentences[0];
    return `${sentences[0]}. ${sentences[Math.min(1, sentences.length - 1)]}.`;
  }

  async explainClip(content: string): Promise<string> {
    await this.simulateDelay();
    const keywords = extractKeywords(content, 4);
    const topic = keywords[0] || 'this content';
    return (
      `This clip discusses ${topic} and related concepts. ` +
      `Key themes include: ${keywords.slice(0, 3).join(', ') || 'general information'}. ` +
      `In context, it appears to be informational content worth referencing later.`
    );
  }

  async generateTags(content: string): Promise<string[]> {
    await this.simulateDelay();
    const keywords = extractKeywords(content, 6);
    return keywords.length > 0 ? keywords : ['saved', 'reference'];
  }

  async categorizeClip(content: string, domain = ''): Promise<string> {
    await this.simulateDelay();
    return categorizeByKeywords(content, domain);
  }

  async answerFromSavedClips(question: string, clips: Clip[]): Promise<string> {
    await this.simulateDelay(400);

    const queryWords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    if (queryWords.length === 0) {
      return 'Please ask a more specific question about your saved clips.';
    }

    const scored = clips
      .map((clip) => ({ clip, score: scoreClipRelevance(clip, queryWords) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (scored.length === 0) {
      return `I couldn't find any saved clips related to "${question}". Try saving more content on this topic, or rephrase your question.`;
    }

    const lines = [
      `Based on your saved memory, here's what I found about "${question}":\n`,
    ];

    for (const { clip } of scored) {
      const preview = clip.summary || clip.content || clip.title;
      lines.push(`**${clip.title}** (${clip.category})`);
      lines.push(`> ${truncate(preview || '', 120)}`);
      lines.push(`Source: ${clip.domain} · ${new Date(clip.createdAt).toLocaleDateString()}\n`);
    }

    lines.push(`Found ${scored.length} relevant clip${scored.length > 1 ? 's' : ''} in your memory.`);
    return lines.join('\n');
  }

  async toBulletPoints(content: string): Promise<string[]> {
    await this.simulateDelay();
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
    return sentences.slice(0, 8).map((s) => s.replace(/^[-•*]\s*/, ''));
  }

  async toTaskList(content: string): Promise<string[]> {
    await this.simulateDelay();
    const bullets = await this.toBulletPoints(content);
    return bullets.map((b) => `☐ ${b.charAt(0).toUpperCase() + b.slice(1)}`);
  }

  private async simulateDelay(ms = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockProvider = new MockAIProvider();
