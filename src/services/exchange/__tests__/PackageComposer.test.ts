import { describe, it, expect } from 'vitest';
import { PackageComposer } from '../PackageComposer';
import { validateManifest } from '../schema';

describe('PackageComposer', () => {
  it('composes a manifest with deterministic fields and valid schema', () => {
    const input = {
      name: 'Test Package',
      description: 'A test package',
      classification: 'UNCLASSIFIED' as const,
      license: 'CC0' as const,
      author: 'tester',
      reports: [{ id: 'r1', title: 'Report 1', content: 'alpha' }],
      intel: [{ id: 'i1', title: 'Intel 1', content: 'beta' }],
      assets: [{ filename: 'note.txt', content: 'hello' }],
      analysisDeepLink: 'app://analyzer?board=123'
    };

    const { manifest, blob } = PackageComposer.compose(input);

    expect(manifest.id).toMatch(/^pkg-/);
    expect(manifest.name).toBe('Test Package');
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.reports[0]).toMatchObject({ id: 'r1', title: 'Report 1' });
    expect(typeof manifest.reports[0].checksum).toBe('string');
    expect(manifest.intel[0]).toMatchObject({ id: 'i1', title: 'Intel 1' });
    expect(typeof manifest.intel[0].checksum).toBe('string');
    expect(manifest.assets[0].filename).toBe('note.txt');
    expect(manifest.assets[0].size).toBe(5);
    expect(manifest.metadata).toHaveProperty('analysisDeepLink', 'app://analyzer?board=123');

    // blob should be JSON of manifest
    expect(blob.type).toBe('application/json');

    // schema validation
    const result = validateManifest(manifest);
    if (result.valid === false) {
      // helpful debug if fails
      // eslint-disable-next-line no-console
      console.error(result.errors);
    }
    expect(result.valid).toBe(true);
  });

  it('fails schema validation for bad manifest', () => {
    const bad: any = { id: '', name: '', version: '', description: '', classification: 'PUBLIC' };
    const res = validateManifest(bad);
    expect(res.valid).toBe(false);
  });
});
