export function $(selector: string, parent: ParentNode = document): HTMLElement | null {
  return parent.querySelector(selector)
}

export function $$(selector: string, parent: ParentNode = document): NodeListOf<HTMLElement> {
  return parent.querySelectorAll(selector)
}

export function el(tag: string, attrs: Record<string, string> = {}, children: (Node | string)[] = []): HTMLElement {
  const element = document.createElement(tag)
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') element.className = v
    else if (k === 'textContent') element.textContent = v
    else if (k === 'innerHTML') element.innerHTML = v
    else element.setAttribute(k, v)
  })
  children.forEach((c) => element.appendChild(typeof c === 'string' ? document.createTextNode(c) : c))
  return element
}

export function showLoading(container: HTMLElement, message = 'Loading...'): void {
  container.innerHTML = `<div class="loading"><div class="spinner"></div>${message}</div>`
}

export function showError(container: HTMLElement, message: string): void {
  container.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><p>${message}</p></div>`
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 60) return 'var(--warning)'
  return 'var(--danger)'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export async function applyTheme(): Promise<void> {
  const { sendToBackground } = await import('../lib/messaging')
  try {
    const settings = await sendToBackground<undefined, { theme: string }>('GET_SETTINGS')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark)
    document.documentElement.classList.toggle('dark', isDark)
  } catch { /* use default light */ }
}

export function initTabs(container: HTMLElement): void {
  const tabs = container.querySelectorAll('.tab')
  const panels = container.querySelectorAll('.panel')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-panel')
      tabs.forEach((t) => t.classList.remove('active'))
      panels.forEach((p) => p.classList.remove('active'))
      tab.classList.add('active')
      container.querySelector(`#${target}`)?.classList.add('active')
    })
  })
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}
