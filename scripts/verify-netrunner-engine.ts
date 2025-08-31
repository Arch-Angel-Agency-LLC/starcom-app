#!/usr/bin/env tsx
/**
 * Pre-build verification for NetRunner engine module resolution.
 * Ensures critical engine files exist with exact casing & logs their resolved paths.
 */
import { statSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const required = [
  'src/applications/netrunner/scripts/engine/NetRunnerScriptsUIService.ts',
  'src/applications/netrunner/scripts/engine/NetRunnerScriptRegistry.ts',
  'src/applications/netrunner/scripts/engine/ScriptExecutionEngine.ts',
  'src/netrunnerEngine.ts'
];

let ok = true;
console.log('\n[verify-netrunner-engine] Starting engine file verification');
for (const f of required) {
  const abs = resolve(f);
  if (!existsSync(abs)) {
    console.error(`[verify-netrunner-engine] MISSING: ${f}`);
    ok = false;
    continue;
  }
  try {
    const st = statSync(abs);
    console.log(`[verify-netrunner-engine] OK: ${f} size=${st.size}B mtime=${st.mtime.toISOString()}`);
  } catch (e) {
    console.error(`[verify-netrunner-engine] ERROR reading ${f}:`, e);
    ok = false;
  }
}

// Attempt dynamic import to surface resolver issues early.
(async () => {
  try {
    const mod = await import('../src/netrunnerEngine.ts');
    const keys = Object.keys(mod).sort();
    console.log(`[verify-netrunner-engine] Dynamic import succeeded. Export keys: ${keys.join(', ') || '(none)'}`);
  } catch (e) {
    console.error('[verify-netrunner-engine] Dynamic import FAILED for src/netrunnerEngine.ts');
    console.error(e);
    ok = false;
  }
  if (!ok) {
    console.error('\n[verify-netrunner-engine] FAILURE: One or more verification checks failed.');
    process.exit(1);
  } else {
    console.log('\n[verify-netrunner-engine] SUCCESS: All engine files verified.');
  }
})();
