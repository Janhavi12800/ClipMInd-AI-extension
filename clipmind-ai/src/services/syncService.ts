import type { Clip } from '../types/clip';
import type { Project } from '../types/project';
import { getSettings } from './settingsService';

const SYNC_META_KEY = 'clipmind_sync_meta';
const SYNC_CHUNK_PREFIX = 'clipmind_sync_chunk_';
const SYNC_PROJECTS_KEY = 'clipmind_sync_projects';
const CHUNK_SIZE = 7000;
const MAX_SYNC_CLIPS = 40;

export interface SyncStatus {
  enabled: boolean;
  lastSyncAt: string | null;
  clipCount: number;
  error: string | null;
}

function stripClipForSync(clip: Clip): Clip {
  return {
    ...clip,
    content: clip.content?.slice(0, 1500),
    summary: clip.summary?.slice(0, 500),
    explanation: clip.explanation?.slice(0, 500),
  };
}

function chunkString(data: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  return chunks.length > 0 ? chunks : [''];
}

async function clearSyncChunks(): Promise<void> {
  const existing = await chrome.storage.sync.get(null);
  const keysToRemove = Object.keys(existing).filter(
    (k) => k.startsWith(SYNC_CHUNK_PREFIX) || k === SYNC_META_KEY || k === SYNC_PROJECTS_KEY
  );
  if (keysToRemove.length > 0) {
    await chrome.storage.sync.remove(keysToRemove);
  }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const settings = await getSettings();
  const meta = await chrome.storage.sync.get(SYNC_META_KEY);
  const raw = meta[SYNC_META_KEY];
  const syncMeta = raw
    ? (typeof raw === 'string' ? JSON.parse(raw) : raw) as { lastSyncAt?: string; clipCount?: number; error?: string }
    : undefined;

  return {
    enabled: settings.enableSync,
    lastSyncAt: syncMeta?.lastSyncAt || null,
    clipCount: syncMeta?.clipCount || 0,
    error: syncMeta?.error || null,
  };
}

export async function pushToSync(clips: Clip[], projects: Project[]): Promise<void> {
  const settings = await getSettings();
  if (!settings.enableSync) return;

  try {
    await clearSyncChunks();

    const syncClips = clips.slice(0, MAX_SYNC_CLIPS).map(stripClipForSync);
    const payload = JSON.stringify(syncClips);
    const chunks = chunkString(payload);

    const chunkEntries: Record<string, string> = {};
    chunks.forEach((chunk, i) => {
      chunkEntries[`${SYNC_CHUNK_PREFIX}${i}`] = chunk;
    });

    chunkEntries[SYNC_META_KEY] = JSON.stringify({
      lastSyncAt: new Date().toISOString(),
      clipCount: syncClips.length,
      chunkCount: chunks.length,
      error: null,
    });

    chunkEntries[SYNC_PROJECTS_KEY] = JSON.stringify(projects);

    await chrome.storage.sync.set(chunkEntries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await chrome.storage.sync.set({
      [SYNC_META_KEY]: JSON.stringify({
        lastSyncAt: new Date().toISOString(),
        error: message,
      }),
    });
  }
}

export async function pullFromSync(): Promise<{ clips: Clip[]; projects: Project[] } | null> {
  const settings = await getSettings();
  if (!settings.enableSync) return null;

  try {
    const data = await chrome.storage.sync.get(null);
    const metaRaw = data[SYNC_META_KEY];
    if (!metaRaw) return null;

    const meta = JSON.parse(metaRaw as string) as { chunkCount: number };
    let payload = '';
    for (let i = 0; i < meta.chunkCount; i++) {
      payload += (data[`${SYNC_CHUNK_PREFIX}${i}`] as string) || '';
    }

    const clips: Clip[] = payload ? JSON.parse(payload) : [];
    const projects: Project[] = data[SYNC_PROJECTS_KEY]
      ? JSON.parse(data[SYNC_PROJECTS_KEY] as string)
      : [];

    return { clips, projects };
  } catch {
    return null;
  }
}

export function mergeClips(local: Clip[], remote: Clip[]): Clip[] {
  const map = new Map<string, Clip>();

  for (const clip of [...remote, ...local]) {
    const existing = map.get(clip.id);
    if (!existing || new Date(clip.updatedAt) > new Date(existing.updatedAt)) {
      map.set(clip.id, clip);
    }
  }

  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function mergeProjects(local: Project[], remote: Project[]): Project[] {
  const map = new Map<string, Project>();
  for (const p of [...remote, ...local]) {
    const existing = map.get(p.id);
    if (!existing || new Date(p.updatedAt) > new Date(existing.updatedAt)) {
      map.set(p.id, p);
    }
  }
  return [...map.values()];
}

export async function syncFromCloud(): Promise<{ merged: number }> {
  const remote = await pullFromSync();
  if (!remote) return { merged: 0 };

  const { getClips, getProjects } = await import('./storageService');
  const localClips = await getClips();
  const localProjects = await getProjects();

  const mergedClips = mergeClips(localClips, remote.clips);
  const mergedProjects = mergeProjects(localProjects, remote.projects);

  await chrome.storage.local.set({
    clipmind_clips: mergedClips,
    clipmind_projects: mergedProjects,
  });

  await pushToSync(mergedClips, mergedProjects);

  return { merged: mergedClips.length };
}
