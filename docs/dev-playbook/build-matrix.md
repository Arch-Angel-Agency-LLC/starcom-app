# Build Matrix: Vercel vs IPFS

Switches
- Router
  - Vercel: BrowserRouter
  - IPFS: HashRouter
- Vite base
  - Vercel: "/"
  - IPFS: "./"
- Analytics (GA)
  - Vercel: optional, only when enabled
  - IPFS: off by default, never auto-injected
- Assets/fonts
  - Vercel: CDN or local
  - IPFS: prefer local (bundle fonts), relative URLs
- Runtime config
  - Vercel: env or config.json
  - IPFS: config.json fetched at runtime
- API/server
  - Vercel: optional serverless endpoints
  - IPFS: avoid server dependencies; use pinning APIs via gateways or RelayNode

Env examples
- VITE_TARGET=vercel | ipfs
- VITE_ROUTER_MODE=browser | hash

Scripts (suggested)
- build:vercel — default vite build
- build:ipfs — vite build with base './' and router=hash
