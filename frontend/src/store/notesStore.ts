import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { notes as initialNotes } from '@/data/mockData'
import { generateId } from '@/lib/utils'
import type { Note, NoteTag } from '@/types'

interface NotesState {
  notes: Note[]
  activeNote: Note | null
  searchQuery: string
  selectedTag: NoteTag | 'all'
  showArchived: boolean

  setSearchQuery: (query: string) => void
  setSelectedTag: (tag: NoteTag | 'all') => void
  setShowArchived: (show: boolean) => void
  selectNote: (id: string | null) => void
  createNote: (data: Pick<Note, 'title' | 'content' | 'url' | 'tags'>) => void
  updateNote: (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) => void
  deleteNote: (id: string) => void
  togglePin: (id: string) => void
  toggleArchive: (id: string) => void
  getFilteredNotes: () => Note[]
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: initialNotes,
      activeNote: initialNotes[0] ?? null,
      searchQuery: '',
      selectedTag: 'all',
      showArchived: false,

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedTag: (tag) => set({ selectedTag: tag }),

      setShowArchived: (show) => set({ showArchived: show }),

      selectNote: (id) => {
        if (!id) {
          set({ activeNote: null })
          return
        }
        const note = get().notes.find((n) => n.id === id)
        set({ activeNote: note ?? null })
      },

      createNote: (data) => {
        const note: Note = {
          id: generateId(),
          ...data,
          isPinned: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          notes: [note, ...state.notes],
          activeNote: note,
        }))
      },

      updateNote: (id, data) =>
        set((state) => {
          const updated = state.notes.map((n) =>
            n.id === id
              ? { ...n, ...data, updatedAt: new Date().toISOString() }
              : n,
          )
          return {
            notes: updated,
            activeNote:
              state.activeNote?.id === id
                ? updated.find((n) => n.id === id) ?? null
                : state.activeNote,
          }
        }),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          activeNote: state.activeNote?.id === id ? null : state.activeNote,
        })),

      togglePin: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n,
          ),
        })),

      toggleArchive: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isArchived: !n.isArchived } : n,
          ),
          activeNote:
            state.activeNote?.id === id ? null : state.activeNote,
        })),

      getFilteredNotes: () => {
        const { notes, searchQuery, selectedTag, showArchived } = get()
        return notes
          .filter((n) => (showArchived ? n.isArchived : !n.isArchived))
          .filter((n) => selectedTag === 'all' || n.tags.includes(selectedTag))
          .filter(
            (n) =>
              !searchQuery ||
              n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.url.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          })
      },
    }),
    {
      name: 'techshield-notes',
      partialize: (state) => ({ notes: state.notes }),
    },
  ),
)
