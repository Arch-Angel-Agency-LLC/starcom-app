# Decision Log

Purpose: Record key decisions with rationale to guide future changes.

## 2025-08-11 — ID Hashing = sha256(url) trunc32
- Alternatives: UUIDv5(url), full sha256.
- Chosen: trunc32 for compactness and deterministic stability.
- Consequence: Negligible collision risk; if ever observed, escalate to full 64 hex in v2.

## 2025-08-11 — Excerpt Limit = 200 chars
- Alternatives: 120, 300, unlimited.
- Chosen: 200 to balance context vs fair use and payload size.
- Consequence: Clients show concise previews; can bump in minor if needed (non-breaking).

## 2025-08-11 — Feed-First Extraction (No DOM Parsing in MVP)
- Alternatives: Add OpenGraph/JSON-LD parsing now.
- Chosen: Keep MVP small; reduce failure surface.
- Consequence: Some items lack images/subtitles; acceptable for Phase 1.

## 2025-08-11 — Deterministic Ordering by id
- Alternatives: Order by publishedAt or source order.
- Chosen: id ordering prevents reordering diffs when feeds shuffle.
- Consequence: UI should re-sort as desired client-side.

## 2025-08-11 — Quality Gates (>=90% required fields, avgConfidence>=0.75)
- Rationale: Avoid committing degraded snapshots.
- Consequence: Some runs may skip writes; CI remains green but no snapshot update.

## 2025-08-11 — No Secrets / API Keys
- Rationale: Keep CI simple, auditable, fork-friendly.
- Consequence: Only public endpoints used; no 3rd-party APIs in MVP.

---
When revisiting decisions, add new entries rather than modifying prior ones; cross-link affected docs if a decision changes.
