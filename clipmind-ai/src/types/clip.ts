export type ClipType = 'text' | 'image' | 'page';

export interface Clip {
  id: string;
  type: ClipType;
  title: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  pageUrl: string;
  pageTitle: string;
  domain: string;
  favicon?: string;
  summary?: string;
  explanation?: string;
  bulletPoints?: string[];
  taskList?: string[];
  tags: string[];
  category: string;
  projectId: string;
  userNote?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClipInput = Omit<Clip, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface ClipFilters {
  search?: string;
  category?: string;
  type?: ClipType | 'all';
  projectId?: string;
  sort?: 'newest' | 'oldest';
}

export interface ClipStats {
  total: number;
  text: number;
  image: number;
  page: number;
  categories: number;
}

export type MessageType =
  | 'SAVE_TEXT_CLIP'
  | 'SAVE_TEXT_CLIP_SUMMARIZE'
  | 'EXPLAIN_SELECTION'
  | 'SAVE_TO_PROJECT'
  | 'SAVE_IMAGE_CLIP'
  | 'SAVE_PAGE_CLIP'
  | 'CLIP_SAVED'
  | 'CLIP_DUPLICATE'
  | 'CLIP_ERROR'
  | 'SHOW_TOAST'
  | 'OPEN_SIDE_PANEL'
  | 'GET_SETTINGS'
  | 'TEST_AI_PROVIDER'
  | 'SYNC_NOW';

export interface ExtensionMessage {
  type: MessageType;
  payload?: Record<string, unknown>;
}

export interface SaveTextClipPayload {
  text: string;
  pageUrl: string;
  pageTitle: string;
  domain: string;
  summarize?: boolean;
  explain?: boolean;
  projectId?: string;
  userNote?: string;
}

export interface SaveImageClipPayload {
  imageUrl: string;
  imageAlt?: string;
  pageUrl: string;
  pageTitle: string;
  domain: string;
}

export interface SavePageClipPayload {
  pageUrl: string;
  pageTitle: string;
  domain: string;
  favicon?: string;
  userNote?: string;
}
