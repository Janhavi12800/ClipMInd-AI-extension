import { create } from 'zustand'
import { promptTemplates, savedPrompts } from '@/data/mockData'
import { generateId } from '@/lib/utils'
import type { PromptTemplate, SavedPrompt } from '@/types'

interface AIState {
  templates: PromptTemplate[]
  savedPrompts: SavedPrompt[]
  selectedTemplate: PromptTemplate | null
  generatedPrompt: string
  isGenerating: boolean
  selectedCategory: string
  variableValues: Record<string, string>

  setSelectedCategory: (category: string) => void
  selectTemplate: (template: PromptTemplate | null) => void
  setVariableValue: (key: string, value: string) => void
  toggleFavorite: (id: string) => void
  generatePrompt: () => void
  savePrompt: (title: string) => void
  deleteSavedPrompt: (id: string) => void
}

export const useAIStore = create<AIState>((set, get) => ({
  templates: promptTemplates,
  savedPrompts,
  selectedTemplate: null,
  generatedPrompt: '',
  isGenerating: false,
  selectedCategory: 'All',
  variableValues: {},

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  selectTemplate: (template) => {
    if (!template) {
      set({ selectedTemplate: null, generatedPrompt: '', variableValues: {} })
      return
    }
    const defaults: Record<string, string> = {}
    template.variables.forEach((v) => {
      defaults[v] = ''
    })
    set({ selectedTemplate: template, variableValues: defaults, generatedPrompt: '' })
  },

  setVariableValue: (key, value) =>
    set((state) => ({
      variableValues: { ...state.variableValues, [key]: value },
    })),

  toggleFavorite: (id) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t,
      ),
    })),

  generatePrompt: () => {
    const { selectedTemplate, variableValues } = get()
    if (!selectedTemplate) return

    set({ isGenerating: true, generatedPrompt: '' })

    let result = selectedTemplate.template
    Object.entries(variableValues).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`)
    })

    let index = 0
    const interval = setInterval(() => {
      index += 3
      if (index >= result.length) {
        set({ generatedPrompt: result, isGenerating: false })
        clearInterval(interval)
      } else {
        set({ generatedPrompt: result.slice(0, index) })
      }
    }, 20)
  },

  savePrompt: (title) => {
    const { generatedPrompt } = get()
    if (!generatedPrompt) return

    const newPrompt: SavedPrompt = {
      id: generateId(),
      title,
      content: generatedPrompt,
      category: get().selectedTemplate?.category ?? 'Custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set((state) => ({
      savedPrompts: [newPrompt, ...state.savedPrompts],
    }))
  },

  deleteSavedPrompt: (id) =>
    set((state) => ({
      savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
    })),
}))
