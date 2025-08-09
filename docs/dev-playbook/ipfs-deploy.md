# IPFS Deploy Guide

Goal: produce a static build that works on /ipfs/<CID>/ and gateways.

Steps
- Build
  - Use HashRouter
  - Set Vite base to './'
  - Ensure assets are referenced with relative paths
- Runtime config
  - Include a /config.json in dist; fetch on boot for cluster/endpoints/flags
- Upload & pin
  - Pin dist/ with your pinning provider or local node (adds all, sets index.html as root)
  - Optionally publish via DNSLink for a friendly domain
- Validate
  - Test deep links (refresh on nested routes)
  - Verify assets/fonts load via gateway
  - Optionally pre-cache via PWA for offline UX

Notes
- Avoid absolute URLs; prefer relative links for assets and internal navigation.
- Do not rely on server redirects; gateways won’t rewrite to index.html.
