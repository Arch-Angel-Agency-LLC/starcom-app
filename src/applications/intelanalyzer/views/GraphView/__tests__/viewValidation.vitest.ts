import { describe, it, expect } from 'vitest';
import { isUniqueName, validateViewName, dedupeName } from '../viewValidation';

const views = [
  { id: '1', name: 'Alpha', createdAt: 1, filters: {}, showClusters: true, layoutFrozen: false, sizingMode: 'fixed' },
  { id: '2', name: 'Bravo', createdAt: 2, filters: {}, showClusters: false, layoutFrozen: true, sizingMode: 'degree' },
] as any[];

describe('viewValidation', () => {
  it('detects unique names case-insensitively', () => {
    expect(isUniqueName('alpha', views as any)).toBe(false);
    expect(isUniqueName('Alpha ', views as any)).toBe(false);
    expect(isUniqueName('Charlie', views as any)).toBe(true);
  });

  it('validates length and uniqueness', () => {
    expect(validateViewName('', views as any).ok).toBe(false);
    expect(validateViewName('A'.repeat(61), views as any).ok).toBe(false);
    expect(validateViewName('Bravo', views as any).ok).toBe(false);
    expect(validateViewName('Delta', views as any).ok).toBe(true);
  });

  it('dedupes copy names', () => {
    // When the copy name is unique, return it as-is
    const name1 = dedupeName('Alpha (copy)', views as any);
    expect(name1.toLowerCase()).toBe('alpha (copy)');
    // When the copy name already exists, generate a distinct variant
    const views2 = [...views, { id: '3', name: 'Alpha (copy)', createdAt: 3, filters: {}, showClusters: false, layoutFrozen: false, sizingMode: 'fixed' }];
    const name1b = dedupeName('Alpha (copy)', views2 as any);
    expect(name1b.toLowerCase()).not.toBe('alpha (copy)');
    expect(name1b.toLowerCase().startsWith('alpha (copy')).toBe(true);
    // Unrelated names remain unchanged
    const name2 = dedupeName('Charlie', views as any);
    expect(name2).toBe('Charlie');
  });
});
