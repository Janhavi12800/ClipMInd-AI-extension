import type { Note } from '../../lib/types'
import { storage } from '../../lib/storage'
import { sanitizeText } from '../../lib/security'

export async function getNotes(url?: string): Promise<Note[]> {
  const notes = await storage.getNotes()
  if (!url) return notes
  return notes.filter((n) => n.url === url)
}

export async function saveNote(
  data: Pick<Note, 'title' | 'content' | 'url' | 'tags'> & { id?: string },
): Promise<Note> {
  const now = new Date().toISOString()
  const note: Note = {
    id: data.id ?? `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: sanitizeText(data.title, 500),
    content: sanitizeText(data.content, 50000),
    url: data.url,
    tags: data.tags,
    isPinned: false,
    createdAt: data.id ? (await storage.getNotes()).find((n) => n.id === data.id)?.createdAt ?? now : now,
    updatedAt: now,
  }
  await storage.saveNote(note)
  return note
}

export async function deleteNote(id: string): Promise<void> {
  await storage.deleteNote(id)
}

export async function togglePin(id: string): Promise<Note | null> {
  const notes = await storage.getNotes()
  const note = notes.find((n) => n.id === id)
  if (!note) return null
  note.isPinned = !note.isPinned
  note.updatedAt = new Date().toISOString()
  await storage.saveNote(note)
  return note
}

export async function searchNotes(query: string): Promise<Note[]> {
  const notes = await storage.getNotes()
  const q = query.toLowerCase()
  return notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
  )
}
