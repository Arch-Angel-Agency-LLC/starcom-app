import type { ViewV2 } from './viewStorage';

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function isUniqueName(name: string, views: ViewV2[]): boolean {
  const n = norm(name);
  return !views.some(v => norm(v.name) === n);
}

export function validateViewName(name: string, views: ViewV2[]): { ok: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: false, error: 'Name is required' };
  if (trimmed.length > 60) return { ok: false, error: 'Name must be 1–60 characters' };
  if (!isUniqueName(trimmed, views)) return { ok: false, error: 'Name must be unique' };
  return { ok: true };
}

export function dedupeName(base: string, views: ViewV2[]): string {
  const MAX_TRIES = 1000;
  const root = base.trim().slice(0, 60);
  if (isUniqueName(root, views)) return root;
  let i = 2;
  while (i < MAX_TRIES) {
    const candidate = `${root} (copy ${i})`.slice(0, 60);
    if (isUniqueName(candidate, views)) return candidate;
    i++;
  }
  // Fallback: timestamp suffix
  const suffix = ` ${Date.now()}`;
  return (root + suffix).slice(0, 60);
}
