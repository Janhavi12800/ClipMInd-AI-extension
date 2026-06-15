import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants'
import type { Note, PromptEntry, UserSettings } from './types'

interface ScanCacheEntry {
  url: string
  data: unknown
  timestamp: number
}

class StorageManager {
  async get<T>(key: string, fallback: T): Promise<T> {
    const result = await chrome.storage.local.get(key)
    return (result[key] as T) ?? fallback
  }

  async set(key: string, value: unknown): Promise<void> {
    await chrome.storage.local.set({ [key]: value })
  }

  async getSettings(): Promise<UserSettings> {
    return this.get(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS })
  }

  async setSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings()
    const updated = { ...current, ...settings }
    await this.set(STORAGE_KEYS.SETTINGS, updated)
    return updated
  }

  async getPromptLibrary(): Promise<PromptEntry[]> {
    return this.get(STORAGE_KEYS.PROMPT_LIBRARY, [])
  }

  async savePrompt(prompt: PromptEntry): Promise<void> {
    const library = await this.getPromptLibrary()
    const index = library.findIndex((p) => p.id === prompt.id)
    if (index >= 0) {
      library[index] = prompt
    } else {
      library.unshift(prompt)
    }
    await this.set(STORAGE_KEYS.PROMPT_LIBRARY, library.slice(0, 500))
  }

  async deletePrompt(id: string): Promise<void> {
    const library = await this.getPromptLibrary()
    await this.set(STORAGE_KEYS.PROMPT_LIBRARY, library.filter((p) => p.id !== id))
  }

  async getNotes(): Promise<Note[]> {
    return this.get(STORAGE_KEYS.NOTES, [])
  }

  async saveNote(note: Note): Promise<void> {
    const notes = await this.getNotes()
    const index = notes.findIndex((n) => n.id === note.id)
    if (index >= 0) {
      notes[index] = note
    } else {
      notes.unshift(note)
    }
    await this.set(STORAGE_KEYS.NOTES, notes)
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes()
    await this.set(STORAGE_KEYS.NOTES, notes.filter((n) => n.id !== id))
  }

  async getScanCache(url: string): Promise<unknown | null> {
    const cache = await this.get<Record<string, ScanCacheEntry>>(STORAGE_KEYS.SCAN_CACHE, {})
    const entry = cache[url]
    if (!entry) return null
    if (Date.now() - entry.timestamp > 15 * 60 * 1000) return null
    return entry.data
  }

  async setScanCache(url: string, data: unknown): Promise<void> {
    const cache = await this.get<Record<string, ScanCacheEntry>>(STORAGE_KEYS.SCAN_CACHE, {})
    cache[url] = { url, data, timestamp: Date.now() }
    const keys = Object.keys(cache)
    if (keys.length > 100) {
      const sorted = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp)
      sorted.slice(0, keys.length - 100).forEach((k) => delete cache[k])
    }
    await this.set(STORAGE_KEYS.SCAN_CACHE, cache)
  }

  async getLogBuffer(): Promise<Record<string, unknown>[]> {
    return this.get('ts_log_buffer', [])
  }

  async setLogBuffer(logs: Record<string, unknown>[]): Promise<void> {
    await this.set('ts_log_buffer', logs)
  }

  async getProductivity(): Promise<Record<string, unknown>> {
    return this.get(STORAGE_KEYS.PRODUCTIVITY, {
      snippets: [],
      tasks: [],
      pomodoroMinutes: 25,
    })
  }

  async setProductivity(data: Record<string, unknown>): Promise<void> {
    await this.set(STORAGE_KEYS.PRODUCTIVITY, data)
  }
}

export const storage = new StorageManager()
