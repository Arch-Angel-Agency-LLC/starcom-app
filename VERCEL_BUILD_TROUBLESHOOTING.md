## Vercel Build Troubleshooting

Symptoms & Fixes

1. Build Fails: Cannot find module '@noble/ed25519'
	- Ensure dependency present in package.json; run fresh install.
2. Route /api/* errors locally but not on Vercel
	- Check that files are under root `api/` folder; avoid TypeScript in API if not configured.
3. Large Lambda Size
	- Remove unused code paths; keep `/api/pin` slim. Avoid bundling test-only libs.
4. IPFS Build Behavior Appears
	- Confirm VITE_TARGET not set to ipfs in Vercel project settings.
5. Missing runtime config
	- If relying on config.json ensure it is included (public/ directory) and not gitignored.
6. Vercel-only "Could not resolve" for a local relative import (Rollup error) while local build succeeds
	- Root Cause: Overbroad `.vercelignore` pattern (e.g. `scripts/`) excluded a nested source subtree whose directory name matched (`src/.../scripts/...`). Files never uploaded -> Rollup failed to resolve re-export paths.
	- Fix: Anchor ignore to root (`/scripts/`) and explicitly re-include needed nested paths with `!src/applications/netrunner/scripts/engine/**` (or rename the nested folder to avoid collision).
	- Signal: Verification/guard scripts themselves absent from Vercel logs (they were ignored too). Local dynamic import works; Vercel fails late in build graph.
	- Prevention Checklist:
		1. Review `.vercelignore` for generic unanchored directory names.
		2. Simulate deploy file set: `git archive HEAD | tar -tf - | grep <critical-file>`.
		3. Add a pre-build verifier to assert existence of critical source files (and ensure the verifier file isn't ignored).
		4. Prefer specific ignores (root-anchored) over broad recursive patterns when directory names are reused in source.
		5. If only remote fails, check upload inclusion BEFORE refactoring import paths.

Debug Steps
```
npm ci
npm run build
VERCEL=1 node ./node_modules/.bin/vite build --debug
```

Capture the failing section of logs for issue reports.
