import { useState } from 'react'
import {
  Copy,
  Check,
  Star,
  Trash2,
  Wand2,
  Bookmark,
} from 'lucide-react'
import { promptCategories } from '@/data/mockData'
import { useAIStore } from '@/store'
import { PageHeader } from '@/components/layout'
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  Tabs,
  Textarea,
} from '@/components/ui'
import { cn } from '@/lib/utils'

export function PromptGeneratorPage() {
  const {
    templates,
    savedPrompts,
    selectedTemplate,
    generatedPrompt,
    isGenerating,
    selectedCategory,
    variableValues,
    setSelectedCategory,
    selectTemplate,
    setVariableValue,
    toggleFavorite,
    generatePrompt,
    savePrompt,
    deleteSavedPrompt,
  } = useAIStore()

  const [activeTab, setActiveTab] = useState('templates')
  const [copied, setCopied] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')

  const filteredTemplates =
    selectedCategory === 'All'
      ? templates
      : templates.filter((t) => t.category === selectedCategory)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (saveTitle.trim()) {
      savePrompt(saveTitle.trim())
      setSaveModalOpen(false)
      setSaveTitle('')
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Prompt Generator"
        description="Create structured prompts from enterprise templates with variable substitution"
      />

      <Tabs
        tabs={[
          { id: 'templates', label: 'Templates', count: filteredTemplates.length },
          { id: 'saved', label: 'Saved Prompts', count: savedPrompts.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'templates' && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {promptCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white'
                      : 'bg-app-tertiary text-app-secondary hover:text-app',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  padding="sm"
                  hover
                  onClick={() => selectTemplate(template)}
                  className={cn(
                    selectedTemplate?.id === template.id &&
                      'ring-2 ring-brand-500 border-brand-500',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-app">{template.title}</p>
                      <p className="mt-1 text-xs text-app-muted line-clamp-2">
                        {template.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline">{template.category}</Badge>
                        <span className="text-xs text-app-muted">
                          {template.usageCount} uses
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(template.id)
                      }}
                      className="shrink-0 rounded-md p-1 text-app-muted hover:text-amber-500"
                      aria-label={template.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          template.isFavorite && 'fill-amber-500 text-amber-500',
                        )}
                      />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            {selectedTemplate ? (
              <>
                <Card>
                  <CardHeader className="mb-0">
                    <div>
                      <CardTitle>{selectedTemplate.title}</CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader className="mb-2">
                    <CardTitle className="text-sm">Template Variables</CardTitle>
                  </CardHeader>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedTemplate.variables.map((variable) => (
                      <Input
                        key={variable}
                        label={variable.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        value={variableValues[variable] ?? ''}
                        onChange={(e) => setVariableValue(variable, e.target.value)}
                        placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={generatePrompt} loading={isGenerating}>
                      <Wand2 className="h-4 w-4" />
                      Generate Prompt
                    </Button>
                  </div>
                </Card>

                {(generatedPrompt || isGenerating) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Generated Prompt</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          disabled={!generatedPrompt}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSaveModalOpen(true)}
                          disabled={!generatedPrompt}
                        >
                          <Bookmark className="h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </CardHeader>
                    <Textarea
                      value={generatedPrompt}
                      readOnly
                      className="min-h-[200px] font-mono text-sm"
                      aria-label="Generated prompt output"
                    />
                    {isGenerating && (
                      <p className="mt-2 text-xs text-app-muted" aria-live="polite">
                        Generating prompt...
                      </p>
                    )}
                  </Card>
                )}
              </>
            ) : (
              <EmptyState
                icon={<Wand2 className="h-6 w-6" />}
                title="Select a template"
                description="Choose a prompt template from the left panel to configure variables and generate your prompt."
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedPrompts.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-6 w-6" />}
              title="No saved prompts"
              description="Generate and save prompts from templates to access them here."
            />
          ) : (
            savedPrompts.map((prompt) => (
              <Card key={prompt.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-app">{prompt.title}</p>
                      <Badge variant="outline">{prompt.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-app-secondary line-clamp-3">
                      {prompt.content}
                    </p>
                    <p className="mt-2 text-xs text-app-muted">
                      Updated {new Date(prompt.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSavedPrompt(prompt.id)}
                    aria-label={`Delete ${prompt.title}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Prompt"
        description="Give your prompt a memorable name"
        footer={
          <>
            <Button variant="outline" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!saveTitle.trim()}>
              Save Prompt
            </Button>
          </>
        }
      >
        <Input
          label="Prompt Name"
          value={saveTitle}
          onChange={(e) => setSaveTitle(e.target.value)}
          placeholder="e.g., Q3 Launch Blog Prompt"
          autoFocus
        />
      </Modal>
    </div>
  )
}
