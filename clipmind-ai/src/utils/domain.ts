export function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getFaviconUrl(pageUrl: string): string {
  try {
    const url = new URL(pageUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return '';
  }
}
