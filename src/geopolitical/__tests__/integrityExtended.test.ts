import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyGeopoliticalAssets } from '../integrity/verifyGeopoliticalAssets';

// Reusable helper to build manifest + asset environment
function buildManifestEnv({ content, path = 'public/geopolitical/topology/world-borders.topology.json', bytes, tamper }: { content: string; path?: string; bytes?: number; tamper?: boolean }) {
  const realContent = content;
  const tampered = tamper ? content.replace(/}/,' "x":1}') : content;
  const manifest = {
    generated: new Date().toISOString(),
    algorithm: ['sha256','sha1'],
    artifacts: [ { path, bytes: bytes ?? realContent.length, sha256: '', sha1: 'dummy', class: 'topology' } ],
    summary: { count: 1, totalBytes: bytes ?? realContent.length }
  } as any;
  (global as any).fetch = vi.fn(async (url: string) => {
    if (url.endsWith('geopolitical-manifest.json')) {
      if (!manifest.artifacts[0].sha256) {
        // compute sha256 via subtle
        const enc = new TextEncoder().encode(realContent);
        const hashBuf = await crypto.subtle.digest('SHA-256', enc);
        manifest.artifacts[0].sha256 = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      }
      return new Response(JSON.stringify(manifest), { status: 200 });
    }
    if (url.endsWith(path.replace('public/',''))) {
      return new Response(tamper ? tampered : realContent, { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
  return manifest;
}

describe('Integrity Verification - extended scenarios', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('detects hash mismatch when asset tampered', async () => {
    buildManifestEnv({ content: JSON.stringify({ arcs: [] }), tamper: true });
    const res = await verifyGeopoliticalAssets({ includeClasses: ['topology'] });
    expect(res.ok).toBe(false);
    expect(res.mismatches.length).toBe(1);
    expect(res.artifacts[0].status).toBe('mismatch');
  });

  it('skips large artifact when exceeding maxBytes', async () => {
    const manifest = buildManifestEnv({ content: JSON.stringify({ arcs: [] }), bytes: 2_000_000 });
    const res = await verifyGeopoliticalAssets({ includeClasses: ['topology'], maxBytes: 100 });
    expect(res.ok).toBe(true); // ok because nothing mismatched
    expect(res.artifacts[0].status).toBe('skipped');
    expect(res.checked).toBe(0);
    expect(res.mismatches.length).toBe(0);
    expect(res.artifacts[0].bytes).toBe(manifest.artifacts[0].bytes);
  });

  it('filters by includeClasses (normalized excluded)', async () => {
    const content = JSON.stringify({ arcs: [] });
    const manifest = {
      generated: new Date().toISOString(),
      algorithm: ['sha256','sha1'],
      artifacts: [
        { path: 'public/geopolitical/topology/world-borders.topology.json', bytes: content.length, sha256: '', sha1: 'd', class: 'topology' },
        { path: 'public/geopolitical/normalized/world-borders-lod0.normalized.json', bytes: content.length, sha256: '', sha1: 'd', class: 'normalized' }
      ],
      summary: { count: 2, totalBytes: content.length * 2 }
    };
    (global as any).fetch = vi.fn(async (url: string) => {
      if (url.endsWith('geopolitical-manifest.json')) {
        for (const art of manifest.artifacts) {
          if (!art.sha256) {
            const enc = new TextEncoder().encode(content);
            const hashBuf = await crypto.subtle.digest('SHA-256', enc);
            art.sha256 = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
          }
        }
        return new Response(JSON.stringify(manifest), { status: 200 });
      }
      if (url.includes('world-borders.topology')) return new Response(content, { status: 200 });
      if (url.includes('normalized')) return new Response(content, { status: 200 });
      return new Response('nf', { status: 404 });
    });
    const res = await verifyGeopoliticalAssets({ includeClasses: ['topology'] });
    expect(res.artifacts.length).toBe(2); // one verified, one skipped
    const topo = res.artifacts.find(a=>a.path.includes('topology'))!;
    const norm = res.artifacts.find(a=>a.path.includes('normalized'))!;
    expect(topo.status).toBe('verified');
    expect(norm.status).toBe('skipped');
  });
});
