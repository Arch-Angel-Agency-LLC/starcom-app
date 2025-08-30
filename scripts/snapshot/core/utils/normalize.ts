export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Only https allowed
    if (u.protocol !== 'https:') {
      u.protocol = 'https:';
    }
    // Remove tracking params
    const params = u.searchParams;
    const toDelete: string[] = [];
    params.forEach((_v, k) => {
      if (/^utm_/i.test(k)) toDelete.push(k);
    });
    toDelete.forEach((k) => params.delete(k));
    u.hash = '';
    // Normalize trailing slash (remove if not root)
    if (u.pathname.endsWith('/') && u.pathname !== '/') {
      u.pathname = u.pathname.replace(/\/+$/, '');
    }
    return u.toString();
  } catch {
    return raw;
  }
}

export function sanitizeTags(tags?: string[]): string[] | undefined {
  if (!tags || !Array.isArray(tags)) return undefined;
  const set = new Set<string>();
  for (const t of tags) {
    const s = (t || '').toLowerCase().trim();
    if (s) set.add(s);
  }
  return Array.from(set).sort();
}

export function sanitizeExcerpt(htmlOrText: string, maxLen = 200): string {
  let text = htmlOrText
    // remove scripts/styles
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // strip tags
    .replace(/<[^>]+>/g, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  // truncate at word boundary
  const slice = text.slice(0, maxLen + 1);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 0 ? slice.slice(0, lastSpace) : slice.slice(0, maxLen)).trim() + '…';
}
