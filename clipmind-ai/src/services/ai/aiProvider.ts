import type { Clip } from '../../types/clip';

export interface AIProvider {
  generateTitle(content: string, type?: string): Promise<string>;
  summarizeClip(content: string): Promise<string>;
  explainClip(content: string): Promise<string>;
  generateTags(content: string): Promise<string[]>;
  categorizeClip(content: string, domain?: string): Promise<string>;
  answerFromSavedClips(question: string, clips: Clip[]): Promise<string>;
  toBulletPoints(content: string): Promise<string[]>;
  toTaskList(content: string): Promise<string[]>;
}
