import { useState } from 'react'
import {
  Copy,
  Check,
  Trash2,
  Wand2,
  FileText,
  Archive,
} from 'lucide-react'
import { useContentStore } from '@/store'
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
  Select,
  Textarea,
} from '@/components/ui'
import { cn } from '@/lib/utils'

export function ContentGeneratorPage() {
  const {
    generations,
    activeGeneration,
    isGenerating,
    formData,
    contentTypes,
    toneOptions,
    setFormField,
    generateContent,
    selectGeneration,
    updateContent,
    deleteGeneration,
    setStatus,
  } = useContentStore()

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!activeGeneration) return
    await navigator.clipboard.writeText(activeGeneration.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <PageHeader
        title="AI Content Generator"
        description="Generate blog posts, emails, social content, and marketing copy with brand-consistent tone"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="mb-2">
              <CardTitle>Content Settings</CardTitle>
              <CardDescription>Configure your content generation parameters</CardDescription>
            </CardHeader>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-app">Content Type</p>
                <div className="grid gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setFormField('type', type.id as typeof formData.type)
                      }
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                        formData.type === type.id
                          ? 'border-brand-500 bg-brand-600/5 ring-1 ring-brand-500'
                          : 'border-app hover:bg-app-tertiary',
                      )}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                      <div>
                        <p className="text-sm font-medium text-app">{type.label}</p>
                        <p className="text-xs text-app-muted">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Topic"
                value={formData.topic}
                onChange={(e) => setFormField('topic', e.target.value)}
                placeholder="e.g., Enterprise Web Security Best Practices"
              />

              <Input
                label="Target Audience"
                value={formData.audience}
                onChange={(e) => setFormField('audience', e.target.value)}
                placeholder="e.g., IT directors at mid-market companies"
              />

              <Input
                label="Keywords (optional)"
                value={formData.keywords}
                onChange={(e) => setFormField('keywords', e.target.value)}
                placeholder="e.g., zero-trust, phishing, SOC 2"
              />

              <Select
                label="Tone"
                value={formData.tone}
                onChange={(v) => setFormField('tone', v)}
                options={toneOptions.map((t) => ({ value: t, label: t }))}
              />

              <Input
                label="Target Word Count"
                type="number"
                value={formData.wordCount.toString()}
                onChange={(e) => setFormField('wordCount', parseInt(e.target.value) || 500)}
                min={100}
                max={5000}
              />

              <Button
                onClick={generateContent}
                loading={isGenerating}
                fullWidth
                disabled={!formData.topic.trim()}
              >
                <Wand2 className="h-4 w-4" />
                Generate Content
              </Button>
            </div>
          </Card>

          <Card padding="none">
            <CardHeader className="border-b border-app px-4 py-3 mb-0">
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <ul className="max-h-64 overflow-y-auto divide-y divide-[var(--border-default)]" role="list">
              {generations.map((gen) => (
                <li key={gen.id}>
                  <button
                    type="button"
                    onClick={() => selectGeneration(gen.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-app-tertiary',
                      activeGeneration?.id === gen.id && 'bg-brand-600/5',
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-app">{gen.title}</p>
                      <p className="text-xs text-app-muted">
                        {gen.wordCount} words · {gen.tone}
                      </p>
                    </div>
                    <Badge
                      variant={
                        gen.status === 'completed'
                          ? 'success'
                          : gen.status === 'draft'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {gen.status}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {activeGeneration ? (
            <Card className="h-full">
              <CardHeader>
                <div>
                  <CardTitle>{activeGeneration.title}</CardTitle>
                  <CardDescription>
                    {activeGeneration.wordCount} words · {activeGeneration.tone} tone ·{' '}
                    {activeGeneration.type}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={isGenerating}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  {activeGeneration.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(activeGeneration.id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                  {activeGeneration.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStatus(activeGeneration.id, 'archived')}
                    >
                      <Archive className="h-4 w-4" />
                      Archive
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGeneration(activeGeneration.id)}
                    aria-label="Delete content"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <Textarea
                value={activeGeneration.content}
                onChange={(e) => updateContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm leading-relaxed"
                disabled={isGenerating}
                aria-label="Generated content editor"
              />
              {isGenerating && (
                <p className="mt-2 text-xs text-app-muted" aria-live="polite">
                  Generating content...
                </p>
              )}
            </Card>
          ) : (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No content generated yet"
              description="Configure your content settings and click Generate to create AI-powered copy."
              action={
                <Button onClick={generateContent} disabled={!formData.topic.trim()}>
                  <Wand2 className="h-4 w-4" />
                  Generate Content
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
