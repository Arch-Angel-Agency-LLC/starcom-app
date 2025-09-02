// Utility to verify geopolitical asset integrity via manifest
// Computes sha256 of fetched artifact(s) and compares to manifest hashes.
// Returns a summary with status per artifact and overall result.

export interface GeopoliticalArtifactRecord {
  path: string;
  bytes: number;
  sha256: string;
  sha1: string;
  class: string;
  note?: string;
}

export interface GeopoliticalManifest {
  generated: string;
  algorithm: string[];
  artifacts: GeopoliticalArtifactRecord[];
  summary: { count: number; totalBytes: number };
  notes?: Record<string, unknown>;
}

export interface IntegrityVerificationResult {
  ok: boolean;
  checked: number;
  mismatches: Array<{ path: string; expected: string; actual: string }>;
  artifacts: Array<{ path: string; status: 'verified' | 'mismatch' | 'skipped'; bytes: number; sha256: string }>;
  manifestTimestamp?: string;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyGeopoliticalAssets(options: {
  manifestUrl?: string;
  // Limit which classes to verify (e.g., ['topology']) for performance; default verifies topology + normalized.
  includeClasses?: string[];
  maxBytes?: number; // skip artifacts larger than this threshold
  abortSignal?: AbortSignal;
} = {}): Promise<IntegrityVerificationResult> {
  const manifestUrl = options.manifestUrl || '/geopolitical/manifest/geopolitical-manifest.json';
  try {
    const res = await fetch(manifestUrl, { cache: 'no-cache', signal: options.abortSignal });
    if (!res.ok) throw new Error('Manifest fetch failed');
    const manifest: GeopoliticalManifest = await res.json();

    const include = new Set((options.includeClasses && options.includeClasses.length) ? options.includeClasses : ['topology', 'normalized']);
    const maxBytes = options.maxBytes ?? 1_500_000; // default ~1.5MB cap

    const results: IntegrityVerificationResult = {
      ok: true,
      checked: 0,
      mismatches: [],
      artifacts: [],
      manifestTimestamp: manifest.generated
    };

    for (const art of manifest.artifacts) {
      if (!include.has(art.class)) {
        results.artifacts.push({ path: art.path, status: 'skipped', bytes: art.bytes, sha256: art.sha256 });
        continue;
      }
      if (art.bytes > maxBytes) {
        // Skip very large artifact, still mark skipped
        results.artifacts.push({ path: art.path, status: 'skipped', bytes: art.bytes, sha256: art.sha256 });
        continue;
      }
      try {
        const assetRes = await fetch('/' + art.path.replace(/^public\//, ''), { cache: 'no-cache', signal: options.abortSignal });
        if (!assetRes.ok) throw new Error('Asset fetch failed');
        const buf = await assetRes.arrayBuffer();
        const hash = await sha256Hex(buf);
        const match = hash === art.sha256;
        results.checked += 1;
        results.artifacts.push({ path: art.path, status: match ? 'verified' : 'mismatch', bytes: art.bytes, sha256: art.sha256 });
        if (!match) {
          results.ok = false;
          results.mismatches.push({ path: art.path, expected: art.sha256, actual: hash });
        }
      } catch (e) {
        results.ok = false;
        results.mismatches.push({ path: art.path, expected: art.sha256, actual: 'error' });
        results.artifacts.push({ path: art.path, status: 'mismatch', bytes: art.bytes, sha256: art.sha256 });
      }
    }

    return results;
  } catch (e) {
    return {
      ok: false,
      checked: 0,
      mismatches: [{ path: manifestUrl, expected: 'manifest', actual: 'error' }],
      artifacts: [],
      manifestTimestamp: undefined
    };
  }
}
