import { useState } from 'react'
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  Archive,
  ArchiveRestore,
  Search,
  StickyNote,
  ExternalLink,
  Tag,
} from 'lucide-react'
import { useNotesStore } from '@/store'
import { PageHeader } from '@/components/layout'
import { TabContextBar } from '@/components/shared'
import {
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Textarea,
} from '@/components/ui'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { NoteTag } from '@/types'

const tagOptions: { value: NoteTag | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'research', label: 'Research' },
  { value: 'security', label: 'Security' },
  { value: 'seo', label: 'SEO' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'idea', label: 'Idea' },
  { value: 'client', label: 'Client' },
  { value: 'personal', label: 'Personal' },
]

const tagColors: Record<NoteTag, string> = {
  research: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  security: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  seo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  idea: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  client: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  personal: 'bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
}

export function NotesManagerPage() {
  const {
    activeNote,
    selectedTag,
    showArchived,
    setSearchQuery,
    setSelectedTag,
    setShowArchived,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleArchive,
    getFilteredNotes,
  } = useNotesStore()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', url: '', tags: [] as NoteTag[] })
  const [localSearch, setLocalSearch] = useState('')

  const filteredNotes = getFilteredNotes()

  const handleSearch = (value: string) => {
    setLocalSearch(value)
    setSearchQuery(value)
  }

  const handleCreate = () => {
    if (!newNote.title.trim()) return
    createNote({
      title: newNote.title.trim(),
      content: newNote.content,
      url: newNote.url || window.location.origin,
      tags: newNote.tags,
    })
    setCreateModalOpen(false)
    setNewNote({ title: '', content: '', url: '', tags: [] })
  }

  const toggleTag = (tag: NoteTag) => {
    setNewNote((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  return (
    <div>
      <PageHeader
        title="Notes Manager"
        description="URL-anchored notes with tags, search, and offline sync"
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        }
      />

      <div className="mb-6">
        <TabContextBar />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Input
            placeholder="Search notes..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Search notes"
          />

          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => setSelectedTag(tag.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedTag === tag.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-app-tertiary text-app-secondary hover:text-app',
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-3.5 w-3.5" />
              {showArchived ? 'Showing Archived' : 'Show Archived'}
            </Button>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <EmptyState
                icon={<StickyNote className="h-6 w-6" />}
                title="No notes found"
                description={showArchived ? 'No archived notes.' : 'Create a note to get started.'}
              />
            ) : (
              filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  padding="sm"
                  hover
                  onClick={() => selectNote(note.id)}
                  className={cn(
                    activeNote?.id === note.id && 'ring-2 ring-brand-500 border-brand-500',
                  )}
                >
                  <div className="flex items-start gap-2">
                    {note.isPinned && (
                      <Pin className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" aria-label="Pinned" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-app">{note.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-app-muted">{note.content}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', tagColors[tag])}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] text-app-muted">
                        {formatRelativeTime(note.updatedAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeNote ? (
            <Card className="h-full">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Input
                    value={activeNote.title}
                    onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                    className="text-lg font-semibold"
                    aria-label="Note title"
                  />
                  <a
                    href={activeNote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {activeNote.url}
                  </a>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(activeNote.id)}
                    aria-label={activeNote.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    {activeNote.isPinned ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleArchive(activeNote.id)}
                    aria-label={activeNote.isArchived ? 'Restore note' : 'Archive note'}
                  >
                    {activeNote.isArchived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNote(activeNote.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {(['research', 'security', 'seo', 'meeting', 'idea', 'client', 'personal'] as NoteTag[]).map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const newTags = activeNote.tags.includes(tag)
                          ? activeNote.tags.filter((t) => t !== tag)
                          : [...activeNote.tags, tag]
                        updateNote(activeNote.id, { tags: newTags })
                      }}
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity',
                        tagColors[tag],
                        !activeNote.tags.includes(tag) && 'opacity-40',
                      )}
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </button>
                  ),
                )}
              </div>

              <Textarea
                value={activeNote.content}
                onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                className="min-h-[400px] text-sm leading-relaxed"
                aria-label="Note content"
              />

              <p className="mt-3 text-xs text-app-muted">
                Created {new Date(activeNote.createdAt).toLocaleString()} · Updated{' '}
                {formatRelativeTime(activeNote.updatedAt)}
              </p>
            </Card>
          ) : (
            <EmptyState
              icon={<StickyNote className="h-6 w-6" />}
              title="Select a note"
              description="Choose a note from the list or create a new one to get started."
              action={
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Note
                </Button>
              }
            />
          )}
        </div>
      </div>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Note"
        description="Add a new URL-anchored note"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newNote.title.trim()}>
              Create Note
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            placeholder="Note title"
            autoFocus
          />
          <Input
            label="URL"
            value={newNote.url}
            onChange={(e) => setNewNote({ ...newNote, url: e.target.value })}
            placeholder="https://example.com"
          />
          <Textarea
            label="Content"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            placeholder="Write your note..."
          />
          <div>
            <p className="mb-2 text-sm font-medium text-app">Tags</p>
            <div className="flex flex-wrap gap-2">
              {(['research', 'security', 'seo', 'meeting', 'idea', 'client', 'personal'] as NoteTag[]).map(
                (tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-opacity',
                      tagColors[tag],
                      !newNote.tags.includes(tag) && 'opacity-40',
                    )}
                  >
                    {tag}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
