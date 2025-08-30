import { createHash } from 'crypto';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function idFromUrl(url: string): string {
  const h = sha256Hex(url);
  return h.slice(0, 32);
}

export function contentHash(fields: {
  canonicalUrl: string;
  title: string;
  author: string;
  publishedAt: string;
  excerpt?: string;
  image?: string | null;
  readingTimeMin?: number;
}): string {
  const parts = [
    fields.canonicalUrl || '',
    fields.title || '',
    fields.author || '',
    fields.publishedAt || '',
    fields.excerpt || '',
    fields.image || '',
    fields.readingTimeMin != null ? String(fields.readingTimeMin) : ''
  ];
  const hex = sha256Hex(parts.join('\n'));
  return `sha256:${hex}`;
}
