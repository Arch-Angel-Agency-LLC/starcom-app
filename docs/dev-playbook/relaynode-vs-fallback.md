# RelayNode vs Fallback

Hierarchy
- Preferred: RelayNode (local/team node)
  - Features: team-aware pinning, replication, events
- Fallback: client-side or managed pinning
  - Helia (browser) or serverless pin API

Developer UX
- Detect RelayNode via /api/capabilities
- Surface status in UI: RelayNode connected vs Fallback
- Keep a single upload gateway (orchestrator) that picks the path

Recommendations
- Do not block on RelayNode; ensure a working fallback always exists.
- Treat IPFSService (mock) as test-only; provide a real fallback for production.
