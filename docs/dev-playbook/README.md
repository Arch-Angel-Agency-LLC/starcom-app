# Starcom Dev Playbook

Purpose: fast, practical guidance to ship Starcom to both Vercel (Web2) and IPFS (Web3) without relying on RelayNodes.

Contents
- build-matrix.md — knobs per target (router, base, assets, analytics)
- ipfs-deploy.md — how to prepare and validate an IPFS release
- relaynode-vs-fallback.md — recommended hierarchy and developer UX
- routing-base.md — BrowserRouter vs HashRouter and Vite base
- runtime-config.md — config.json pattern for static hosting
- pwa-offline.md — minimal PWA/offline approach and local fonts
- upload-pin-verify.md — checklist for end-to-end content flow
- serverless-pin.md — enable Pinata or Web3.Storage fallback via /api/pin

Notes
- Provider override at runtime: set `storage.pinProvider` in `public/config.json` (pinata|web3storage). The client forwards this to `/api/pin`. You can also set header `x-pin-provider` per call.
- Tests: see `test/api/pin.test.ts` for provider-misconfig and JSON pinning paths.

Guiding principles
- One codebase, two targets (vercel/ipfs); keep diffs small and explicit.
- Prefer runtime config over rebuilds where static hosting applies.
- Make privacy/analytics opt-in; never ship trackers unless enabled.
- Keep RelayNode as a premium path; ensure non-RelayNode paths are viable.
