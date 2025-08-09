## Build Debugging Guide

Purpose: quick triage steps when Vercel/IPFS builds fail.

Common Issues
1. Type errors (tsc) – run `npm run typecheck` locally; ensure netrunner tsconfig included only necessary paths.
2. Missing env vars – verify PINATA_JWT / WEB3STORAGE_TOKEN set for `/api/pin`.
3. IPFS base path – confirm `VITE_TARGET=ipfs` to force `base='./'` and HashRouter.
4. Duplicate tests – remove redundant JS/TS duplicates to reduce build time.
5. Large serverless bundle – ensure transitional endpoints stay minimal; avoid pulling client-only deps.

Rapid Checklist
- npm ci
- npm run lint
- npm run build
- npm run preview (spot-check routes)

If still failing, capture the exact failing command output and open an issue with the log section.
