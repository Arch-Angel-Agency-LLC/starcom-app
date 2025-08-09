# Routing and Base Path

Why it matters
- IPFS gateways serve under /ipfs/<CID>/; deep-link refresh breaks without hash routing.
- Absolute asset paths fail under subpaths unless base is './'.

Rules
- IPFS build: HashRouter + Vite base './'
- Vercel build: BrowserRouter + base '/'

Tips
- Wrap router selection behind an env/runtime flag.
- Keep navigation and asset references relative.
