// Analyzer GraphView — Saved Views Storage (v2)
// Keys are scoped by a derived workspace hash to avoid collisions.
import type { FilterState } from '../../state/FilterContext';

export type SizingMode = 'fixed' | 'degree';

export interface ViewV2 {
  id: string;
  name: string;
  createdAt: number;
  filters: FilterState;
  showClusters: boolean;
  layoutFrozen: boolean;
  sizingMode: SizingMode;
  isolate?: { rootId: string; depth: number } | null;
}

function stableHash(input: string): string {
  // Small, deterministic non-crypto hash
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(36);
}

export function deriveWorkspaceHash(source: { reportIds: string[]; itemIds: string[]; name?: string }): string {
  const sig = `${source.name || ''}|r:${source.reportIds.slice(0, 25).join(',')}|i:${source.itemIds
    .slice(0, 50)
    .join(',')}|rc:${source.reportIds.length}|ic:${source.itemIds.length}`;
  return stableHash(sig);
}

export function viewsKey(workspaceHash: string) {
  return `analyzer:graph:v2:${workspaceHash}:views`;
}
export function lastViewKey(workspaceHash: string) {
  return `analyzer:graph:v2:${workspaceHash}:lastView`;
}

export function loadViews(workspaceHash: string): ViewV2[] {
  try {
    const raw = localStorage.getItem(viewsKey(workspaceHash));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ViewV2[];
    // Basic shape validation
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('viewStorage.loadViews failed', e);
    return [];
  }
}

export function saveViews(workspaceHash: string, views: ViewV2[]) {
  try {
    localStorage.setItem(viewsKey(workspaceHash), JSON.stringify(views));
  } catch (e) {
    console.warn('viewStorage.saveViews failed', e);
  }
}

export function saveLastView(workspaceHash: string, id: string) {
  try {
    localStorage.setItem(lastViewKey(workspaceHash), JSON.stringify({ id }));
  } catch (e) {
    console.warn('viewStorage.saveLastView failed', e);
  }
}

export function loadLastView(workspaceHash: string): string | null {
  try {
    const raw = localStorage.getItem(lastViewKey(workspaceHash));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: string } | null;
    return parsed?.id || null;
  } catch {
    return null;
  }
}

export function clearLastView(workspaceHash: string) {
  try {
    localStorage.removeItem(lastViewKey(workspaceHash));
  } catch (e) {
    console.warn('viewStorage.clearLastView failed', e);
  }
}
