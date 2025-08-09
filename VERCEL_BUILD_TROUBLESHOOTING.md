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

Debug Steps
```
npm ci
npm run build
VERCEL=1 node ./node_modules/.bin/vite build --debug
```

Capture the failing section of logs for issue reports.
