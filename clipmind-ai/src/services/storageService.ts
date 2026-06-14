import type { Clip, ClipFilters, ClipInput, ClipStats } from '../types/clip';
import type { Project } from '../types/project';
import { DEFAULT_PROJECT, INBOX_PROJECT_ID } from '../types/project';
import { generateId } from '../utils/id';

const CLIPS_KEY = 'clipmind_clips';
const PROJECTS_KEY = 'clipmind_projects';

async function triggerSync(): Promise<void> {
  try {
    const { pushToSync } = await import('./syncService');
    const clips = await getStorage<Clip[]>(CLIPS_KEY, []);
    const projects = await getStorage<Project[]>(PROJECTS_KEY, []);
    await pushToSync(clips, projects);
  } catch {
    // sync is optional
  }
}

async function getStorage<T>(key: string, fallback: T): Promise<T> {
  try {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? fallback;
  } catch (error) {
    console.error(`[ClipMind] Storage read error (${key}):`, error);
    return fallback;
  }
}

async function setStorage<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error(`[ClipMind] Storage write error (${key}):`, error);
    throw new Error('Failed to save data. Storage may be full.');
  }
}

export async function getClips(): Promise<Clip[]> {
  const clips = await getStorage<Clip[]>(CLIPS_KEY, []);
  return clips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveClip(input: ClipInput): Promise<Clip> {
  const clips = await getStorage<Clip[]>(CLIPS_KEY, []);
  const now = new Date().toISOString();

  const clip: Clip = {
    ...input,
    id: input.id || generateId(),
    projectId: input.projectId || INBOX_PROJECT_ID,
    tags: input.tags || [],
    category: input.category || 'General',
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  clips.unshift(clip);
  await setStorage(CLIPS_KEY, clips);
  triggerSync();
  return clip;
}

export async function updateClip(id: string, updates: Partial<Clip>): Promise<Clip | null> {
  const clips = await getStorage<Clip[]>(CLIPS_KEY, []);
  const index = clips.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updated: Clip = {
    ...clips[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  clips[index] = updated;
  await setStorage(CLIPS_KEY, clips);
  triggerSync();
  return updated;
}

export async function deleteClip(id: string): Promise<boolean> {
  const clips = await getStorage<Clip[]>(CLIPS_KEY, []);
  const filtered = clips.filter((c) => c.id !== id);
  if (filtered.length === clips.length) return false;
  await setStorage(CLIPS_KEY, filtered);
  triggerSync();
  return true;
}

export async function searchClips(filters: ClipFilters = {}): Promise<Clip[]> {
  let clips = await getClips();

  if (filters.projectId && filters.projectId !== 'all') {
    clips = clips.filter((c) => c.projectId === filters.projectId);
  }

  if (filters.category && filters.category !== 'all') {
    clips = clips.filter((c) => c.category === filters.category);
  }

  if (filters.type && filters.type !== 'all') {
    clips = clips.filter((c) => c.type === filters.type);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    clips = clips.filter((c) => {
      const haystack = [
        c.title,
        c.content,
        c.summary,
        c.domain,
        c.category,
        c.userNote,
        ...c.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (filters.sort === 'oldest') {
    clips.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  return clips;
}

export async function findDuplicateClip(
  type: Clip['type'],
  pageUrl: string,
  content?: string,
  imageUrl?: string
): Promise<Clip | null> {
  const clips = await getClips();
  return (
    clips.find((c) => {
      if (c.type !== type || c.pageUrl !== pageUrl) return false;
      if (type === 'text' && content) return c.content === content;
      if (type === 'image' && imageUrl) return c.imageUrl === imageUrl;
      if (type === 'page') return true;
      return false;
    }) ?? null
  );
}

export async function getClipStats(): Promise<ClipStats> {
  const clips = await getClips();
  const categories = new Set(clips.map((c) => c.category));
  return {
    total: clips.length,
    text: clips.filter((c) => c.type === 'text').length,
    image: clips.filter((c) => c.type === 'image').length,
    page: clips.filter((c) => c.type === 'page').length,
    categories: categories.size,
  };
}

export async function getProjects(): Promise<Project[]> {
  const projects = await getStorage<Project[]>(PROJECTS_KEY, [DEFAULT_PROJECT]);
  if (!projects.find((p) => p.id === INBOX_PROJECT_ID)) {
    return [DEFAULT_PROJECT, ...projects];
  }
  return projects;
}

export async function saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Project> {
  const projects = await getProjects();
  const now = new Date().toISOString();

  if (project.id) {
    const index = projects.findIndex((p) => p.id === project.id);
    if (index !== -1) {
      const updated = { ...projects[index], ...project, updatedAt: now };
      projects[index] = updated;
      await setStorage(PROJECTS_KEY, projects);
      triggerSync();
      return updated;
    }
  }

  const newProject: Project = {
    id: generateId(),
    name: project.name,
    color: project.color || '#7c6ff7',
    createdAt: now,
    updatedAt: now,
  };
  projects.push(newProject);
  await setStorage(PROJECTS_KEY, projects);
  triggerSync();
  return newProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (id === INBOX_PROJECT_ID) return false;
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  await setStorage(PROJECTS_KEY, filtered);

  const clips = await getClips();
  const updatedClips = clips.map((c) =>
    c.projectId === id ? { ...c, projectId: INBOX_PROJECT_ID } : c
  );
  await setStorage(CLIPS_KEY, updatedClips);
  triggerSync();
  return true;
}

export function onStorageChange(callback: () => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'local' && (changes[CLIPS_KEY] || changes[PROJECTS_KEY])) {
      callback();
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
