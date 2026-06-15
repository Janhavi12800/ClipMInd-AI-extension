import { sendToBackground } from '../lib/messaging'
import { applyTheme, initTabs, showLoading, showError, scoreColor, formatDate, copyToClipboard } from '../ui/helpers'
import { PROMPT_CATEGORIES } from '../modules/ai/templates'
import type { PromptEntry, Note, SecurityScanResult, SeoResult, TechResult } from '../lib/types'

let selectedTemplate: import('../lib/types').PromptTemplate | null = null
let currentTab = { url: '', title: '', domain: '' }

async function init(): Promise<void> {
  await applyTheme()
  initTabs(document.getElementById('app')!)

  try {
    currentTab = await sendToBackground('GET_TAB_INFO')
    document.getElementById('tab-badge')!.textContent = currentTab.domain
  } catch { /* ignore */ }

  renderHome()
  renderAI()
  renderSecurity()
  renderSEO()
  renderTech()
  renderNotes()
  renderProductivity()
}

// ─── Home ───────────────────────────────────────────────
async function renderHome(): Promise<void> {
  const panel = document.getElementById('panel-home')!
  showLoading(panel)

  try {
    const data = await sendToBackground<undefined, {
      security: SecurityScanResult; seo: SeoResult; tech: TechResult
      phishing: { riskScore: number; action: string; signals: Array<{ detail: string }> }
    }>('ANALYZE_PAGE')

    panel.innerHTML = `
      <div class="grid-2" style="margin-bottom:12px">
        <div class="card" style="text-align:center">
          <div class="score-value" style="color:${scoreColor(data.security.score)}">${data.security.score}</div>
          <div class="score-label">Security</div>
          <span class="badge badge-${data.security.riskLevel === 'low' ? 'success' : 'warning'}">${data.security.riskLevel}</span>
        </div>
        <div class="card" style="text-align:center">
          <div class="score-value" style="color:${scoreColor(data.seo.score)}">${data.seo.score}</div>
          <div class="score-label">SEO</div>
        </div>
      </div>
      ${data.phishing.action !== 'allow' ? `<div class="card" style="border-left:3px solid var(--danger);margin-bottom:12px">
        <strong>⚠️ Phishing Risk (${data.phishing.riskScore})</strong>
        <p style="font-size:11px;margin-top:4px">${data.phishing.signals.map(s => s.detail).join('. ')}</p>
      </div>` : ''}
      <div class="card">
        <strong>Tech Stack (${data.tech.technologies.length})</strong>
        <div style="margin-top:8px">${data.tech.technologies.slice(0, 8).map(t =>
          `<span class="tech-tag">${t.name}</span>`).join('') || '<span class="text-muted">None detected</span>'}
        </div>
      </div>
      <div class="card" style="margin-top:8px">
        <strong>Quick Actions</strong>
        <div class="actions">
          <button class="btn-secondary btn-sm" onclick="document.querySelector('[data-panel=panel-security]')?.click()">Security Scan</button>
          <button class="btn-secondary btn-sm" onclick="document.querySelector('[data-panel=panel-ai]')?.click()">AI Prompts</button>
          <button class="btn-secondary btn-sm" onclick="document.querySelector('[data-panel=panel-notes]')?.click()">New Note</button>
        </div>
      </div>`
  } catch (err) {
    showError(panel, String(err))
  }
}

// ─── AI Module ──────────────────────────────────────────
function renderAI(): void {
  const panel = document.getElementById('panel-ai')!
  panel.innerHTML = `
    <div class="sub-tabs" id="ai-subtabs">
      <button class="sub-tab active" data-ai="generator">Generator</button>
      <button class="sub-tab" data-ai="enhancer">Enhancer</button>
      <button class="sub-tab" data-ai="library">Library</button>
    </div>
    <div id="ai-content"></div>`

  const subtabs = panel.querySelectorAll('.sub-tab')
  subtabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      subtabs.forEach((t) => t.classList.remove('active'))
      tab.classList.add('active')
      const view = tab.getAttribute('data-ai')
      if (view === 'generator') renderPromptGenerator()
      else if (view === 'enhancer') renderPromptEnhancer()
      else renderPromptLibrary()
    })
  })

  renderPromptGenerator()
}

async function renderPromptGenerator(): Promise<void> {
  const container = document.getElementById('ai-content')!
  const { getTemplates } = await import('../modules/ai/prompts')
  const tpls = getTemplates()

  container.innerHTML = `
    <div class="form-group">
      <label>Category</label>
      <select id="tpl-category">${PROMPT_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select>
    </div>
    <div id="template-list"></div>
    <div id="variable-form"></div>
    <div id="prompt-output"></div>`

  const listEl = document.getElementById('template-list')!

  function renderTemplates(category: string): void {
    const filtered = category === 'All' ? tpls : tpls.filter(t => t.category === category)
    listEl.innerHTML = filtered.map(t => `
      <div class="template-card" data-id="${t.id}">
        <strong>${t.title}</strong>
        <p style="font-size:10px;color:var(--text-muted)">${t.description}</p>
      </div>`).join('')

    listEl.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', () => {
        listEl.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'))
        card.classList.add('selected')
        selectedTemplate = tpls.find(t => t.id === card.getAttribute('data-id')) ?? null
        renderVariableForm()
      })
    })
  }

  document.getElementById('tpl-category')!.addEventListener('change', (e) => {
    renderTemplates((e.target as HTMLSelectElement).value)
  })

  renderTemplates('All')
}

function renderVariableForm(): void {
  const formEl = document.getElementById('variable-form')!
  if (!selectedTemplate) { formEl.innerHTML = ''; return }

  formEl.innerHTML = `
    <div style="margin-top:10px">
      ${selectedTemplate.variables.map(v => `
        <div class="form-group">
          <label>${v.replace(/_/g, ' ')}</label>
          <input type="text" id="var-${v}" placeholder="Enter ${v}" />
        </div>`).join('')}
      <button class="btn-primary" id="btn-generate">Generate Prompt</button>
    </div>`

  document.getElementById('btn-generate')!.addEventListener('click', async () => {
    const variables: Record<string, string> = {}
    selectedTemplate!.variables.forEach(v => {
      variables[v] = (document.getElementById(`var-${v}`) as HTMLInputElement).value
    })
    const result = await sendToBackground('GENERATE_PROMPT', { templateId: selectedTemplate!.id, variables })
    const output = document.getElementById('prompt-output')!
    output.innerHTML = `
      <div class="output-box">${(result as { output: string }).output}</div>
      <div class="actions">
        <button class="btn-secondary btn-sm" id="btn-copy">Copy</button>
        <button class="btn-secondary btn-sm" id="btn-save">Save to Library</button>
      </div>`
    document.getElementById('btn-copy')!.addEventListener('click', () => copyToClipboard((result as { output: string }).output))
    document.getElementById('btn-save')!.addEventListener('click', async () => {
      await sendToBackground('SAVE_PROMPT', { title: selectedTemplate!.title, content: (result as { output: string }).output, category: selectedTemplate!.category })
      alert('Saved to library!')
    })
  })
}

function renderPromptEnhancer(): void {
  document.getElementById('ai-content')!.innerHTML = `
    <div class="form-group"><label>Your Prompt</label><textarea id="enhance-input" rows="4" placeholder="Paste your rough prompt..."></textarea></div>
    <div class="form-group"><label>Tone</label><select id="enhance-tone"><option>Professional</option><option>Friendly</option><option>Technical</option><option>Persuasive</option></select></div>
    <div class="form-group"><label>Audience</label><input id="enhance-audience" placeholder="e.g., IT directors" /></div>
    <button class="btn-primary" id="btn-enhance">Enhance Prompt</button>
    <div id="enhance-output"></div>`

  document.getElementById('btn-enhance')!.addEventListener('click', async () => {
    const input = (document.getElementById('enhance-input') as HTMLTextAreaElement).value
    if (!input.trim()) return
    const result = await sendToBackground('ENHANCE_PROMPT', {
      input,
      tone: (document.getElementById('enhance-tone') as HTMLSelectElement).value,
      audience: (document.getElementById('enhance-audience') as HTMLInputElement).value,
    })
    document.getElementById('enhance-output')!.innerHTML = `
      <div class="output-box">${(result as { output: string }).output}</div>
      <button class="btn-secondary btn-sm" style="margin-top:6px" id="btn-copy-enhanced">Copy</button>`
    document.getElementById('btn-copy-enhanced')!.addEventListener('click', () => copyToClipboard((result as { output: string }).output))
  })
}

async function renderPromptLibrary(): Promise<void> {
  const container = document.getElementById('ai-content')!
  const library = await sendToBackground<undefined, PromptEntry[]>('GET_PROMPT_LIBRARY')

  if (!library.length) {
    container.innerHTML = '<div class="empty"><div class="empty-icon">📚</div><p>No saved prompts yet</p></div>'
    return
  }

  container.innerHTML = library.map(p => `
    <div class="card" style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between">
        <strong>${p.title}</strong>
        <button class="btn-danger btn-sm" data-delete="${p.id}">✕</button>
      </div>
      <p style="font-size:11px;margin:4px 0;color:var(--text-secondary)">${p.content.slice(0, 120)}...</p>
      <span class="badge badge-info">${p.category}</span>
      <span style="font-size:10px;color:var(--text-muted);margin-left:6px">${formatDate(p.updatedAt)}</span>
    </div>`).join('')

  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await sendToBackground('DELETE_PROMPT', { id: btn.getAttribute('data-delete') })
      renderPromptLibrary()
    })
  })
}

// ─── Security ───────────────────────────────────────────
async function renderSecurity(): Promise<void> {
  const panel = document.getElementById('panel-security')!
  showLoading(panel, 'Scanning...')

  try {
    const [security, phishing, malware] = await Promise.all([
      sendToBackground('RUN_SECURITY_SCAN'),
      sendToBackground('CHECK_PHISHING'),
      sendToBackground('CHECK_MALWARE'),
    ]) as [SecurityScanResult, { riskScore: number; action: string; signals: Array<{ detail: string }> }, { isThreat: boolean; riskLevel: string; signals: Array<{ detail: string }> }]

    panel.innerHTML = `
      <div class="card" style="text-align:center;margin-bottom:12px">
        <div class="score-value" style="color:${scoreColor(security.score)}">${security.score}</div>
        <div class="score-label">Security Score</div>
      </div>
      <div class="card" style="margin-bottom:8px">
        <strong>Phishing: ${phishing.riskScore}/100</strong> <span class="badge badge-${phishing.action === 'allow' ? 'success' : 'danger'}">${phishing.action}</span>
        ${phishing.signals.map(s => `<p style="font-size:11px;margin-top:4px">• ${s.detail}</p>`).join('')}
      </div>
      <div class="card" style="margin-bottom:8px">
        <strong>Malware: ${malware.isThreat ? '⚠️ Threat' : '✅ Clear'}</strong>
        ${malware.signals.map(s => `<p style="font-size:11px;margin-top:4px">• ${s.detail}</p>`).join('')}
      </div>
      <strong>Findings (${security.findings.length})</strong>
      ${security.findings.map(f => `
        <div class="issue-item ${f.severity === 'fail' ? 'error' : f.severity === 'warn' ? 'warning' : 'info'}">
          <strong>${f.title}</strong>
          <p style="font-size:11px">${f.description}</p>
          <p style="font-size:10px;color:var(--text-muted);margin-top:2px">→ ${f.recommendation}</p>
        </div>`).join('')}`
  } catch (err) {
    showError(panel, String(err))
  }
}

// ─── SEO ──────────────────────────────────────────────
async function renderSEO(): Promise<void> {
  const panel = document.getElementById('panel-seo')!
  showLoading(panel, 'Analyzing SEO...')

  try {
    const seo = await sendToBackground<undefined, SeoResult>('RUN_SEO_ANALYSIS')

    panel.innerHTML = `
      <div class="card" style="text-align:center;margin-bottom:12px">
        <div class="score-value" style="color:${scoreColor(seo.score)}">${seo.score}</div>
        <div class="score-label">SEO Score</div>
      </div>
      <div class="sub-tabs"><button class="sub-tab active">Meta Tags</button></div>
      <div class="card" style="margin-bottom:8px">
        <p><strong>Title:</strong> ${seo.meta.title} (${seo.meta.titleLength} chars)</p>
        <p style="margin-top:4px"><strong>Description:</strong> ${seo.meta.description || '—'} (${seo.meta.descriptionLength} chars)</p>
        <p style="margin-top:4px"><strong>Canonical:</strong> ${seo.meta.canonical || '—'}</p>
        <p style="margin-top:4px"><strong>Robots:</strong> ${seo.meta.robots || '—'}</p>
      </div>
      <strong>Headings</strong>
      <div class="card" style="margin:8px 0">
        <p>H1 (${seo.headings.h1.length}): ${seo.headings.h1.join(', ') || '—'}</p>
        <p style="margin-top:4px">H2 (${seo.headings.h2.length}): ${seo.headings.h2.slice(0, 3).join(', ')}${seo.headings.h2.length > 3 ? '...' : ''}</p>
      </div>
      <strong>Issues (${seo.issues.length})</strong>
      ${seo.issues.map(i => `
        <div class="issue-item ${i.type}">
          <strong>${i.title}</strong> <span class="badge badge-${i.impact === 'high' ? 'danger' : 'warning'}">${i.impact}</span>
          <p style="font-size:11px">${i.description}</p>
        </div>`).join('')}`
  } catch (err) {
    showError(panel, String(err))
  }
}

// ─── Tech ─────────────────────────────────────────────
async function renderTech(): Promise<void> {
  const panel = document.getElementById('panel-tech')!
  showLoading(panel, 'Detecting technologies...')

  try {
    const tech = await sendToBackground<undefined, TechResult>('RUN_TECH_DETECTION')

    panel.innerHTML = `
      <div class="card" style="margin-bottom:8px">
        <strong>CMS (${tech.cms.length})</strong>
        <div style="margin-top:6px">${tech.cms.map(t => `<span class="tech-tag">${t.name}${t.version ? ' ' + t.version : ''}</span>`).join('') || '<span style="color:var(--text-muted)">None detected</span>'}</div>
      </div>
      <div class="card" style="margin-bottom:8px">
        <strong>Frameworks (${tech.frameworks.length})</strong>
        <div style="margin-top:6px">${tech.frameworks.map(t => `<span class="tech-tag">${t.name}</span>`).join('') || '<span style="color:var(--text-muted)">None detected</span>'}</div>
      </div>
      <strong>All Technologies (${tech.technologies.length})</strong>
      <div style="margin-top:8px">
        ${tech.technologies.map(t => `
          <div class="card" style="margin-bottom:4px;padding:8px;display:flex;justify-content:space-between">
            <span>${t.name}</span>
            <span class="badge badge-info">${t.category}</span>
          </div>`).join('') || '<div class="empty">No technologies detected</div>'}
      </div>`
  } catch (err) {
    showError(panel, String(err))
  }
}

// ─── Notes ────────────────────────────────────────────
async function renderNotes(): Promise<void> {
  const panel = document.getElementById('panel-notes')!
  const notes = await sendToBackground<{ url?: string }, Note[]>('GET_NOTES', { url: currentTab.url })

  panel.innerHTML = `
    <button class="btn-primary btn-sm" id="btn-new-note" style="margin-bottom:10px">+ New Note</button>
    <div id="notes-list">${notes.length ? notes.map(n => `
      <div class="note-item" data-id="${n.id}">
        <strong>${n.title}</strong>
        <p style="font-size:11px;color:var(--text-muted)">${n.content.slice(0, 80)}...</p>
      </div>`).join('') : '<div class="empty">No notes for this page</div>'}
    </div>
    <div id="note-editor"></div>`

  document.getElementById('btn-new-note')!.addEventListener('click', () => {
    document.getElementById('note-editor')!.innerHTML = `
      <div class="card" style="margin-top:10px">
        <div class="form-group"><label>Title</label><input id="note-title" /></div>
        <div class="form-group"><label>Content</label><textarea id="note-content" rows="4"></textarea></div>
        <button class="btn-primary btn-sm" id="btn-save-note">Save</button>
      </div>`
    document.getElementById('btn-save-note')!.addEventListener('click', async () => {
      await sendToBackground('SAVE_NOTE', {
        title: (document.getElementById('note-title') as HTMLInputElement).value,
        content: (document.getElementById('note-content') as HTMLTextAreaElement).value,
        url: currentTab.url,
        tags: ['research'],
      })
      renderNotes()
    })
  })
}

// ─── Productivity ───────────────────────────────────────
async function renderProductivity(): Promise<void> {
  const panel = document.getElementById('panel-productivity')!
  const data = await sendToBackground('GET_PRODUCTIVITY') as {
    snippets: Array<{ id: string; trigger: string; content: string }>
    tasks: Array<{ id: string; text: string; completed: boolean }>
    pomodoroMinutes: number; pomodoroActive: boolean; pomodoroEndTime?: number
  }

  panel.innerHTML = `
    <div class="card" style="margin-bottom:10px">
      <strong>🍅 Focus Timer</strong>
      <div class="timer-display" id="timer-display">${data.pomodoroActive && data.pomodoroEndTime ? formatTimer(data.pomodoroEndTime - Date.now()) : data.pomodoroMinutes + ':00'}</div>
      <div class="actions" style="justify-content:center">
        <button class="btn-primary btn-sm" id="btn-start-timer">Start</button>
        <button class="btn-secondary btn-sm" id="btn-stop-timer">Stop</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:10px">
      <strong>Snippets</strong>
      <div class="form-group" style="margin-top:8px"><input id="snippet-trigger" placeholder="Trigger (e.g., sig)" /></div>
      <div class="form-group"><textarea id="snippet-content" rows="2" placeholder="Snippet content"></textarea></div>
      <button class="btn-secondary btn-sm" id="btn-save-snippet">Add Snippet</button>
      ${data.snippets.map(s => `<p style="font-size:11px;margin-top:6px"><code>${s.trigger}</code> → ${s.content.slice(0, 40)}</p>`).join('')}
    </div>
    <div class="card">
      <strong>Tasks</strong>
      <div class="form-group" style="margin-top:8px"><input id="task-input" placeholder="Quick task..." /></div>
      <button class="btn-secondary btn-sm" id="btn-add-task">Add Task</button>
      ${data.tasks.map(t => `<label style="display:flex;gap:6px;margin-top:6px;font-size:12px">
        <input type="checkbox" data-task="${t.id}" ${t.completed ? 'checked' : ''} /> ${t.text}</label>`).join('')}
    </div>`

  document.getElementById('btn-start-timer')!.addEventListener('click', () =>
    sendToBackground('SET_PRODUCTIVITY', { action: 'start_pomodoro' }).then(renderProductivity))
  document.getElementById('btn-stop-timer')!.addEventListener('click', () =>
    sendToBackground('SET_PRODUCTIVITY', { action: 'stop_pomodoro' }).then(renderProductivity))
  document.getElementById('btn-save-snippet')!.addEventListener('click', async () => {
    await sendToBackground('SET_PRODUCTIVITY', {
      action: 'save_snippet',
      data: { trigger: (document.getElementById('snippet-trigger') as HTMLInputElement).value, content: (document.getElementById('snippet-content') as HTMLTextAreaElement).value },
    })
    renderProductivity()
  })
  document.getElementById('btn-add-task')!.addEventListener('click', async () => {
    await sendToBackground('SET_PRODUCTIVITY', {
      action: 'add_task',
      data: { text: (document.getElementById('task-input') as HTMLInputElement).value },
    })
    renderProductivity()
  })
  panel.querySelectorAll('[data-task]').forEach(cb => {
    cb.addEventListener('change', () =>
      sendToBackground('SET_PRODUCTIVITY', { action: 'toggle_task', data: { id: cb.getAttribute('data-task') } }).then(renderProductivity))
  })
}

function formatTimer(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const secs = Math.max(0, Math.floor((ms % 60000) / 1000))
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

init()
