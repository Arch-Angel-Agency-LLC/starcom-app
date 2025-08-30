# Security & Compliance (MVP)

Purpose: Define boundaries ensuring snapshot generation remains safe, respectful of upstream ToS, and free of sensitive data.

## Data Scope
- ONLY public metadata: titles, authors, published dates, tags, short excerpts (<=200 chars), image URLs.
- NO full article bodies.
- NO user private info, tracking tokens, cookies.

## Sanitization
Excerpt pipeline:
1. Start with raw HTML (if available): `excerptHtml`.
2. Remove `<script>`, `<style>`, comments.
3. Strip remaining tags -> plain text.
4. Collapse whitespace to single spaces.
5. Trim.
6. Truncate at max length without cutting words; append ellipsis `…` if truncated.
7. Ensure ASCII ellipsis fallback `...` if environment lacks glyph support (client may handle display).

## URL Normalization & Safety
- Accept only `https://` scheme.
- Remove query params matching /^utm_/i.
- Disallow fragments (#...) in canonicalUrl (strip).
- For Medium adapter: host must end with `medium.com` or recognized CDN host for images.

## Hashing Integrity
- `id` sha256(url) truncated to 32 hex chars (collision risk negligible for MVP scope).
- `hash` includes core fields; prevents unnoticed silent changes.

## Rate & Politeness
- Hard per-request timeout (default 10s) to avoid hanging.
- Reasonable feed count (<25) to reduce load.
- Custom User-Agent includes contact URL/email for responsible disclosure.

## Secrets & Credentials
- No secrets required; workflow must not introduce API keys.
- Ensure GitHub Action does not log raw content larger than necessary (avoid leaking full feed bodies).

## Logging Hygiene
- Logs MUST NOT contain excerpt full text beyond truncated length.
- Logs MUST NOT include personally identifiable information (PII).

## Compliance Considerations
- Fair use: limited excerpt length; attribution via URL preserved.
- Robots.txt: Snapshot respects publicly fetchable feeds only; no scraping of restricted endpoints.

## Threat Model (MVP)
| Threat | Mitigation |
|--------|------------|
| Malicious feed alteration injecting scripts | Sanitization strips scripts; output plain text |
| Injection via tags/author fields | Escape or treat all output as plain text JSON; client rendering uses safe text nodes |
| Denial (feed stalls) | Request timeout + degraded source classification |
| Man-in-the-middle altering feed | HTTPS + host validation |

## Future Hardening (Phase 2+)
- Signature attestation of snapshot (tamper detection).
- Multi-source cross-verification (consensus detection).
- Language detection with safe library (if added, ensure no code execution risk).

## DO / DO NOT
- DO keep dependency surface minimal to reduce attack surface.
- DO validate all assumptions via tests.
- DO NOT inline untrusted HTML into the client from snapshot.
- DO NOT store personally identifying metadata beyond what feed explicitly publishes.

---
Any expansion of stored data categories must update this document and undergo a privacy/ToS check.
