import { describe, it, expect } from 'vitest';
import { PackageComposer } from '../PackageComposer';
import { validateManifest } from '../schema';

describe('schema contract', () => {
  it('accepts valid manifest', () => {
    const { manifest } = PackageComposer.compose({
      name: 'Valid',
      description: 'ok',
      classification: 'UNCLASSIFIED',
      license: 'OPEN',
      author: 'test',
      reports: [{ id: 'r', title: 't', content: 'c' }],
      intel: [],
    });
    const res = validateManifest(manifest);
    expect(res.valid).toBe(true);
  });

  it('rejects invalid manifest', () => {
    const bad: any = {
      id: '',
      name: '',
      version: '',
      description: '',
      classification: 'PUBLIC',
      author: '',
      license: 'UNKNOWN',
      reports: [],
      intel: [],
      assets: [],
      createdAt: 'not-a-date',
      metadata: {},
    };
    const res = validateManifest(bad);
    expect(res.valid).toBe(false);
    if (res.valid === false) {
      expect(res.errors.length).toBeGreaterThan(0);
    }
  });
});
