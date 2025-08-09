import { describe, it, expect } from 'vitest';

interface LegacyView { id: string; name: string; filters: any; physics: any; createdAt: number; }
interface SavedViewV2 extends LegacyView { version: 2; sizingMode: 'degree'|'confidence'; layoutFrozen: boolean; isolate?: { rootId: string; depth: number } | null; }

function migrate(views: (LegacyView | SavedViewV2)[], isolateActive = false, isolateRoot?: string, isolateDepth = 1, frozen = false): SavedViewV2[] {
  return views.map(v => {
    if ((v as any).version === 2) return v as SavedViewV2;
    const legacy = v as LegacyView;
    return {
      id: legacy.id,
      name: legacy.name,
      filters: legacy.filters,
      physics: legacy.physics,
      createdAt: legacy.createdAt,
      version: 2,
      sizingMode: 'degree',
      layoutFrozen: frozen,
      isolate: isolateActive && isolateRoot ? { rootId: isolateRoot, depth: isolateDepth } : null
    };
  });
}

describe('Saved Views migration', () => {
  it('migrates legacy views to v2 schema', () => {
    const legacy: LegacyView = { id: '1', name: 'Test', filters: { a:1 }, physics: { b:2 }, createdAt: Date.now() };
    const result = migrate([legacy], true, 'nodeA', 2, true);
    expect(result[0].version).toBe(2);
    expect(result[0].sizingMode).toBe('degree');
    expect(result[0].layoutFrozen).toBe(true);
    expect(result[0].isolate).toEqual({ rootId: 'nodeA', depth: 2 });
  });
  it('preserves v2 views unchanged', () => {
    const v2: SavedViewV2 = { id: '2', name: 'V2', filters:{}, physics:{}, createdAt: Date.now(), version: 2, sizingMode: 'confidence', layoutFrozen: false, isolate: null };
    const result = migrate([v2]);
    expect(result[0]).toEqual(v2);
  });
});
