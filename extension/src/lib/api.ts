import { storage } from './storage';
import { STORAGE_KEYS } from './constants';

export interface ApiConfig {
  baseUrl: string;
  token: string | null;
}

export async function getApiConfig(): Promise<ApiConfig> {
  const settings = await storage.getSettings();
  const token = await storage.get<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
  return {
    baseUrl: settings.apiBaseUrl ?? '',
    token,
  };
}

export async function setAuthToken(token: string | null): Promise<void> {
  await storage.set(STORAGE_KEYS.AUTH_TOKEN, token);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  const { baseUrl, token } = await getApiConfig();
  if (!baseUrl || !token) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.data as T;
  } catch {
    return null;
  }
}

export async function syncNoteToCloud(note: Record<string, unknown>): Promise<boolean> {
  const settings = await storage.getSettings();
  if (!settings.syncEnabled) return false;

  const result = await apiFetch<Record<string, unknown>>('/api/v1/notes', {
    method: 'POST',
    body: JSON.stringify({
      title: note.title,
      content: note.content,
      url: note.url,
      tags: note.tags ?? [],
      is_pinned: note.isPinned ?? false,
    }),
  });
  return result !== null;
}

export async function syncPromptToCloud(prompt: Record<string, unknown>): Promise<boolean> {
  const settings = await storage.getSettings();
  if (!settings.syncEnabled) return false;

  const result = await apiFetch<Record<string, unknown>>('/api/v1/prompts', {
    method: 'POST',
    body: JSON.stringify({
      title: prompt.title ?? 'Saved Prompt',
      prompt_output: prompt.content,
      category: prompt.category ?? 'General',
      is_saved: true,
    }),
  });
  return result !== null;
}

export async function pullNotesFromCloud(): Promise<Record<string, unknown>[] | null> {
  const settings = await storage.getSettings();
  if (!settings.syncEnabled) return null;

  const result = await apiFetch<{ items: Record<string, unknown>[] }>('/api/v1/notes');
  return result?.items ?? null;
}

export async function verifyAuthToken(): Promise<boolean> {
  const result = await apiFetch<Record<string, unknown>>('/api/v1/profile');
  return result !== null;
}
