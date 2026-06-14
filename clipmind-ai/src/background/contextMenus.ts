const CONTEXT_MENU_ID = 'clipmind-save-image';

export function setupContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Save image to ClipMind AI',
      contexts: ['image'],
    });
  });
}

export function getContextMenuId(): string {
  return CONTEXT_MENU_ID;
}
