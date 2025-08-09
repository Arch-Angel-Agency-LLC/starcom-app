# Minimal PWA/Offline

Goals
- Work offline or on flaky gateways
- Reduce external dependencies

Checklist
- Add manifest.json and a basic service worker
- Pre-cache index.html, main chunks, styles, fonts
- Bundle fonts locally; avoid Google Fonts CDNs
- Provide a lightweight offline screen

Caveats
- Gateways may set headers that affect SW scope; test with ipfs:// and https gateway URLs.
