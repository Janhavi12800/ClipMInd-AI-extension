import type { Clip } from '../types/clip';

export function clipToMarkdown(clip: Clip): string {
  const lines: string[] = [];

  lines.push(`# ${clip.title}`);
  lines.push('');

  if (clip.summary) {
    lines.push('## Summary');
    lines.push(clip.summary);
    lines.push('');
  }

  if (clip.explanation) {
    lines.push('## Explanation');
    lines.push(clip.explanation);
    lines.push('');
  }

  if (clip.content) {
    lines.push('## Content');
    lines.push(clip.content);
    lines.push('');
  }

  if (clip.imageUrl) {
    lines.push('## Image');
    lines.push(`![${clip.imageAlt || clip.title}](${clip.imageUrl})`);
    lines.push('');
  }

  if (clip.userNote) {
    lines.push('## Note');
    lines.push(clip.userNote);
    lines.push('');
  }

  if (clip.tags.length > 0) {
    lines.push(`**Tags:** ${clip.tags.map((t) => `\`${t}\``).join(', ')}`);
  }

  lines.push(`**Category:** ${clip.category}`);
  lines.push(`**Source:** [${clip.pageTitle}](${clip.pageUrl})`);
  lines.push(`**Saved:** ${new Date(clip.createdAt).toLocaleString()}`);

  return lines.join('\n');
}

export function clipsToJson(clips: Clip[]): string {
  return JSON.stringify(clips, null, 2);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
