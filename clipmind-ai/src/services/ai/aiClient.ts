const MAX_CONTENT_LENGTH = 6000;

export function truncateForAI(text: string, max = MAX_CONTENT_LENGTH): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n…[truncated]';
}

export class AIProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export async function handleApiResponse(res: Response, provider: string): Promise<string> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.error?.status || body?.message || detail;
    } catch {
      // use status text
    }
    throw new AIProviderError(`${provider} API error (${res.status}): ${detail}`);
  }
  return res.text();
}

export function parseTags(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#/, '').toLowerCase())
    .filter((t) => t.length > 0 && t.length < 30)
    .slice(0, 8);
}

export function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.replace(/^[-•*☐\d.)\s]+/, '').trim())
    .filter((l) => l.length > 0)
    .slice(0, 12);
}

export const CATEGORIES_LIST = [
  'Study', 'Coding', 'Business', 'Design Inspiration',
  'Shopping Research', 'Client Work', 'Ideas', 'Finance', 'Health', 'General',
].join(', ');
