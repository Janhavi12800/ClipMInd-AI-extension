import { SelectionBubble } from './selectionBubble';

const bubble = new SelectionBubble();
let bubbleEnabled = true;

function loadSettings(): void {
  chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
    if (!chrome.runtime.lastError && response?.settings) {
      bubbleEnabled = response.settings.showSelectionBubble !== false;
    }
  });
}

loadSettings();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.clipmind_settings) {
    bubbleEnabled = changes.clipmind_settings.newValue?.showSelectionBubble !== false;
  }
});

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function getSelectedText(): string {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return '';
  return selection.toString().trim();
}

function handleMouseUp(e: MouseEvent): void {
  if (!bubbleEnabled) return;

  if (isEditableElement(e.target as Element)) {
    bubble.hide();
    return;
  }

  setTimeout(() => {
    const text = getSelectedText();
    if (!text || text.length < 2) {
      bubble.hide();
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    bubble.show(rect, text, {
      pageUrl: window.location.href,
      pageTitle: document.title,
      domain: window.location.hostname.replace(/^www\./, ''),
    });
  }, 10);
}

function handleScroll(): void {
  bubble.hide();
}

function handleMouseDown(e: MouseEvent): void {
  if (!bubble.containsTarget(e.target as Node)) {
    bubble.hide();
  }
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') bubble.hide();
}

document.addEventListener('mouseup', handleMouseUp, true);
document.addEventListener('mousedown', handleMouseDown, true);
document.addEventListener('scroll', handleScroll, true);
document.addEventListener('keydown', handleKeyDown, true);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CLIP_SAVED') {
    bubble.showToast('Saved to ClipMind ✓', 'success');
  } else if (message.type === 'CLIP_DUPLICATE') {
    bubble.showToast('Already saved', 'warning');
  } else if (message.type === 'CLIP_ERROR') {
    bubble.showToast(message.payload?.message || 'Save failed', 'error');
  }
});
