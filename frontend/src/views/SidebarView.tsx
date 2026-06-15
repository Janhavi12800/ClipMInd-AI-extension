import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Home,
  Sparkles,
  FileText,
  Search,
  Shield,
  StickyNote,
  Settings,
  ChevronLeft,
  Wand2,
  Play,
  Plus,
} from 'lucide-react'
import { tabContext } from '@/data/mockData'
import { useAIStore, useContentStore, useNotesStore, useSecurityStore, useSeoStore } from '@/store'
import { ExtensionBrand, TabContextBar } from '@/components/shared'
import {
  Badge,
  Button,
  Card,
  Input,
  ScoreRing,
  Textarea,
  ThemeToggle,
} from '@/components/ui'
import { cn, getScoreBg } from '@/lib/utils'
import type { SidebarModule } from '@/types'

const navItems: { id: SidebarModule; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'prompts', icon: Sparkles, label: 'Prompts' },
  { id: 'content', icon: FileText, label: 'Content' },
  { id: 'seo', icon: Search, label: 'SEO' },
  { id: 'security', icon: Shield, label: 'Security' },
  { id: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 'settings', icon: Settings, label: 'Settings' },
]

export function SidebarView() {
  const [activeModule, setActiveModule] = useState<SidebarModule>('home')

  return (
    <div className="mx-auto flex h-screen max-h-[720px] w-full max-w-[400px] flex-col border border-app bg-app shadow-app-lg">
      <header className="flex items-center justify-between border-b border-app px-4 py-3">
        <ExtensionBrand size="sm" />
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <Link to="/popup">
            <Button variant="ghost" size="icon" aria-label="Back to popup">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="border-b border-app px-3 py-2">
        <TabContextBar compact />
      </div>

      <nav className="flex border-b border-app px-2 py-1.5 gap-0.5 overflow-x-auto" aria-label="Module navigation">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveModule(id)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 min-w-[52px] transition-colors',
              activeModule === id
                ? 'bg-brand-600/10 text-brand-700 dark:text-brand-400'
                : 'text-app-muted hover:bg-app-tertiary hover:text-app-secondary',
            )}
            aria-current={activeModule === id ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[9px] font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-3">
        {activeModule === 'home' && <SidebarHome onNavigate={setActiveModule} />}
        {activeModule === 'prompts' && <SidebarPrompts />}
        {activeModule === 'content' && <SidebarContent />}
        {activeModule === 'seo' && <SidebarSeo />}
        {activeModule === 'security' && <SidebarSecurity />}
        {activeModule === 'notes' && <SidebarNotes />}
        {activeModule === 'settings' && <SidebarSettings />}
      </main>
    </div>
  )
}

function SidebarHome({ onNavigate }: { onNavigate: (m: SidebarModule) => void }) {
  const { activeScan } = useSecurityStore()
  const { activeReport } = useSeoStore()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Card padding="sm" className="text-center">
          <ScoreRing score={activeScan?.score ?? 91} size={80} strokeWidth={6} label="Security" />
        </Card>
        <Card padding="sm" className="text-center">
          <ScoreRing score={activeReport?.score ?? 82} size={80} strokeWidth={6} label="SEO" />
        </Card>
      </div>

      <Card padding="sm">
        <p className="text-xs font-semibold text-app mb-2">Quick Actions</p>
        <div className="space-y-1.5">
          {[
            { label: 'Generate Prompt', module: 'prompts' as SidebarModule },
            { label: 'Run Security Scan', module: 'security' as SidebarModule },
            { label: 'SEO Audit', module: 'seo' as SidebarModule },
            { label: 'New Note', module: 'notes' as SidebarModule },
          ].map((action) => (
            <button
              key={action.module}
              type="button"
              onClick={() => onNavigate(action.module)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-app-secondary hover:bg-app-tertiary hover:text-app"
            >
              {action.label}
              <ChevronLeft className="h-3 w-3 rotate-180" />
            </button>
          ))}
        </div>
      </Card>

      <Card padding="sm">
        <p className="text-xs font-semibold text-app mb-2">Tech Stack Detected</p>
        <div className="flex flex-wrap gap-1">
          {['React', 'Next.js', 'Vercel', 'Google Analytics', 'Cloudflare'].map((tech) => (
            <Badge key={tech} variant="outline" className="text-[10px]">
              {tech}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SidebarPrompts() {
  const { templates, selectedTemplate, selectTemplate, variableValues, setVariableValue, generatePrompt, generatedPrompt, isGenerating } = useAIStore()

  return (
    <div className="space-y-3">
      <div className="space-y-1.5 max-h-32 overflow-y-auto">
        {templates.slice(0, 4).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTemplate(t)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors',
              selectedTemplate?.id === t.id
                ? 'border-brand-500 bg-brand-600/5'
                : 'border-app hover:bg-app-tertiary',
            )}
          >
            <p className="font-medium text-app">{t.title}</p>
            <p className="text-[10px] text-app-muted">{t.category}</p>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <>
          {selectedTemplate.variables.map((v) => (
            <Input
              key={v}
              label={v.replace(/_/g, ' ')}
              value={variableValues[v] ?? ''}
              onChange={(e) => setVariableValue(v, e.target.value)}
              className="text-xs"
            />
          ))}
          <Button size="sm" fullWidth onClick={generatePrompt} loading={isGenerating}>
            <Wand2 className="h-3.5 w-3.5" />
            Generate
          </Button>
          {generatedPrompt && (
            <Textarea value={generatedPrompt} readOnly className="min-h-[120px] text-xs font-mono" />
          )}
        </>
      )}
    </div>
  )
}

function SidebarContent() {
  const { formData, setFormField, generateContent, activeGeneration, isGenerating } = useContentStore()

  return (
    <div className="space-y-3">
      <Input
        label="Topic"
        value={formData.topic}
        onChange={(e) => setFormField('topic', e.target.value)}
        placeholder="What to write about..."
      />
      <Button size="sm" fullWidth onClick={generateContent} loading={isGenerating} disabled={!formData.topic.trim()}>
        <Wand2 className="h-3.5 w-3.5" />
        Generate Content
      </Button>
      {activeGeneration && (
        <Textarea
          value={activeGeneration.content}
          readOnly
          className="min-h-[200px] text-xs leading-relaxed"
        />
      )}
    </div>
  )
}

function SidebarSeo() {
  const { scanUrl, setScanUrl, runScan, isScanning, activeReport } = useSeoStore()

  return (
    <div className="space-y-3">
      <Input
        value={scanUrl}
        onChange={(e) => setScanUrl(e.target.value)}
        placeholder="URL to analyze"
      />
      <Button size="sm" fullWidth onClick={runScan} loading={isScanning}>
        <Play className="h-3.5 w-3.5" />
        Run SEO Audit
      </Button>
      {activeReport && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-2">
            <ScoreRing score={activeReport.score} size={64} strokeWidth={5} />
            <div className="text-right">
              <p className="text-xs font-semibold text-app">{activeReport.issues.length} issues</p>
              <p className="text-[10px] text-app-muted">found</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {activeReport.issues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="rounded bg-app-tertiary p-2">
                <p className="text-[10px] font-medium text-app">{issue.title}</p>
                <Badge variant={issue.impact === 'high' ? 'danger' : 'warning'} className="mt-1 text-[9px]">
                  {issue.impact}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function SidebarSecurity() {
  const { scanUrl, setScanUrl, runScan, isScanning, activeScan } = useSecurityStore()

  return (
    <div className="space-y-3">
      <Input
        value={scanUrl}
        onChange={(e) => setScanUrl(e.target.value)}
        placeholder="URL to scan"
      />
      <Button size="sm" fullWidth onClick={runScan} loading={isScanning}>
        <Play className="h-3.5 w-3.5" />
        Run Security Scan
      </Button>
      {activeScan && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-2">
            <ScoreRing score={activeScan.score} size={64} strokeWidth={5} />
            <Badge className={cn('text-[10px]', getScoreBg(activeScan.score))}>
              {activeScan.riskLevel}
            </Badge>
          </div>
          <div className="space-y-1.5">
            {activeScan.findings.slice(0, 4).map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded bg-app-tertiary p-2">
                <p className="text-[10px] font-medium text-app truncate">{f.title}</p>
                <Badge
                  variant={f.status === 'pass' ? 'success' : f.status === 'fail' ? 'danger' : 'warning'}
                  className="text-[9px] shrink-0 ml-2"
                >
                  {f.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function SidebarNotes() {
  const { getFilteredNotes, createNote, activeNote, selectNote } = useNotesStore()
  const notes = getFilteredNotes().slice(0, 5)

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        fullWidth
        onClick={() =>
          createNote({
            title: 'Quick Note',
            content: '',
            url: tabContext.url,
            tags: ['personal'],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Quick Note
      </Button>
      <div className="space-y-1.5">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => selectNote(note.id)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left transition-colors',
              activeNote?.id === note.id
                ? 'border-brand-500 bg-brand-600/5'
                : 'border-app hover:bg-app-tertiary',
            )}
          >
            <p className="text-xs font-medium text-app truncate">{note.title}</p>
            <p className="text-[10px] text-app-muted line-clamp-1">{note.content}</p>
          </button>
        ))}
      </div>
      {activeNote && (
        <Textarea
          value={activeNote.content}
          readOnly
          className="min-h-[100px] text-xs"
        />
      )}
    </div>
  )
}

function SidebarSettings() {
  return (
    <div className="space-y-3">
      <Card padding="sm">
        <p className="text-xs font-semibold text-app mb-2">Extension</p>
        <p className="text-[10px] text-app-muted">Version 1.0.0 · Synced</p>
      </Card>
      <Link to="/settings">
        <Button variant="outline" size="sm" fullWidth>
          Open Full Settings
        </Button>
      </Link>
      <Link to="/">
        <Button variant="outline" size="sm" fullWidth>
          Open Dashboard
        </Button>
      </Link>
    </div>
  )
}
