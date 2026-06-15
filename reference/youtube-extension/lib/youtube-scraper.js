/**
 * Reference YouTube scraper — patterns validated against MV3 content-script constraints.
 * ytInitialPlayerResponse requires MAIN world injection (not available here).
 */

const TITLE_SELECTORS = [
  'ytd-watch-metadata #title yt-formatted-string',
  'h1.ytd-watch-metadata yt-formatted-string',
  'h1.title yt-formatted-string',
  'yt-formatted-string.style-scope.ytd-watch-metadata'
];

const CHANNEL_SELECTORS = [
  '#owner #channel-name a',
  'ytd-channel-name a',
  '#channel-name a'
];

const DESCRIPTION_SELECTORS = [
  '#description-inline-expander #snippet-text',
  '#description-text',
  'ytd-expander #content'
];

/**
 * @param {string} selector
 * @param {number} [timeoutMs=8000]
 * @returns {Promise<Element|null>}
 */
export function waitForElement(selector, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    let settled = false;
    const finish = (el) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    };

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) finish(el);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}

/**
 * @param {string[]} selectors
 * @returns {string}
 */
export function queryText(selectors) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      const text = el?.textContent?.trim();
      if (text) return text;
    } catch {
      /* invalid selector — try next */
    }
  }
  return '';
}

/**
 * @param {string} [href=location.href]
 * @returns {string|null}
 */
export function getVideoId(href = location.href) {
  try {
    const url = new URL(href);
    const id = url.searchParams.get('v');
    if (id) return id;
  } catch {
    /* fall through */
  }

  const match = href.match(/[?&]v=([^&]+)/);
  return match?.[1] ?? null;
}

/**
 * @param {string} videoId
 * @param {'maxresdefault'|'hqdefault'|'mqdefault'} [quality]
 * @returns {string}
 */
export function getThumbnailUrl(videoId, quality = 'maxresdefault') {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * @returns {boolean}
 */
export function isWatchPage() {
  return location.pathname === '/watch' && Boolean(getVideoId());
}

/**
 * @returns {boolean}
 */
export function isStudioPage() {
  return location.hostname === 'studio.youtube.com';
}

/**
 * @returns {{ videoId: string|null, title: string, channel: string, description: string, thumbnailUrl: string|null, pageType: string }}
 */
export function extractVideoData() {
  const videoId = getVideoId();
  const title =
    queryText(TITLE_SELECTORS) ||
    document.title.replace(/\s*-\s*YouTube\s*$/i, '').trim();

  return {
    videoId,
    title,
    channel: queryText(CHANNEL_SELECTORS),
    description: queryText(DESCRIPTION_SELECTORS),
    thumbnailUrl: videoId ? getThumbnailUrl(videoId) : null,
    pageType: isStudioPage() ? 'studio' : isWatchPage() ? 'watch' : 'other'
  };
}

/**
 * SPA navigation handler with race-condition guard.
 * @param {(url: string) => void|Promise<void>} onNavigate
 * @returns {() => void}
 */
export function watchYouTubeNavigation(onNavigate) {
  let lastUrl = location.href;
  let initId = 0;

  const run = () => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    const currentInit = ++initId;
    setTimeout(async () => {
      if (currentInit !== initId) return;
      await onNavigate(lastUrl);
    }, 1200);
  };

  const observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('yt-navigate-finish', run);

  const cleanup = () => {
    observer.disconnect();
    document.removeEventListener('yt-navigate-finish', run);
  };
  window.addEventListener('pagehide', cleanup, { once: true });

  return cleanup;
}
