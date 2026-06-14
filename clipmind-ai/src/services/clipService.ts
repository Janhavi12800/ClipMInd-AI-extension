import type { Clip } from '../types/clip';
import { INBOX_PROJECT_ID } from '../types/project';
import { getAIProvider } from './ai/providerFactory';
import {
  findDuplicateClip,
  saveClip,
  updateClip,
} from './storageService';
import { extractDomain, getFaviconUrl } from '../utils/domain';

export interface CreateTextClipOptions {
  text: string;
  pageUrl: string;
  pageTitle: string;
  summarize?: boolean;
  explain?: boolean;
  projectId?: string;
  userNote?: string;
  force?: boolean;
}

export interface CreateImageClipOptions {
  imageUrl: string;
  imageAlt?: string;
  pageUrl: string;
  pageTitle: string;
  force?: boolean;
}

export interface CreatePageClipOptions {
  pageUrl: string;
  pageTitle: string;
  favicon?: string;
  userNote?: string;
  force?: boolean;
}

export type CreateClipResult =
  | { status: 'saved'; clip: Clip }
  | { status: 'duplicate'; clip: Clip }
  | { status: 'error'; message: string };

export async function createTextClip(options: CreateTextClipOptions): Promise<CreateClipResult> {
  const { text, pageUrl, pageTitle, summarize, explain, projectId, userNote, force } = options;

  if (!text?.trim()) {
    return { status: 'error', message: 'No text selected.' };
  }

  const domain = extractDomain(pageUrl);

  if (!force) {
    const duplicate = await findDuplicateClip('text', pageUrl, text);
    if (duplicate) return { status: 'duplicate', clip: duplicate };
  }

  try {
    const ai = getAIProvider();
    const [title, tags, category] = await Promise.all([
      ai.generateTitle(text, 'text'),
      ai.generateTags(text),
      ai.categorizeClip(text, domain),
    ]);

    let summary: string | undefined;
    let explanation: string | undefined;

    if (summarize) {
      summary = await ai.summarizeClip(text);
    }
    if (explain) {
      explanation = await ai.explainClip(text);
    }

    const clip = await saveClip({
      type: 'text',
      title,
      content: text,
      pageUrl,
      pageTitle,
      domain,
      tags,
      category,
      projectId: projectId || INBOX_PROJECT_ID,
      userNote,
      summary,
      explanation,
    });

    return { status: 'saved', clip };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to save clip.',
    };
  }
}

export async function createImageClip(options: CreateImageClipOptions): Promise<CreateClipResult> {
  const { imageUrl, imageAlt, pageUrl, pageTitle, force } = options;

  if (!imageUrl?.trim()) {
    return { status: 'error', message: 'Invalid image URL.' };
  }

  const domain = extractDomain(pageUrl);

  if (!force) {
    const duplicate = await findDuplicateClip('image', pageUrl, undefined, imageUrl);
    if (duplicate) return { status: 'duplicate', clip: duplicate };
  }

  try {
    const ai = getAIProvider();
    const content = imageAlt || imageUrl;
    const [title, tags, category] = await Promise.all([
      ai.generateTitle(content, 'image'),
      ai.generateTags(content),
      ai.categorizeClip(content, domain),
    ]);

    const clip = await saveClip({
      type: 'image',
      title,
      content: imageAlt,
      imageUrl,
      imageAlt,
      pageUrl,
      pageTitle,
      domain,
      tags,
      category,
      projectId: INBOX_PROJECT_ID,
      summary: imageAlt || 'Saved image reference for later use.',
    });

    return { status: 'saved', clip };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to save image.',
    };
  }
}

export async function createPageClip(options: CreatePageClipOptions): Promise<CreateClipResult> {
  const { pageUrl, pageTitle, favicon, userNote, force } = options;

  if (!pageUrl?.trim()) {
    return { status: 'error', message: 'No active page found.' };
  }

  const domain = extractDomain(pageUrl);

  if (!force) {
    const duplicate = await findDuplicateClip('page', pageUrl);
    if (duplicate) return { status: 'duplicate', clip: duplicate };
  }

  try {
    const ai = getAIProvider();
    const [title, tags, category] = await Promise.all([
      ai.generateTitle(pageTitle, 'page'),
      ai.generateTags(pageTitle),
      ai.categorizeClip(pageTitle, domain),
    ]);

    const clip = await saveClip({
      type: 'page',
      title,
      content: pageTitle,
      pageUrl,
      pageTitle,
      domain,
      favicon: favicon || getFaviconUrl(pageUrl),
      tags,
      category,
      projectId: INBOX_PROJECT_ID,
      userNote,
      summary: `Saved page: ${pageTitle}`,
    });

    return { status: 'saved', clip };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to save page.',
    };
  }
}

export async function runAIActionOnClip(
  clipId: string,
  action: 'summarize' | 'explain' | 'bullets' | 'tasks'
): Promise<Clip | null> {
  const ai = getAIProvider();
  const { getClips } = await import('./storageService');
  const clips = await getClips();
  const clip = clips.find((c) => c.id === clipId);
  if (!clip) return null;

  const content = clip.content || clip.summary || clip.title;

  switch (action) {
    case 'summarize': {
      const summary = await ai.summarizeClip(content);
      return updateClip(clipId, { summary });
    }
    case 'explain': {
      const explanation = await ai.explainClip(content);
      return updateClip(clipId, { explanation });
    }
    case 'bullets': {
      const bulletPoints = await ai.toBulletPoints(content);
      return updateClip(clipId, { bulletPoints });
    }
    case 'tasks': {
      const taskList = await ai.toTaskList(content);
      return updateClip(clipId, { taskList });
    }
    default:
      return null;
  }
}
