import { describe, it, expect, beforeEach } from 'vitest';
import { deriveWorkspaceHash, loadViews, saveViews, saveLastView, loadLastView, type ViewV2 } from '../viewStorage';
import type { FilterState } from '../../../state/FilterContext';

const WS = () => deriveWorkspaceHash({ reportIds: ['r1','r2'], itemIds: ['i1','i2','i3'], name: 'test' });

describe('viewStorage', () => {
  let workspaceHash: string;
  beforeEach(() => {
    workspaceHash = WS();
    // Clear relevant keys
    const viewsKey = `analyzer:graph:v2:${workspaceHash}:views`;
    const lastKey = `analyzer:graph:v2:${workspaceHash}:lastView`;
    localStorage.removeItem(viewsKey);
    localStorage.removeItem(lastKey);
  });

  it('loads empty views initially', () => {
    const views = loadViews(workspaceHash);
    expect(views).toEqual([]);
  });

  it('saves and loads views', () => {
    const filters: FilterState = { tags: ['a'], categories: ['c'] };
    const v: ViewV2 = {
      id: '1',
      name: 'Test',
      createdAt: Date.now(),
      filters,
      showClusters: true,
      layoutFrozen: false,
      sizingMode: 'degree',
      isolate: { rootId: 'n1', depth: 1 }
    };
    saveViews(workspaceHash, [v]);
    const loaded = loadViews(workspaceHash);
    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe('Test');
    expect(loaded[0].sizingMode).toBe('degree');
  });

  it('saves and loads last view pointer', () => {
    saveLastView(workspaceHash, 'abc');
    const id = loadLastView(workspaceHash);
    expect(id).toBe('abc');
  });
});
