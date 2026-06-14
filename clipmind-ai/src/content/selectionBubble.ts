interface PageContext {
  pageUrl: string;
  pageTitle: string;
  domain: string;
}

type PendingAction = 'save' | 'summarize' | 'explain' | 'project';

interface SaveResult {
  status: string;
  clip?: unknown;
  message?: string;
}

export class SelectionBubble {
  private container: HTMLDivElement | null = null;
  private toast: HTMLDivElement | null = null;
  private currentText = '';
  private pageContext: PageContext | null = null;
  private projectPickerOpen = false;
  private selectionRect: DOMRect | null = null;

  containsTarget(node: Node): boolean {
    return !!this.container?.contains(node);
  }

  show(rect: DOMRect, text: string, context: PageContext): void {
    this.currentText = text;
    this.pageContext = context;
    this.projectPickerOpen = false;
    this.selectionRect = rect;

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
        const action = (btn as HTMLElement).dataset.action as PendingAction;
        this.handleAction(action);
      });
    });
  }

  private showDuplicateConfirm(action: PendingAction, projectId?: string): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="clipmind-bubble__brand">
        <span class="clipmind-bubble__logo">⚠️</span>
        <span>Already Saved</span>
      </div>
      <p class="clipmind-bubble__duplicate-msg">This content is already in your memory.</p>
      <div class="clipmind-bubble__actions">
        <button class="clipmind-bubble__btn clipmind-bubble__btn--primary" data-action="force-save">
          Save Anyway
        </button>
        <button class="clipmind-bubble__btn" data-action="cancel-duplicate">Cancel</button>
      </div>
    `;

    this.container.querySelector('[data-action="force-save"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.executeSave(action, true, projectId);
    });

    this.container.querySelector('[data-action="cancel-duplicate"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });

    if (this.selectionRect) this.positionBubble(this.selectionRect);
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
          const projectId = (btn as HTMLElement).dataset.projectId!;
          this.handleAction('project', projectId);
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

  private handleAction(action: PendingAction, projectId?: string): void {
    if (action === 'project' && !projectId) {
      this.projectPickerOpen = true;
      this.renderProjectPicker();
      return;
    }
    this.executeSave(action, false, projectId);
  }

  private executeSave(action: PendingAction, force: boolean, projectId?: string): void {
    const messageType = this.getMessageType(action);
    if (!messageType) return;

    this.sendMessage(messageType, { force, projectId }, (result) => {
      if (result?.status === 'duplicate' && !force) {
        this.showDuplicateConfirm(action, projectId);
        return;
      }
      if (result?.status === 'saved') {
        this.showToast('Saved to ClipMind ✓', 'success');
        this.hide();
      } else if (result?.status === 'error') {
        this.showToast(result.message || 'Save failed', 'error');
        this.hide();
      }
    });
  }

  private getMessageType(action: PendingAction): string | null {
    switch (action) {
      case 'save': return 'SAVE_TEXT_CLIP';
      case 'summarize': return 'SAVE_TEXT_CLIP_SUMMARIZE';
      case 'explain': return 'EXPLAIN_SELECTION';
      case 'project': return 'SAVE_TO_PROJECT';
      default: return null;
    }
  }

  private sendMessage(
    type: string,
    extra: Record<string, unknown> = {},
    onResult?: (result: SaveResult) => void
  ): void {
    if (!this.pageContext) return;

    const payload = {
      text: this.currentText,
      pageUrl: this.pageContext.pageUrl,
      pageTitle: this.pageContext.pageTitle,
      domain: this.pageContext.domain,
      ...extra,
    };

    if (onResult) {
      chrome.runtime.sendMessage({ type, payload }, (response) => {
        if (chrome.runtime.lastError) {
          onResult({ status: 'error', message: 'Extension error' });
          return;
        }
        onResult(response as SaveResult);
      });
    } else {
      chrome.runtime.sendMessage({ type, payload });
    }
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
