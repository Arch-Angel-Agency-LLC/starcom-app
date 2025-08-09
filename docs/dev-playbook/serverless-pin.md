# Serverless Pinning (Pinata)

This fallback lets the app upload content to IPFS via a serverless endpoint when a local RelayNode isn’t available.

## Configure

- Provider (server):
  - Pinata: set PIN_PROVIDER=pinata and PINATA_JWT
  - Web3.Storage: set PIN_PROVIDER=web3storage and WEB3STORAGE_TOKEN
- Frontend toggle (build/runtime):
  - Build-time: set VITE_PIN_API=true (e.g., `npm run build:vercel:pin`).
  - Runtime: optional public/config.json with `features.serverlessPin: true`.
  - Provider at runtime (no rebuild): set `storage.pinProvider` to `pinata` or `web3storage` in `public/config.json`. The client sends this to the API automatically. You can also override per-request with header `x-pin-provider`.

## How it works

- Client calls RelayNodeIPFSService.uploadContent.
- If RelayNode isn’t detected and serverless pin is enabled, it POSTs to `/api/pin`.
- `/api/pin` uses your configured provider (Pinata or Web3.Storage) to pin JSON or binary content.
- On success, the client receives `{ cid, size }` and returns a standard IPFSUploadResult.

## Verify

- Check the status badge in-app: `IPFS: Serverless Pin`.
- Observe CID on a public gateway: `https://ipfs.io/ipfs/<cid>`.

## Security

- JWT is server-side only. Never expose it in the client.
- Content is posted to your serverless route; consider size limits and abuse protection if needed.

## Troubleshooting

- 501 Not Implemented: ensure provider env vars are set (see above).
- 4xx/5xx from provider: check JWT validity/plan limits.
- Large payloads: consider chunking or adding limits; for CAR support, add a separate endpoint.
