# Snapshot Configuration (MVP)

Purpose: Define how feeds and adapter options are declared for the generator.

## File Location
`scripts/snapshot/config/feeds.json` (JSON) or `feeds.ts` (exporting a constant) — choose JSON for simple CI editing.

## Top-Level Structure
```
{
  "medium": {
    "feeds": [
      { "id": "@example", "url": "https://medium.com/feed/@example" },
      { "id": "tag-ai", "url": "https://medium.com/feed/tag/ai" }
    ]
  },
  "rss": {
    "feeds": [
      { "id": "devto", "url": "https://dev.to/feed" }
    ]
  },
  "options": {
    "excerptMaxLength": 200,
    "requestTimeoutMs": 10000,
    "userAgent": "StarcomSnapshotBot/0.1 (+https://example.org)"
  }
}
```

## Field Reference
| Path | Type | Required | Description |
|------|------|----------|-------------|
| medium.feeds[] | array | no | Medium feed allowlist entries |
| rss.feeds[] | array | no | Generic RSS feed entries |
| *.feeds[].id | string | yes | Logical identifier (unique per adapter) |
| *.feeds[].url | string | yes | Feed URL (https) |
| options.excerptMaxLength | number | no | Truncation length (default 200) |
| options.requestTimeoutMs | number | no | Per-request timeout (default 10000) |
| options.userAgent | string | no | UA header; provide contact info |

## Validation Rules
- All URLs MUST start with https://.
- IDs MUST be unique within their adapter scope.
- No trailing slash duplication (strip final slash except root).
- Maximum feeds per adapter (MVP soft cap 25) to prevent long runs.

## Environment Overrides (Optional Future)
Environment variables may override JSON values:
- `SNAPSHOT_EXCERPT_MAX` -> excerptMaxLength
- `SNAPSHOT_TIMEOUT_MS` -> requestTimeoutMs

## Example feeds.json
```
{
  "medium": {
    "feeds": [
      { "id": "@openai", "url": "https://medium.com/feed/@openai" },
      { "id": "tag-eth", "url": "https://medium.com/feed/tag/ethereum" }
    ]
  },
  "rss": { "feeds": [] },
  "options": { "excerptMaxLength": 180 }
}
```

## Loading Logic (Pseudo)
```ts
function loadConfig(path): SnapshotConfig {
  const raw = JSON.parse(fs.readFileSync(path,'utf8'));
  // validate shape (zod/ajv)
  return raw;
}
```

## Future Extensions
- `substack.feeds` adapter section
- `mirror.feeds` adapter section
- Per-feed overrides (e.g., custom excerpt length)
- Scheduling hints (priority feeds)

---
Any config shape change MUST update this file and increment generatorVersion if breaking.
