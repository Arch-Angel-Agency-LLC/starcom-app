# Entity Resolution Specification (Draft)

Goals
- Canonicalize entities across sources/packages.
- Manage aliases and duplicates with merge/split workflows.

Core concepts
- Canonical ID: deterministic UUID from key attributes or registry assignment.
- Alias relations: alias_of, same_as edges with provenance.
- Merge: two nodes → one canonical; redirect references; keep audit trail.
- Split: one node → multiple; redistribute edges; record reasoning.

API (sketch)
- resolveEntities(candidates: EntityCandidate[]): ResolutionResult
- mergeEntities(canonicalId, duplicateId, reason, evidenceIds)
- splitEntity(canonicalId, newEntities[], reason, evidenceIds)
- getCanonical(idOrAlias): canonicalId

UX
- Review queue with suggested merges (similarity, co-occurrence, shared identifiers).
- Explainability: show features used to suggest a merge.

Persistence
- Store canonical registry; maintain alias index; immutable audit records.
