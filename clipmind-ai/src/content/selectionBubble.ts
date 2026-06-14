interface PageContext {
  pageUrl: string;
  pageTitle: string;
  domain: string;
}

export class SelectionBubble {
  private container: HTMLDivElement | null = null;
  private toast: HTMLDivElement | null = null;
  private currentText = '';
  private pageContext: PageContext | null = null;
  private projectPickerOpen = false;

  containsTarget(node: Node): boolean {
    return !!this.container?.contains(node);
  }

  show(rect: DOMRect, text: string, context: PageContext): void {
    this.currentText = text;
    this.pageContext = context;
    this.projectPickerOpen = false;

    if (!this.container) {
      this.container = this.createBubble();
      document.body.appendChild(this.container);
    }

    this.renderButtons();
    this.positionBubble(rect);
    this.container.style.display = 'flex';
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
    this.projectPickerOpen = false;
  }

  showToast(message: string, type: 'success' | 'warning' | 'error'): void {
    if (this.toast) this.toast.remove();

    this.toast = document.createElement('div');
    this.toast.className = `clipmind-toast clipmind-toast--${type}`;
    this.toast.textContent = message;
    document.body.appendChild(this.toast);

    requestAnimationFrame(() => this.toast?.classList.add('clipmind-toast--visible'));

    setTimeout(() => {
      this.toast?.classList.remove('clipmind-toast--visible');
      setTimeout(() => this.toast?.remove(), 300);
    }, 2500);
  }

  private createBubble(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'clipmind-bubble';
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    return el;
  }

  private renderButtons(): void {
    if (!this.container) return;

    if (this.projectPickerOpen) {
      this.renderProjectPicker();
      return;
    }

    this.container.innerHTML = `
      <div class="clipmind-bubble__brand">
        <span class="clipmind-bubble__logo">✦</span>
        <span>ClipMind</span>
      </div>
      <div class="clipmind-bubble__actions">
        <button class="clipmind-bubble__btn" data-action="save" title="Save">
          <span>💾</span> Save
        </button>
        <button class="clipmind-bubble__btn clipmind-bubble__btn--primary" data-action="summarize" title="Save + Summarize">
          <span>✨</span> Summarize
        </button>
        <button class="clipmind-bubble__btn" data-action="explain" title="Explain">
          <span>💡</span> Explain
        </button>
        <button class="clipmind-bubble__btn" data-action="project" title="Add to Project">
          <span>📁</span> Project
        </button>
      </div>
    `;

    this.container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = (btn as HTMLElement).dataset.action;
        this.handleAction(action || '');
      });
    });
  }

  private async renderProjectPicker(): Promise<void> {
    if (!this.container) return;

    this.container.innerHTML = `<div class="clipmind-bubble__loading">Loading projects…</div>`;

    try {
      const result = await chrome.storage.local.get('clipmind_projects');
      const projects = result.clipmind_projects || [{ id: 'inbox', name: 'Inbox' }];

      this.container.innerHTML = `
        <div class="clipmind-bubble__brand">
          <span class="clipmind-bubble__logo">📁</span>
          <span>Choose Project</span>
        </div>
        <div class="clipmind-bubble__projects">
          ${projects.map((p: { id: string; name: string }) =>
            `<button class="clipmind-bubble__project-btn" data-project-id="${p.id}">${p.name}</button>`
          ).join('')}
        </div>
        <button class="clipmind-bubble__back" data-action="back">← Back</button>
      `;

      this.container.querySelectorAll('[data-project-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const projectId = (btn as HTMLElement).dataset.projectId;
          this.sendMessage('SAVE_TO_PROJECT', { projectId });
          this.hide();
        });
      });

      this.container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
        this.projectPickerOpen = false;
        this.renderButtons();
      });
    } catch {
      this.showToast('Failed to load projects', 'error');
      this.projectPickerOpen = false;
      this.renderButtons();
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'save':
        this.sendMessage('SAVE_TEXT_CLIP');
        this.hide();
        break;
      case 'summarize':
        this.sendMessage('SAVE_TEXT_CLIP_SUMMARIZE');
        this.hide();
        break;
      case 'explain':
        this.sendMessage('EXPLAIN_SELECTION');
        this.hide();
        break;
      case 'project':
        this.projectPickerOpen = true;
        this.renderProjectPicker();
        break;
    }
  }

  private sendMessage(type: string, extra: Record<string, unknown> = {}): void {
    if (!this.pageContext) return;

    chrome.runtime.sendMessage({
      type,
      payload: {
        text: this.currentText,
        pageUrl: this.pageContext.pageUrl,
        pageTitle: this.pageContext.pageTitle,
        domain: this.pageContext.domain,
        ...extra,
      },
    });
  }

  private positionBubble(rect: DOMRect): void {
    if (!this.container) return;

    const bubbleRect = this.container.getBoundingClientRect();
    let top = rect.bottom + window.scrollY + 8;
    let left = rect.left + window.scrollX + rect.width / 2 - 160;

    if (left < 8) left = 8;
    if (left + 320 > window.innerWidth) left = window.innerWidth - 328;
    if (rect.bottom + bubbleRect.height + 16 > window.innerHeight) {
      top = rect.top + window.scrollY - bubbleRect.height - 8;
    }

    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;
  }
}
