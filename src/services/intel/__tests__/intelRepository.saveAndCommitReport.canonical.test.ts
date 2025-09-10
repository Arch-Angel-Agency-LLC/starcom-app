import { describe, it, expect } from 'vitest';
import { IntelRepositoryService } from '../../IntelRepositoryService';

describe('IntelRepositoryService.saveAndCommitReport (canonical fallback)', () => {
  it('writes canonical .intelReport via serializer when given legacy-like report input', async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const gitCalls: string[][] = [];

    const repo = new IntelRepositoryService(
      '/virtual-workspace',
      undefined,
      {
        fileWriter: async (path, content) => { writes.push({ path, content }); },
        gitExec: async (args) => {
          gitCalls.push(args);
          // Return plausible outputs for commands used by init/commit
          const key = args.join(' ');
          if (key.startsWith('status --porcelain')) return 'M reports/test.intelReport';
          if (key.startsWith('rev-parse HEAD')) return 'abc123\n';
          return '';
        }
      }
    );

    // Initialize to satisfy ensureInitialized
    await repo.initRepository();

    const legacyLike = {
      id: 'r-save-1',
      title: 'Legacy Input',
      content: { alpha: 1, bravo: 'two' }
    } as unknown as { id: string; title: string; content: unknown };

    await repo.saveAndCommitReport(legacyLike as any);

    // Find the write for the canonical path
    const write = writes.find(w => w.path === `reports/${legacyLike.id}.intelReport`);
    expect(write).toBeTruthy();
  const obj = JSON.parse(write!.content);
  expect(obj.schema).toBe('intel.report');
  expect(obj.schemaVersion).toBe(1);
    expect(obj.id).toBe(legacyLike.id);
    expect(obj.title).toBe('Legacy Input');
    expect(typeof obj.createdAt).toBe('string');
    expect(typeof obj.updatedAt).toBe('string');
  });
});
